// DeepSeek API 调用封装
// 通过 cc-switch 代理 (127.0.0.1:15721) 路由到 DeepSeek V4 Flash

// 优先调自己的 API 路由（支持 Vercel 部署），降级走本地代理
const API_BASE = "/api/analyze";
const FALLBACK_API = "http://127.0.0.1:15721/anthropic/v1/messages";
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
  philosopherSchool: string,
  philosopherEra: string,
  philosopherWorks: string[],
  philosopherFamousQuote: string,
  isMismatch: boolean,
  oppositeName: string
): Promise<{ oneliner: string; analogy: string; deep: string; advice: string; alternateView: string }> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        philosopher: {
          name: philosopherName,
          school: philosopherSchool,
          era: philosopherEra,
          summary: philosopherSchool + "，" + philosopherEra,
          famousQuote: philosopherFamousQuote,
          keyWorks: philosopherWorks,
        },
        isMismatch,
        oppositeName,
      }),
    });

    if (!res.ok) throw new Error("API error: " + res.status);

    // Read SSE stream partial text (front-end just needs final text, not live streaming yet)
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // SSE format: data: {"text":"..."}\n\n
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ") && !trimmed.includes('"done"')) {
          try {
            const jsonStr = trimmed.slice(6);
            const data = JSON.parse(jsonStr);
            if (data.text) fullText += data.text;
          } catch { /* skip malformed */ }
        }
      }
    }

    if (fullText) {
      return parseAnalysis(fullText, question);
    }

    throw new Error("Empty response");
  } catch (err) {
    console.warn("API via route failed, trying local proxy...", err);
  }

  // Fallback: try local proxy directly
  try {
    const prompt = buildPrompt(question, philosopherName, philosopherSchool, philosopherEra, philosopherWorks, philosopherFamousQuote, isMismatch, oppositeName);
    const res = await fetch(FALLBACK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "***" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1536,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("Fallback API error: " + res.status);
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    if (text) return parseAnalysis(text, question);
  } catch {
    console.warn("Local proxy also failed, using mock data");
  }

  // Final fallback: mock data
  return isMismatch
    ? makeMockMismatch(question, philosopherName, philosopherSchool, philosopherEra, oppositeName, philosopherFamousQuote)
    : makeMockMatch(question, philosopherName, philosopherSchool, philosopherEra, philosopherWorks, oppositeName, philosopherFamousQuote);
}

// ─── 提示词构建（用于本地代理降级） ───
function buildPrompt(
  question: string,
  philosopherName: string,
  philosopherSchool: string,
  philosopherEra: string,
  philosopherWorks: string[],
  philosopherFamousQuote: string,
  isMismatch: boolean,
  oppositeName: string
): string {
  const sections = [
    "## 任务",
    `用户的问题是：「${question}」。请你用${philosopherName}（${philosopherSchool}，${philosopherEra}）的哲学思想来回应。`,
    "",
    "## 哲学家档案",
    `姓名：${philosopherName}`,
    `流派：${philosopherSchool}`,
    `时代：${philosopherEra}`,
    `经典名言：${philosopherFamousQuote || "无"}`,
    `主要著作：${philosopherWorks?.join("、") || "无"}`,
    "",
    isMismatch ? `注意：用户刻意选了${philosopherName}（时代/流派都不太相关）。请幽默地承认这种错位，但依然严格用TA的思想框架分析。` : "",
    COMMON_HARD_RULES,
    "",
    "## 回答要求",
    "- 深入理解用户的真实困惑，不要机械套理论",
    "- 引用哲学家的原文并自然融入分析中",
    "- 用日常语言，像朋友聊天一样",
    "- 输出不要分固定小节，整体是一篇流畅文章",
  ];

  return sections.filter(Boolean).join("\n");
}

// ─── 模拟回复：多模板随机，避免重复和僵硬 ───

