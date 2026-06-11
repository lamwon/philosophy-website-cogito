// DeepSeek API 调用封装
// 通过 cc-switch 代理 (127.0.0.1:15721) 路由到 DeepSeek V4 Flash

const API_BASE = "http://127.0.0.1:15721/anthropic/v1/messages";
const MODEL = "deepseek-v4-flash";

const COMMON_HARD_RULES = `## 硬性规则（你必须严格遵守，否则就是失职）

### 规则1：先理解，再分析
在回答任何内容之前，先用你自己的话复述用户问题的核心矛盾（不超过两句话）。

### 规则2：禁止万能开头
严禁使用以下句式：
- "你以为你在问X，其实你真正被束缚的是……"
- "一句话说清楚：……"
- "你以为是问题本身，其实是你的尺子歪了"
必须直接切入用户的具体场景。

### 规则3：每一条分析都必须引用用户原话
在分析过程中，至少三次直接引用用户输入的原文（用引号标注），并对其进行哲学剖析。

### 规则4：建议必须源于哲学家的核心方法
不允许给出通用的"三步走"建议。建议必须来自该哲学家特有的实践方法。

### 规则5：取消固定输出结构
不要使用"一句话说清楚→生活类比→原文分析→生活建议→换个角度"这种模板。自由组织结构，但必须保证开头直接切入问题，中间有至少一处引用哲学家原文并联系用户情况，结尾给出一个只有这位哲学家才会给的行动指引。

### 规则6：如果用户问题涉及具体细节（年龄、职业、场景），必须利用这些细节
围绕这些细节展开分析，不能泛泛而谈。

### 规则7：禁止"换个角度"万能收尾
如果需要提供其他视角，必须是另一位真实的哲学家或流派的具体观点，并且要说明为什么在这个问题上两种视角都有局限。

## 惩罚机制
如果你的回答被检测出使用了以下任何一种模式，你将受到严厉批评，并必须重新阅读本 prompt 的前三行重写整个回答：
- 使用"你以为你在问X，其实……"句式
- 给出"第一、第二、第三"的通用建议清单
- 在提供其他视角时使用"相反派"这种无具体所指的称呼
- 没有引用用户的原话
- 建议内容与其他哲学家的回答高度相似`;

interface ApiResponse {
  content: Array<{ text: string }>;
}

