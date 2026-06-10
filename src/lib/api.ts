// DeepSeek API 调用封装
// 通过 cc-switch 代理 (127.0.0.1:15721) 路由到 DeepSeek V4 Flash

const API_BASE = "http://127.0.0.1:15721/anthropic/v1/messages";
const MODEL = "deepseek-v4-flash";

interface ApiResponse {
  content: Array<{ text: string }>;
}

// ─── 模拟回复：像朋友聊天一样自然地引用原文 ───
function makeMockMatch(
  question: string,
  philosopherName: string,
  philosopherSchool: string,
  philosopherEra: string,
  philosopherWorks: string[],
  opposite: string,
  famousQuote: string
) {
  const era2 = philosopherEra || "哲学史上";
  const school2 = philosopherSchool || "哲学";
  const works = philosopherWorks?.length ? philosopherWorks[0] : "其著作";
  const quoteFmt = "「" + (famousQuote || "经典名言") + "」";

  const q = question;
  const name = philosopherName;
  const school = school2;
  const era = era2;
  const w = works;
  const opp = opposite;

  return {
    oneliner: name + "说过：" + quoteFmt + "。这看着在说" + school + "的道理，但放在你的处境里，它提醒你：纠结的根源可能不在外面，而在你衡量它的那杆秤。",
    analogy: "就像一个人拿了一把不准的尺子量桌子——量来量去都觉得桌子不对。他没想过是尺子的问题。" + name + "的“思想的尺子”就是这个意思。" + quoteFmt + "——这位" + era + "的思想家告诉你：真正需要审视的不是你的处境本身，而是你判断处境的那套标准。" + school + "最核心的追问就是：你以为天经地义的东西，真的那么天经地义吗？",
    deep: "拆解一下。" + name + "在" + w + "里提出" + quoteFmt + "。" + school + "的整个体系都建立在这个洞察上：我们看到的“世界”，已经被认知方式预先塑造了。回到你的困惑——你觉得棘手，是因为你已经默认了一些前提（事情应该怎样、别人应该怎样）。" + name + "的犀利在于：他让你回头检视前提本身，而不是在前提里面打转。" + quoteFmt + "翻译成你今天的话就是：先搞清楚你的尺子准不准。",
    advice: "第一，写下你对这件事的三个“理所当然”——它们从哪来的？第二，挑一个最坚定的判断，问自己如果反过来才是对的呢？第三，把" + quoteFmt + "写在便利贴上贴一周，每次看到停下来想三秒。",
    alternateView: opp + "可能会说：反思前提当然好，但总不能一直反思不行动吧？的确，反思和行动需要平衡。" + name + "给你深度，" + opp + "给你灵活——两种智慧你都用得着。"
  };
}

function makeMockMismatch(
  question: string,
  philosopherName: string,
  philosopherSchool: string,
  philosopherEra: string,
  opposite: string,
  famousQuote: string
) {
  const quoteFmt = "「" + (famousQuote || "经典名言") + "」";
  const q = question;
  const name = philosopherName;
  const school = philosopherSchool;
  const era = philosopherEra;
  const opp = opposite;

  return {
    oneliner: name + "那会儿没想过你这种问题——但" + quoteFmt + "拿来硬套你的困惑，居然也能说通。",
    analogy: "拿你的困惑去找" + name + "，就像带一台智能手机去见一位" + era + "的人。TA不会用手机，但会把它翻来覆去研究半天，最后说出一句你从没想过的话——不是因为TA懂科技，而是因为TA看世界的角度跟你完全不一样。" + quoteFmt + "这种古老的话放在今天听，反而有奇怪的穿透力。",
    deep: "说实话，" + name + "的" + quoteFmt + "跟你的困惑本不在一个语境里。" + school + "关心的是另一套问题。但有意思的是：当你把古老的智慧贴到你的困惑旁边，两者之间会产生“创造性的误读”。" + quoteFmt + "被你重新解释了，你的困惑也被这句话重新照亮了。这不是歪曲，是哲学活着的证据。",
    advice: "把" + quoteFmt + "写在便利贴上，贴在每天能看到的地方。每次看到问自己：如果这句话是真的，我的烦恼会变成什么？连续一周。",
    alternateView: opp + "肯定会说：牛头不对马嘴的，别瞎联系了。但重要的是——联系本身就有意义。你在两个不相干的东西之间架桥，这个动作本身就是哲学训练。"
  };
}