// 20种不同风格的费曼阐述模板，随机选用
const MOCK_FEYNMAN_VARIANTS = [
  // ─── 模板组：生活类比切入型 ───
  {
    oneliner: (q: string, n: string, s: string, qt: string) =>
      `你问「${q}」——这让我想起一个场景：你站在一道门前，拼命敲，却从来没想过门是不是锁着的。${n}会告诉你，问题不在于你敲门的力气够不够大，而在于你默认了这是一道「应该推开」的门。${qt}——${s}的这个洞见，就是帮你先看看门。`,
    analogy: (q: string, n: string, s: string, qt: string) =>
      `想象你在厨房里做饭，盐放多了。你不断地加水、加糖、加醋，试图掩盖咸味——但最后发现，你一开始就把盐罐当成糖罐了。这不是烹饪问题，是「认错了瓶子」的问题。你的「${q}」也一样：你不是不会解决问题，是拿错了解决问题的工具。${qt}——${s}说的就是这个意思：先检查你手里拿的是什么。`,
    deep: (q: string, n: string, s: string, qt: string, w: string) =>
      `${n}在${w}里说的${qt}，放到你身上怎么理解？你为「${q}」焦虑，不是因为问题真的无解，而是因为你一直在用同一个尺子量所有东西。尺子本身没问题，问题是你不检查它是不是歪的。${s}的穿透力就在这里：你以为是内容的问题，其实是框架的问题。你解决过类似的事情吗？回忆一下——有时换个角度，答案就站在你面前等你看见了。`,
    advice: (q: string, n: string, s: string, qt: string) =>
      `今晚就做一个动作：拿张纸，左边写「我担心的事」，右边写「这件事让我想到什么过去的经历」。针对「${q}」，把两列连一连。你会发现自己经常在重复同一种恐惧。${n}的方法论告诉你：认出模式，就破了一半。明天用这个发现做一个微小决定——哪怕只是换个顺序做事情。`,
    alternateView: (opp: string, n: string) =>
      `${opp}会说：别想太多，直接动手。这话也有道理——有时候分析太多反而是逃避。但${n}会反问：动手之前，你确定方向是对的吗？实用主义让你跑得快，先验批判让你跑得对。早上做哲学家，下午做实干家，一天就够了。`,
  },
  // ─── 模板组：场景还原型 ───
  {
    oneliner: (q: string, n: string, s: string, qt: string) =>
      `「${q}」——如果${n}坐在你对面喝咖啡，他会先说一句：你说的「问题」，可能不是问题，而是你还没问对问题。${qt}。你品品这句话的重量。`,
    analogy: (q: string, n: string, s: string, qt: string) =>
      `就像你手机信号不好，你拼命举高手、换位置、重启——其实信号发射塔坏了。你折腾了半天，塔还是坏的。你的「${q}」里面有没有一个「坏了的塔」？有没有一件事你默认它「就该这样」但其实可以换掉它？${n}的习惯是：当所有人都盯着手机屏幕上的信号格时，他去看塔。`,
    deep: (q: string, n: string, s: string, qt: string, w: string) =>
      `${n}在${w}里写下${qt}的时候，想的可能不是你的处境。但它之所以活了两千年，就是因为它能穿越到这个场景：你为「${q}」烦恼的时候，有没有停下来想过——这个烦恼本身是怎么来的？是你自己想要的，还是别人告诉你的？${s}最狠的一刀就是切开「理所当然」这四个字。`,
    advice: (q: string, n: string, s: string, qt: string) =>
      `明天早上醒来第一件事：在手机上设一个闹钟备注「${qt}」。接下来一周，每次闹钟响，停下手里的事10秒，只做一件事——用${n}的眼光扫一眼你现在的困境：「${q}」里，哪些是事实，哪些是我加上去的判断？7天后，你会惊讶地发现，你加上去的判断比你想象的多了太多。`,
    alternateView: (opp: string, n: string) =>
      `${opp}会说：别琢磨了，直接干。但你想想，半夜两点还睡不着的时候，你是需要一句「干就完了」，还是需要一个真正能让你换副眼镜看世界的想法？两者都要，分清什么时候用哪个，才是真本事。`,
  },
  // ─── 模板组：问题重构型 ───
  {
    oneliner: (q: string, n: string, s: string, qt: string) =>
      `你问「${q}」。好问题。但${n}会笑着把问题还给你：你确定问对了吗？${qt}。${s}最核心的训练就是：学会质疑自己的问题本身。`,
    analogy: (q: string, n: string, s: string, qt: string) =>
      `好比一个人总觉得自己走路姿势不对，找各种方法纠正，跑去找了20个教练。后来有人跟他说：你有没有想过，是因为你左脚的鞋底比右脚薄了3毫米？你的「${q}」很可能也是这样——你在一个很小的圈子里找答案，而答案可能在圈外。${n}的方法就是跳出圈子看圈子本身。`,
    deep: (q: string, n: string, s: string, qt: string, w: string) =>
      `${qt}——${n}在${w}里说的这句话，放到今天依然锋利。放到你的「${q}」上：你在这件事上的所有判断，有多少是你自己得出的，有多少是社会、家庭、习惯塞给你的？${s}最颠覆性的地方不是给你新答案，而是让你看清：你所谓的「我的想法」，可能从来不是你的。`,
    advice: (q: string, n: string, s: string, qt: string) =>
      `现在做一件事：打开手机备忘录，写下你对「${q}」的第一个判断。然后在下面分行写：1）这个判断从哪来的？2）如果换一个人跟我完全不同的背景，他会做出什么判断？3）两种判断都说得通的话，我为什么选了这个？这就是${n}式的每日训练——不是解决问题，是训练你看见自己是怎么解决问题的。`,
    alternateView: (opp: string, n: string) =>
      `${opp}会说你太纠结了，生活不需要这么累。但累不累是你定义的——如果你发现每天困扰你的东西里，80%都是你自己建构的，那这个「累」本身就是解放。看清笼子之后，你还想待在里面吗？`,
  },
  // ─── 模板组：日常微行动型 ───
  {
    oneliner: (q: string, n: string, s: string, qt: string) =>
      `你说「${q}」。我把这个问题的每个字掰开了看，核心就一个词：「边界」。${n}会说，边界这个东西，你以为它在那儿，其实是你把它放在那儿的。${qt}。`,
    analogy: (q: string, n: string, s: string, qt: string) =>
      `你家客厅的墙上有一幅画歪了。你每次经过都想去扶一下，但一直没扶。后来这幅歪画成了你生活的一部分，你习惯了。有一天一个新朋友来你家，一进门就说：「这画歪了」。你才意识到：原来我早就习惯了这件不对的事。你的「${q}」是不是也有这样一幅「歪画」？${n}说的就是这件事：不是画的问题，是你不再检查了。`,
    deep: (q: string, n: string, s: string, qt: string, w: string) =>
      `${n}在${w}里说${qt}。你用这句话照一下自己的「${q}」：你现在对这件事的感受，是建立在什么基础上？是建立在最近发生了什么，还是建立在五年前、十年前的一个判断上？很多人的困惑不是今天生成的——是十年前埋下的种子，今天才发了芽。${s}不教你怎么拔芽，它教你去看种子本身。`,
    advice: (q: string, n: string, s: string, qt: string) =>
      `今天下午就做一件事：选一个跟你「${q}」有关的日常习惯，把它反过来做。比如你总是在晚上想这件事——那你试试早上一起床就先想它五分钟。你会发现在不同时间、不同状态里，同一件事的面目完全不同。${n}的训练法从来不是纸上谈兵，而是在具体操作中改变认知。`,
    alternateView: (opp: string, n: string) =>
      `${opp}会说：你这些分析太绕了。但深夜里真正帮到你的，往往不是「三步搞定」的方法论，而是一个让你突然想通了的瞬间。${n}给的就是这个瞬间。实用派给你路标，哲学家给你地图。两个都要带。`,
  },
  // ─── 模板组：反差混搭型 ───
  {
    oneliner: (q: string, n: string, s: string, qt: string) =>
      `「${q}」——我想用一个最普通的场景来说${n}的想法：你去超市买酸奶，站在冷柜前纠结了十分钟。你纠结的不是酸奶，是所有可能的选择压在你身上。${qt}说的就是这个：你以为你在选酸奶，其实你在面对自由本身。`,
    analogy: (q: string, n: string, s: string, qt: string) =>
      `小孩学自行车的时候，最怕的不是摔倒，是「我扶着呢——好，我要松手了——别松！」这个过程。你现在的「${q}」就像这个松手前的瞬间：你知道答案可能很简单，你只是不敢让自己相信它这么简单。${n}的哲学就像是那个站在你身后说「你其实早就会了」的人。`,
    deep: (q: string, n: string, s: string, qt: string, w: string) =>
      `${qt}。${n}在${w}里写下这句话时，当时的读者可能也没完全懂。但${s}的伟大之处就在这里：它像一面镜子，每个时代的人都能从里面看见自己时代的困惑。你把「${q}」放在这句话前面——不是去分析它，而是让它照亮你。有些东西不是因为被理解了才变轻，而是因为被看见了。`,
    advice: (q: string, n: string, s: string, qt: string) =>
      `给你一个奇怪的作业：接下来三天，每次你想到「${q}」的时候，不要分析它。反而去注意：你在哪种时间、哪种地点、哪种情绪下最容易想到它。记录下来。三天之后回头看——你会发现自己焦虑的节奏比内容更有规律。${n}式的方法论就是这么操作：不看内容，看结构。`,
    alternateView: (opp: string, n: string) =>
      `${opp}的方法论也很解渴：遇到问题直接拆解成小步骤，一个一个解决。但你有没有试过按${n}的框架先拆一遍再行动？先看看假设成不成立，再动手——这不是更省力吗？`,
  },
];