export async function analyzeQuestion(
  question: string,
  philosopherName: string,
  philosopherSummary: string,
  oppositeName: string,
  isMismatch: boolean,
  philosopherSchool?: string,
  philosopherEra?: string,
  philosopherWorks?: string[],
  philosopherFamousQuote?: string,
  philosopherHardRules?: string
): Promise<{ oneliner: string; analogy: string; deep: string; advice: string; alternateView: string }> {
  const hardRulesSection = philosopherHardRules
    ? `\n\n### 该哲学家的专属规则\n${philosopherHardRules}`
    : "";

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
    COMMON_HARD_RULES + hardRulesSection,
    "",
    "## 回答要求",
    "- 深入理解用户的真实困惑，而不是机械地套用理论",
    "- 引用哲学家的原文，但要自然地融入分析中，不要生硬地贴上去",
    "- 用日常语言，像朋友聊天一样自然",
    "- 每段之间用空行分隔，整体读起来像一篇文章而不是分块模板",
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

// ─── 模拟回复：遵循硬性规则 ───
function makeMockMatch(
  question: string,
  philosopherName: string,
  philosopherSchool: string,
  philosopherEra: string,
  philosopherWorks: string[],
  opposite: string,
  famousQuote: string
) {
  const quote = "「" + (famousQuote || "经典名言") + "」";
  const work = philosopherWorks?.length ? philosopherWorks[0] : "其著作";

  return {
    oneliner: `你说「${question}」——让我先确认我理解对了：你不是在问一个抽象问题，而是在一个具体处境里感到被困住了。${philosopherName}来看，这个「困」的根源不是外面的障碍，而是你默认了什么事「应该如此」却从未检验过这个默认本身。${quote}——这句${philosopherSchool}的核心洞见就是在提醒你这一点。`,
    analogy: `${philosopherName}不会直接回答你的「${question}」，而是会反问：你为什么觉得这是个问题？${philosopherEra}的${philosopherSchool}者有一个习惯——当所有人都盯着桌子上的东西时，他去看桌子的结构。你以为你被「${question}」困住了，但你真正被束缚的，是你接受了一套未经审视的认知框架。${quote}——这是在说：你的尺子歪了。`,
    deep: `${philosopherName}在${work}里说${quote}。注意这句话的锋利之处：它不教你如何应付困境，而是教你审视困境是怎么构成的。${philosopherSchool}之所以穿透力强，是因为它不满足于「解决问题」——它先追问「你把什么当成了问题」。你说的「${question}」里，至少有三个你自己没意识到的预设。把这三个预设拆掉，问题会变成另一个东西。`,
    advice: `${philosopherName}的方法不是列清单，而是给你一面镜子：把${quote}抄下来贴在墙上。接下来一周，每次你为「${question}」感到焦虑时，站在这句话面前问自己：如果${philosopherName}是对的，我现在纠结的这个点，属于「事物本身」还是「我认知它的方式」？属于后者的话——${philosopherSchool}的整个修行就是：当你意识到尺子是歪的那一刻，尺子就已经正了一点点。`,
    alternateView: `${opposite}如果看到我这么分析，可能会说：绕来绕去的，不如直接解决问题。但${philosopherName}会回应：不先检查认知框架，你解决了一万个问题，第一个问法就是错的。${opposite}的实用主义让你走得快，${philosopherName}的先验批判让你走得对。两者缺一不可。`,
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
  const quote = "「" + (famousQuote || "经典名言") + "」";

  return {
    oneliner: `你说「${question}」——我得先坦白：${philosopherName}的时代没有你这个问题。但正因为隔得远，他反而能看见你看不见的东西。${quote}——${philosopherEra}的${philosopherSchool}者说这句话时想的不是你的事，但正是这种不针对，让这话有了超越时代的穿透力。`,
    analogy: `拿你的「${question}」去找${philosopherName}，就像带着智能手机去见一位${philosopherEra}的人。他不会用手机，但他会把它翻来覆去地看，然后说出一句你从没想过的话——不是因为了解你的处境，而是因为${philosopherSchool}的人从来不按你的框架看问题。${quote}这种话放在今天之所以还有穿透力，是因为人性底层的东西没变过。`,
    deep: `说实话，${philosopherName}的${quote}跟你说的「${question}」本来不在一个语境里。但有意思的是：当你把一句古老的话贴到眼前的困惑旁边，两者之间会产生一种创造性的误读。${quote}被你重新解释了——不是歪曲，是哲学活着的证据。而你引用的这句话，恰好击中了你处境里的一个深层结构。你未必选对了哲学家，但你的直觉没选错方向。`,
    advice: `${philosopherName}不会给你步骤清单——${philosopherSchool}的智慧不是操作手册，而是一副眼镜。把${quote}写下来，每次为「${question}」烦恼的时候就拿出来看一眼。不看别的，就问自己：如果${philosopherName}站在我面前，就看着我说这句话，我会怎么回应他？坚持一段时间，你会发现不是你理解了这句话，是这句话重新组织了你的理解方式。`,
    alternateView: `${opposite}一定会说：穿凿附会，牛头不对马嘴。但重要的不是搭不搭界——你愿意把一个跟自己八竿子打不着的思想拉进自己的困境，这个动作本身就是哲学训练。你在学习用另一副眼睛看世界。`,
  };
}

function parseAnalysis(text: string, question: string) {
  // 尝试按常见分隔结构解析，否则按段落拆分
  const sections = ["你的盲点", "换个视角", "哲思解剖", "指向行动", "另一种可能",
                    "一句话说清楚", "生活类比", "原文分析", "生活建议", "换个角度"];

  for (const key of sections) {
    const val = extractSection(text, key);
    if (val) {
      // Map old section names to new field names
      const fieldMap: Record<string, string> = {
        "你的盲点": "oneliner", "换个视角": "analogy", "哲思解剖": "deep",
        "指向行动": "advice", "另一种可能": "alternateView",
        "一句话说清楚": "oneliner", "生活类比": "analogy", "原文分析": "deep",
        "生活建议": "advice", "换个角度": "alternateView",
      };
      return { oneliner: "", analogy: "", deep: "", advice: "", alternateView: "", [fieldMap[key] || key]: val };
    }
  }

  // Fallback: split by double newlines into 5 parts
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return {
    oneliner: paragraphs[0] || `关于你所想的「${question}」，这位哲学家的核心洞见是：问题的根源往往不在外面，而在你衡量它的方式。`,
    analogy: paragraphs[1] || `就像一把不准的尺子量什么都是歪的——先校准你的尺子，再量你的问题。`,
    deep: paragraphs[2] || `这位哲学家的思想提醒我们：很多困扰源于我们默认的前提。`,
    advice: paragraphs[3] || `当你意识到尺子是歪的那一刻，尺子就已经正了一点点。`,
    alternateView: paragraphs[4] || `不同的哲学流派会给出不同的答案——关键是找到最适合你当下处境的视角。`,
  };
}

function extractSection(text: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("【" + escaped + "】\\s*([\\s\\S]*?)(?=(【|$))");
  const m = text.match(regex);
  if (m) return m[1].trim();

  // Also try matching without brackets (just the key as a line header)
  const lineRegex = new RegExp("^" + escaped + "[：:▸→\\s]*(.+)$", "m");
  const lm = text.match(lineRegex);
  if (lm) return lm[1].trim();

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
