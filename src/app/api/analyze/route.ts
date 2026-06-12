import { NextRequest } from "next/server";

// ── Provider 优先级列表（按顺序尝试） ──
// 1. DashScope 阿里云百炼（免费额度）
// 2. DeepSeek 自费保底

const PROVIDERS = [
  {
    name: "DashScope",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiKey: process.env.DASHSCOPE_API_KEY || "",
    model: "qwen-turbo",
    format: "openai" as const,
  },
  {
    name: "DeepSeek",
    baseUrl: process.env.DEEPSEEK_PROXY_URL || "http://127.0.0.1:15721/anthropic/v1/messages",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: "deepseek-v4-flash",
    format: "anthropic" as const,
  },
];

export async function POST(req: NextRequest) {
  try {
    const { question, philosopher, isMismatch, oppositeName } = await req.json();

    if (!question || !philosopher) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 构建 prompt（两种 API 格式通用）
    const prompt = `## 任务
用户的问题是：「${question}」
请用${philosopher.name}（${philosopher.school}）的思想来回应。像一位懂哲学的朋友在聊天那样——先理解用户的处境，再用哲学家的理论去分析。

## 哲学家档案
姓名：${philosopher.name}
流派：${philosopher.school}
时代：${philosopher.era}
核心思想：${philosopher.summary}
经典名言：${philosopher.famousQuote || ""}
代表作：${philosopher.keyWorks?.join("、") || ""}

${isMismatch ? "## 注意\n用户刻意选了一位看起来不相关的哲学家。请幽默地承认这种错位，然后仍然严格用TA的思想框架来回应。" : ""}

## 硬性规则
1. 先用自己的话复述用户问题的核心矛盾（不超过两句话）
2. 至少三次直接引用用户原文（用引号标注），进行哲学剖析
3. 建议必须来自这位哲学家特有的方法，不能给通用的"三步走"
4. 不要用"你以为你在问X，其实……"这种万能开头
5. 如果要提供其他视角，必须是另一位真实哲学家的具体观点
6. 用"你"称呼用户，口语化，像朋友聊天

## 输出结构（用【】标记每一段，一共5段）
【你的盲点】先指出用户问题里隐藏的预设，用原文点破（100字内）
【生活类比】把哲学家的核心思想类比到用户的生活场景，必须是一个具体画面（150字内）
【哲思解剖】引用哲学家原文逐句解析，关联到用户的具体困惑（200-300字）
【指向行动】给一个今天就能做的具体动作——不是"写下来贴墙上"，而是可执行的日常行动（100-150字）
【另一种可能】相反流派的观点，说明两种视角各有局限（100字内）`;

    // 逐级尝试 provider
    let lastError = "";
    for (const provider of PROVIDERS) {
      if (!provider.apiKey || provider.apiKey === "***") {
        console.warn(`${provider.name}: 未配置 API Key，跳过`);
        continue;
      }

      try {
        const result = await tryProvider(provider, prompt);
        if (result) return result;
      } catch (err: any) {
        lastError = `${provider.name} 失败: ${err.message}`;
        console.warn(lastError);
        // 继续尝试下一个
      }
    }

    // 全部失败
    console.error("所有 provider 都失败了:", lastError);
    return new Response(
      JSON.stringify({ error: "AI service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("API route error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ── 尝试单个 provider ──
async function tryProvider(
  provider: { name: string; baseUrl: string; apiKey: string; model: string; format: "openai" | "anthropic" },
  prompt: string
): Promise<Response | null> {
  if (provider.format === "openai") {
    return tryOpenAI(provider, prompt);
  } else {
    return tryAnthropic(provider, prompt);
  }
}

// ── OpenAI 格式（DashScope / 百炼） ──
async function tryOpenAI(
  provider: { baseUrl: string; apiKey: string; model: string },
  prompt: string
): Promise<Response | null> {
  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 2048,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (res.status === 429 || res.status === 402) {
    console.warn(`${provider.model}: 额度用完 (${res.status})`);
    await res.body?.cancel(); // 释放连接
    return null; // 额度用完，换下一个
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.model} HTTP ${res.status}: ${errText}`);
  }

  // 把 OpenAI SSE 格式转成前端统一的 SSE 格式
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }

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
              const text = data.choices?.[0]?.delta?.content || "";
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        console.error(`${provider.model} stream error:`, err);
      } finally {
        reader.releaseLock();
        controller.enqueue(encoder.encode('data: {"done":true}\n\n'));
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
}

// ── Anthropic 格式（DeepSeek / cc-switch） ──
async function tryAnthropic(
  provider: { baseUrl: string; apiKey: string; model: string },
  prompt: string
): Promise<Response | null> {
  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 2048,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (res.status === 429 || res.status === 402) {
    console.warn(`${provider.model}: 额度用完 (${res.status})`);
    await res.body?.cancel();
    return null;
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.model} HTTP ${res.status}: ${errText}`);
  }

  // 把 Anthropic SSE 格式转成前端统一的 SSE 格式
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }

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
                (data.type === "content_block_delta" && data.delta?.text) ||
                "";
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        console.error(`${provider.model} stream error:`, err);
      } finally {
        reader.releaseLock();
        controller.enqueue(encoder.encode('data: {"done":true}\n\n'));
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
}