// 反差模式（不相关哲学家）的独立模板
const MOCK_MISMATCH_VARIANTS = [
  {
    oneliner: (q: string, n: string, s: string, e: string, qt: string) =>
      `你拿「${q}」去问${n}，他大概率会先愣一下——${e}的${s}者面对的生活跟你太不一样了。但奇怪的是，隔了两千多年，他的${qt}依然能戳中你。不是因为灵验，是因为人性底层的东西没怎么变过。`,
    analogy: (q: string, n: string, s: string, e: string, qt: string) =>
      `就像你带一台笔记本电脑去见${e}的人。他没用过，但他会翻来覆去地摸，最后说出一句你从没想过的话——因为你不是在问一个懂电脑的人，你在问一个懂「工具」的人。${qt}配你的「${q}」，就是这种感觉：不搭，但深刻。`,
    deep: (q: string, n: string, s: string, e: string, qt: string, w: string) =>
      `说实话，${n}写${qt}的时候肯定没想到有一天会有人用它来思考「${q}」。但哲学的魅力就在这种「误读」里——你带着自己的困惑去激活一句古老的文本，文本也用它的结构重新组织你的困惑。这不是穿凿附会，这是思想的本质：永远在对话中活着。`,
    advice: (q: string, n: string, s: string, e: string, qt: string) =>
      `明早第一件事：把「${q}」写在左手上，右手写${qt}。看两只手十秒钟。然后开始一天的生活。晚上睡前再看一眼——不是让你找答案，是让两个完全不同的东西在你脑子里打架。一周后你可能发现，问题没解决，但你变了。${n}的训练就是这样。`,
    alternateView: (opp: string, n: string) =>
      `${opp}会说：你这不是胡扯吗，风马牛不相及。但${n}当初提出这个观点的时候，也是被同时代的人说「胡扯」的。拉一个毫不相关的思想进你的困境，这个动作本身就在训练你跳出自己的壳。`,
  },
  {
    oneliner: (q: string, n: string, s: string, e: string, qt: string) =>
      `「${q}」配${n}——这选择有意思。${e}的人不会跟你谈体检报告和KPI，但他会跟你说：你以为「${q}」是你的问题，其实是你这个时代的问题。${qt}——跨越时空看，很多烦恼都是「流行性感冒」。`,
    analogy: (q: string, n: string, s: string, e: string, qt: string) =>
      `一个人牙疼去看牙医，牙医看了看说：你嘴里没牙。这人说：我疼的就是没牙的地方。你的「${q}」可能也是这样——你难受的地方恰恰是「空缺」本身，不是某个实实在在的东西。${n}的${qt}飘过两千年来打这个比方，也是不容易。`,
    deep: (q: string, n: string, s: string, e: string, qt: string, w: string) =>
      `你选${n}来剖析「${q}」的这个动作本身已经很能说明问题：你在用一个跟你处境完全不搭边的思想，这不是找答案，这是找「另一种看的方式」。${s}的厉害之处，不是解决了多少问题，而是它发明了「问题」这个词本身。你把「${q}」放进${qt}里，不是去找解，是去见一个老朋友。`,
    advice: (q: string, n: string, s: string, e: string, qt: string) =>
      `接下来一周，每次为「${q}」焦虑时，用${n}的方式说一遍你的烦心事——不是跟朋友倾诉那种，是像在写历史书一样客观。比如：「这个人当时认为工作太累导致了身体不适。」当你把自己变成第三人称，你会发现同一个故事看起来完全不一样了。这就是${s}留下的最实用的工具。`,
    alternateView: (opp: string, n: string) =>
      `${opp}会说：你这是硬套，不朴素。但你想想，当你真的困惑的时候，是需要一个跟你差不多处境的人给建议，还是需要一个完全不在你的困境里的人说一句你从没听过的话？有时候，驴唇不对马嘴，反而是最深的治愈。`,
  },
];