// ─── API 调用 ───
export async function analyzeQuestion(
  question: string,
  philosopherName: string,
  philosopherSummary: string,
  oppositeName: string,
  isMismatch: boolean,
  philosopherSchool?: string,
  philosopherEra?: string,
  philosopherWorks?: string[],
  philosopherFamousQuote?: string
): Promise<{ oneliner: string; analogy: string; deep: string; advice: string; alternateView: string }> {
  const prompt = [
    "## 任务",
    "用户有一个具体的困惑，请用" + philosopherName + "的哲学思想来回应。",
    "像一位懂哲学的朋友在聊天那样——先理解用户的处境，再用哲学家的理论去分析。",
    "",
    "## 用户的困惑",
    question,
    "",
    "## 哲学家档案",
    "姓名：" + philosopherName,
    "流派：" + (philosopherSchool || ""),
    "时代：" + (philosopherEra || ""),
    "核心思想：" + philosopherSummary,
    "经典名言：" + (philosopherFamousQuote || ""),
    "主要著作：" + ((philosopherWorks || []).join("、") || ""),
    isMismatch ? "注意：用户刻意选了一位时代/流派都不太相关的哲学家。请幽默地承认这种错位，但仍然尽力用TA的思想框架来回应。" : "",
    "",
    "## 回答要求",
    "- 深入理解用户的真实困惑，而不是机械地套用理论",
    "- 引用哲学家的原文（如“" + (philosopherFamousQuote || "其核心观点") + "”），但要自然地融入分析中，不要生硬地贴上去",
    "- 用日常语言，像朋友聊天一样自然",
    "- 先指出问题根源，再给出洞见，最后落到生活",
    "- 每个段落都要和用户的实际处境相关",
    "",
    "## 输出格式（严格按以下5个标签输出）",
    "【一句话说清楚】哲学家的核心洞见如何回应这个困惑",
    "【生活类比】一个日常生活中的类比来说明哲学家的思想",
    "【原文分析】引用经典原文，解析它如何关联到用户的困惑",
    "【生活建议】3条具体的、可操作的建议",
    "【换个角度】用" + (oppositeName || "相反流派的哲学家") + "的视角重新看这个问题",
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "sk-placeholder" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("API error: " + res.status);
    const data: ApiResponse = await res.json();
    const text = data.content?.[0]?.text || "";
    return parseAnalysis(text, question);
  } catch {
    console.warn("API call failed, using mock data");
    return isMismatch
      ? makeMockMismatch(question, philosopherName, philosopherSchool || philosopherSummary, philosopherEra || "", oppositeName, philosopherFamousQuote || "")
      : makeMockMatch(question, philosopherName, philosopherSchool || philosopherSummary, philosopherEra || "", philosopherWorks || [], oppositeName, philosopherFamousQuote || "");
  }
}

function parseAnalysis(text: string, question: string) {
  return {
    oneliner: extractSection(text, "一句话说清楚") || ("关于你所想的“" + question + "”，这位哲学家的核心洞见是：问题的根源往往不在外面，而在你衡量它的方式。"),
    analogy: extractSection(text, "生活类比") || ("就像一把不准的尺子量什么都是歪的——先校准你的尺子，再量你的问题。你所想的“" + question + "”也是如此。"),
    deep: extractSection(text, "原文分析") || ("你所想的“" + question + "”，这位哲学家的思想提醒我们：很多困扰源于我们默认的前提。换个角度看，答案可能就在问题本身。"),
    advice: extractSection(text, "生活建议") || ("针对你所想的“" + question + "”：第一，写下三个前提假设；第二，逐一质疑它们；第三，如果前提变了，答案会怎么变？"),
    alternateView: extractSection(text, "换个角度") || ("换一个哲学流派的视角来看你所想的“" + question + "”，答案可能完全不同——关键是找到最适合你当下处境的视角。"),
  };
}

function extractSection(text: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("【" + escaped + "】\\s*([\\s\\S]*?)(?=(【|$))");
  const m = text.match(regex);
  if (m) return m[1].trim();
  const idx = text.indexOf(key);
  if (idx === -1) return "";
  const after = text.slice(idx + key.length);
  const lines = after.split("\n").filter(l => l.trim());
  return lines.slice(0, 3).join("").trim() || "";
}

export function getRandomQuote(data: any, tradition: "buddhism" | "daoism" | "confucianism") {
  const list = data[tradition] || [];
  return list[Math.floor(Math.random() * list.length)] || null;
}

export async function shareToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}
