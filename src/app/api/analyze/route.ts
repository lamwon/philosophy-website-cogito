import { NextRequest } from "next/server";

const DEEPSEEK_PROXY = process.env.DEEPSEEK_PROXY_URL || "http://127.0.0.1:15721/anthropic/v1/messages";
const MODEL = "deepseek-v4-flash";

export async function POST(req: NextRequest) {
  try {
    const { question, philosopher, isMismatch, oppositeName } = await req.json();

    if (!question || !philosopher) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 快速模式：用户问题 + 哲学家基本信息 + 经典原文 → 紧扣原文的分析
    const prompt = `## 任务
用户问了这样一个问题："${question}"
请用${philosopher.name}（${philosopher.school}）的思想来回应。必须引用他/她的原文进行分析。

## 哲学家档案
姓名：${philosopher.name}
流派：${philosopher.school}
时代：${philosopher.era}
核心思想：${philosopher.summary}
经典名言：${philosopher.famousQuote || ""}
代表作：${philosopher.keyWorks?.join("、") || ""}

${isMismatch ? "## 注意\n用户故意选了一位看起来不相关的哲学家。请先指出这种错位的趣味，然后仍然严格引用其原文来分析。" : ""}

## 铁律（必须遵守）
1. 每一段都必须以"你问"${question}""或直接引用用户提问原文开头
2. 每一段正文中必须至少再出现一次用户提问原文
3. 用"你"称呼用户，口语化
4. 紧扣"${question}"展开，不跑题

## 输出结构
【一句话说清楚】引用一句原文，说明对"${question}"的启发（20字内）
【生活类比】把原文思想类比到用户的生活场景（150字内）
【原文分析】直接引用经典原文，逐句解析，并关联到"${question}"（200-300字）
【行动建议】给用户3条基于该哲学家思想的行动建议`;

    const deepseekRes = await fetch(DEEPSEEK_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sk-placeholder",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("DeepSeek API error:", deepseekRes.status, errText);
      return new Response(
        JSON.stringify({ error: `DeepSeek API error: ${deepseekRes.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Transform DeepSeek SSE stream to our SSE format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepseekRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;
              if (!trimmed.startsWith("data: ")) continue;

              try {
                const jsonStr = trimmed.slice(6);
                const data = JSON.parse(jsonStr);

                const text =
                  data.delta?.text ||
                  data.type === "content_block_delta" && data.delta?.text ||
                  "";

                if (text) {
                  const sseData = JSON.stringify({ text });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }

          // Send done event
          controller.enqueue(encoder.encode("data: {\"done\":true}\n\n"));
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("API route error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