function makeMockMatch(
  question: string,
  philosopherName: string,
  philosopherSchool: string,
  philosopherEra: string,
  philosopherWorks: string[],
  opposite: string,
  famousQuote: string
) {
  const quote = famousQuote ? `「${famousQuote}」` : "其经典名言";
  const work = philosopherWorks?.length ? philosopherWorks[0] : "其著作";
  const variant = MOCK_FEYNMAN_VARIANTS[Math.floor(Math.random() * MOCK_FEYNMAN_VARIANTS.length)];

  return {
    oneliner: variant.oneliner(question, philosopherName, philosopherSchool, quote),
    analogy: variant.analogy(question, philosopherName, philosopherSchool, quote),
    deep: variant.deep(question, philosopherName, philosopherSchool, quote, work),
    advice: variant.advice(question, philosopherName, philosopherSchool, quote),
    alternateView: variant.alternateView(opposite, philosopherName),
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
  const quote = famousQuote ? `「${famousQuote}」` : "其经典名言";
  const work = philosopherName;
  const variant = MOCK_MISMATCH_VARIANTS[Math.floor(Math.random() * MOCK_MISMATCH_VARIANTS.length)];

  return {
    oneliner: variant.oneliner(question, philosopherName, philosopherSchool, philosopherEra, quote),
    analogy: variant.analogy(question, philosopherName, philosopherSchool, philosopherEra, quote),
    deep: variant.deep(question, philosopherName, philosopherSchool, philosopherEra, quote, work),
    advice: variant.advice(question, philosopherName, philosopherSchool, philosopherEra, quote),
    alternateView: variant.alternateView(opposite, philosopherName),
  };
}

function parseAnalysis(text: string, question: string) {
  const result = { oneliner: "", analogy: "", deep: "", advice: "", alternateView: "" };

  // Try extracting each section independently — no early return
  const sections: Array<{ keys: string[]; field: keyof typeof result }> = [
    { keys: ["你的盲点", "一句话说清楚"], field: "oneliner" },
    { keys: ["换个视角", "生活类比"], field: "analogy" },
    { keys: ["哲思解剖", "原文分析"], field: "deep" },
    { keys: ["指向行动", "生活建议"], field: "advice" },
    { keys: ["另一种可能", "换个角度"], field: "alternateView" },
  ];

  for (const { keys, field } of sections) {
    for (const key of keys) {
      const val = extractSection(text, key);
      if (val) {
        result[field] = val;
        break;
      }
    }
  }

  // If nothing extracted at all, try fallback paragraph split
  if (!result.oneliner && !result.analogy && !result.deep && !result.advice && !result.alternateView) {
    const paragraphs = text.split(/\n\n+/).filter(Boolean);
    return {
      oneliner: paragraphs[0] || `关于你所想的「${question}」，这位哲学家的核心洞见是：问题的根源往往不在外面，而在你衡量它的方式。`,
      analogy: paragraphs[1] || `就像一把不准的尺子量什么都是歪的——先校准你的尺子，再量你的问题。`,
      deep: paragraphs[2] || `这位哲学家的思想提醒我们：很多困扰源于我们默认的前提。`,
      advice: paragraphs[3] || `当你意识到尺子是歪的那一刻，尺子就已经正了一点点。`,
      alternateView: paragraphs[4] || `不同的哲学流派会给出不同的答案——关键是找到最适合你当下处境的视角。`,
    };
  }

  return result;
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
