"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import philosophersData from "@/data/philosophers.json";
import wisdomData from "@/data/wisdom-quotes.json";
import { analyzeQuestion, getRandomQuote, shareToClipboard } from "@/lib/api";
import type { Philosopher, Step } from "@/lib/types";
import ShareCard from "@/components/ShareCard";

const PHILOSOPHERS = philosophersData.philosophers as Philosopher[];
const VOLUMES = philosophersData.volumes;

const TYPING_SPEED = 28;
const SECTION_DELAY = 600;

const CATEGORIES = [
  { id: "career", name: "职场困惑", icon: "💼", questions: ["该不该跳槽？", "领导不认可我的工作怎么办？", "同事抢功怎么处理？", "工作没有意义感怎么办？"] },
  { id: "relationship", name: "情感关系", icon: "💕", questions: ["该不该和TA继续走下去？", "被伤害了该原谅吗？", "如何在关系中保持自我？", "异地恋能坚持吗？"] },
  { id: "consumption", name: "消费决策", icon: "🛒", questions: ["买不起但又很想要怎么办？", "该花时间省钱还是花钱省时间？", "跟风消费后总后悔", "该不该借钱消费？"] },
  { id: "moral", name: "道德困境", icon: "⚖️", questions: ["看到不公该挺身而出吗？", "善意的谎言能说吗？", "朋友犯错该举报吗？", "利益和原则冲突时怎么选？"] },
  { id: "meaning", name: "人生意义", icon: "🌅", questions: ["活着的意义是什么？", "为什么我总感觉不快乐？", "努力了却没有结果怎么办？", "如何面对死亡和失去？"] },
  { id: "tech", name: "科技伦理", icon: "🔬", questions: ["AI会取代人类吗？", "该把隐私交给大公司吗？", "刷短视频停不下来怎么办？", "科技让生活更好还是更糟了？"] },
];

function ThinkPageInner() {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [philosopher, setPhilosopher] = useState<Philosopher | null>(null);
  const [isMismatch, setIsMismatch] = useState(false);
  const [volume, setVolume] = useState(1);
  const [search, setSearch] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [wisdom, setWisdom] = useState<"buddhism" | "daoism" | "confucianism" | null>(null);
  const [wisdomQuote, setWisdomQuote] = useState<any>(null);
  const [customInput, setCustomInput] = useState("");
  const [typewriterText, setTypewriterText] = useState<Record<string, string>>({});
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [thinkingStage, setThinkingStage] = useState(0);
  const thinkingTimer = useRef<NodeJS.Timeout | null>(null);

  const THINKING_STAGES = [
    "翻开典籍寻找线索",
    "构建哲学关联",
    "提炼核心洞见",
    "组织语言回应",
  ];

  // ─── URL 参数处理（从 /concepts 跳转过来） ───
  const searchParams = useSearchParams();

  useEffect(() => {
    const pid = searchParams.get("philosopher");
    const q = searchParams.get("question");
    if (q) { setQuestion(q); }
    if (pid) {
      const found = PHILOSOPHERS.find(p => p.id === pid);
      if (found) {
        if (!q) goTo(2);
        setPhilosopher(found);
        setVolume(found.volume);
      }
    }
  }, []);

  const goTo = (s: Step) => { setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const allQuestions = CATEGORIES.flatMap(c => c.questions);

  // ─── 增强搜索：匹配名称、英文名、学派、核心思想 ───
  const filteredPhilosophers = PHILOSOPHERS.filter(p =>
    p.volume === volume &&
    (search === "" ||
      p.name.includes(search) ||
      p.englishName.toLowerCase().includes(search.toLowerCase()) ||
      p.school.includes(search) ||
      p.summary.includes(search))
  );

  const handleSelectQuestion = (q: string) => { setQuestion(q); goTo(2); };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    setQuestion(customInput.trim());
    goTo(2);
  };

  const handleSelectPhilosopher = (p: Philosopher) => {
    setPhilosopher(p);
    goTo(3);
    startAnalysis(p);
  };

  // ─── 打字机效果 ───
  const startAnalysis = async (p: Philosopher) => {
    setLoading(true);
    setTypewriterText({});
    setTypewriterDone(false);
    setAnalysis(null);
    setActiveSection(null);

    const opp = p.oppositeIds[0]
      ? PHILOSOPHERS.find(ph => ph.id === p.oppositeIds[0])?.name || "相反流派的哲学家"
      : "相反流派的哲学家";

    const result = await analyzeQuestion(question, p.name, p.summary, opp, isMismatch, p.school, p.era, p.keyWorks, p.famousQuote);
    setAnalysis(result);
    if (thinkingTimer.current) clearInterval(thinkingTimer.current);
    setLoading(false);
    typewrite(result);
  };

  // ─── 加载状态清理 ───
  useEffect(() => {
    return () => { if (thinkingTimer.current) clearInterval(thinkingTimer.current); };
  }, []);

  const typewrite = (result: any) => {
    const keys = ["oneliner", "analogy", "deep", "advice", "alternateView"];
    const labels = ["一句话说清楚", "生活类比", "原文分析", "生活建议", "换个角度"];
    const emojis = ["🧠", "📖", "🔬", "💡", "🤔"];

    let totalDelay = 0;

    keys.forEach((key, i) => {
      if (i > 0) totalDelay += SECTION_DELAY;

      const fullText = `${emojis[i]} ${labels[i]}：${result[key]}`;
      const chars = [...fullText];

      // 激活当前区块（用于 fade-in）
      setTimeout(() => setActiveSection(key), totalDelay);

      chars.forEach((char, pos) => {
        setTimeout(() => {
          setTypewriterText(prev => ({
            ...prev,
            [key]: (prev[key] || "") + char,
          }));
        }, totalDelay + pos * TYPING_SPEED);
      });

      totalDelay += chars.length * TYPING_SPEED;
    });

    setTimeout(() => setTypewriterDone(true), totalDelay);
  };

  // ─── 结语 ───
  const handleSelectWisdom = (t: "buddhism" | "daoism" | "confucianism") => {
    setWisdom(t);
    const quote = getRandomQuote(wisdomData, t);
    setWisdomQuote(quote);
  };

  const handleShare = async () => {
    if (!wisdomQuote) return;
    const text = `「${wisdomQuote.text}」— ${wisdomQuote.source}\n来自「我在故我在」哲学网站`;
    await shareToClipboard(text);
    alert("已复制到剪贴板，去朋友圈粘贴吧！🫶");
  };

  const handleRestart = () => {
    setStep(1);
    setCategory(null);
    setQuestion("");
    setPhilosopher(null);
    setIsMismatch(false);
    setAnalysis(null);
    setWisdom(null);
    setWisdomQuote(null);
    setCustomInput("");
    setTypewriterText({});
    setTypewriterDone(false);
    setActiveSection(null);
  };

  const stepLabels = ["选问题", "选哲学家", "看分析", "得结语"];

  return (
    <div className="container page-enter" style={{ paddingTop: 20, paddingBottom: 40 }}>
      {/* Step Indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 30, alignItems: "center" }}>
        {stepLabels.map((label, i) => (
          <span key={i}>
            <span style={{
              width: 32, height: 32, borderRadius: "50%", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
              background: step >= i + 1 ? "var(--primary)" : "#ddd",
              color: step >= i + 1 ? "#fff" : "#999",
              transition: "all 0.3s",
            }}>{i + 1}</span>
            <span style={{ fontSize: 11, marginLeft: 4, color: step >= i + 1 ? "var(--primary)" : "#999" }}>{label}</span>
            {i < 3 && <span style={{ width: 30, height: 2, background: step > i + 1 ? "var(--accent)" : "#ddd", display: "inline-block", margin: "0 4px" }} />}
          </span>
        ))}
      </div>

      {/* ═══ Step 1: Question ═══ */}
      {step === 1 && (
        <div className="card fade-in" key="step1">
          <div className="card-title">你遇到了什么困惑？</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(category === c.id ? null : c.id)}
                style={{
                  padding: "6px 16px", borderRadius: 20, border: `1px solid ${category === c.id ? "var(--primary)" : "#ddd"}`,
                  background: category === c.id ? "var(--primary)" : "var(--bg)",
                  color: category === c.id ? "#fff" : "var(--text)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)",
                }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {(category ? CATEGORIES.find(c => c.id === category)?.questions || [] : allQuestions).map((q, i) => (
              <div key={i} onClick={() => handleSelectQuestion(q)}
                style={{
                  padding: "12px 16px", borderRadius: 8, background: "var(--bg)", cursor: "pointer",
                  fontSize: 14, border: "2px solid transparent", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EBE5DE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg)"; }}>
                {q}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCustomSubmit()}
              placeholder="或者自己描述你的困惑..."
              style={{
                flex: 1, padding: "12px 16px", border: "2px solid #ddd", borderRadius: 8,
                fontSize: 14, fontFamily: "var(--font)", outline: "none",
              }} />
            <button onClick={handleCustomSubmit}
              style={{
                padding: "12px 24px", border: "none", borderRadius: 8,
                background: "var(--primary)", color: "#fff", cursor: "pointer",
                fontSize: 14, fontFamily: "var(--font)",
              }}>确定</button>
          </div>
        </div>
      )}

      {/* ═══ Step 2: Philosopher ═══ */}
      {step === 2 && (
        <div className="card fade-in" key="step2">
          <div className="card-title">选一位哲学家来回应你</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => {
              const pool = PHILOSOPHERS.filter(p => p.volume === volume);
              if (pool.length) handleSelectPhilosopher(pool[Math.floor(Math.random() * pool.length)]);
            }}
              style={{ padding: "8px 20px", border: "2px solid var(--primary)", borderRadius: 20, background: "transparent", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font)" }}>
              随缘试试 🎲
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
              反差模式
              <input type="checkbox" checked={isMismatch} onChange={e => setIsMismatch(e.target.checked)} style={{ width: 40, height: 20, cursor: "pointer" }} />
              <span style={{ fontSize: 11 }}>专挑不相关的</span>
            </label>
          </div>
          {/* 搜索框 */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索哲学家（名称、学派、思想）..."
              style={{
                width: "100%", padding: "10px 16px", border: "2px solid #ddd", borderRadius: 8,
                fontSize: 14, fontFamily: "var(--font)", outline: "none",
              }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "var(--muted)",
                  padding: "4px 8px",
                }}>
                ✕
              </button>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            找到 {filteredPhilosophers.length} 位哲学家
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {VOLUMES.map(v => (
              <button key={v.id} onClick={() => setVolume(v.id)}
                style={{
                  padding: "8px 20px", borderRadius: "8px 8px 0 0", cursor: "pointer",
                  background: volume === v.id ? "var(--card-bg)" : "var(--bg)",
                  border: "none", fontSize: 13, fontFamily: "var(--font)",
                  fontWeight: volume === v.id ? 700 : 400, color: volume === v.id ? "var(--primary)" : "var(--text)",
                }}>
                卷{v.id} {v.name}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
            {filteredPhilosophers.map(p => (
              <div key={p.id} onClick={() => handleSelectPhilosopher(p)}
                style={{
                  padding: 16, borderRadius: 12, background: "var(--bg)", cursor: "pointer",
                  textAlign: "center", transition: "all 0.2s", border: philosopher?.id === p.id ? "2px solid var(--accent)" : "2px solid transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
                  fontSize: 18, fontWeight: 700,
                }}>{p.englishName.charAt(0)}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{p.school}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Step 3: Analysis ═══ */}
      {step === 3 && (
        <div className="card fade-in" key="step3">
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 24px",
                border: "3px solid #EBE5DE", borderTopColor: "var(--accent)",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              <div style={{ fontSize: 16, color: "var(--text)", marginBottom: 8 }}>
                {philosopher?.name} 正在思考...
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                从哲学的角度审视你的问题
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>你的问题</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--primary)" }}>"{question}"</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  回应者：{philosopher?.name} · {philosopher?.school}
                  {isMismatch && <span style={{ color: "var(--accent)", marginLeft: 8 }}>⚡反差模式</span>}
                </div>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--bg)", marginBottom: 20 }} />
              {(() => {
                const SECTION_ORDER = ["oneliner","analogy","deep","advice","alternateView"];
                const activeIdx = activeSection ? SECTION_ORDER.indexOf(activeSection) : -1;
                return SECTION_ORDER.map((key, idx) => {
                  if (activeIdx === -1 || idx > activeIdx) return null;
                  const content = typewriterText[key] || "";
                  const isActive = key === activeSection;
                  return (
                    <div key={key} style={{
                      marginBottom: 20,
                      opacity: content ? 1 : 0,
                      transform: content ? "translateY(0)" : "translateY(4px)",
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                    }}>
                      <div className="content" style={{ whiteSpace: "pre-wrap" }}>
                        {content}
                        {isActive && !typewriterDone && (
                          <span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--primary)", marginLeft: 2, animation: "blink 0.8s infinite", verticalAlign: "text-bottom" }} />
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              {typewriterDone && (
                <button onClick={() => goTo(4)}
                  style={{
                    width: "100%", padding: "12px 0", background: "var(--accent)", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 15, fontFamily: "var(--font)", cursor: "pointer", marginTop: 10,
                  }}>
                  我要结语 →
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ Step 4: Wisdom ═══ */}
      {step === 4 && (
        <div className="fade-in" key="step4">
          <div className="card">
            <div className="card-title">以东方智慧收尾</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }} className="wisdom-grid">
              {([
                { id: "buddhism" as const, icon: "🕉", name: "佛", color: "#D4836D", bg: "linear-gradient(135deg, #FDF6F0, #F5E6DA)" },
                { id: "daoism" as const, icon: "☯", name: "道", color: "#5D7A6E", bg: "linear-gradient(135deg, #F0F5F2, #E0EDE5)" },
                { id: "confucianism" as const, icon: "📚", name: "儒", color: "#8B4513", bg: "linear-gradient(135deg, #F5F0EB, #EDE0D5)" },
              ]).map(card => (
                <div key={card.id} onClick={() => handleSelectWisdom(card.id)}
                  style={{
                    padding: "24px 16px", borderRadius: 12, textAlign: "center", cursor: "pointer",
                    transition: "all 0.3s", background: card.bg, color: card.color,
                    border: wisdom === card.id ? "3px solid var(--accent)" : "3px solid transparent",
                    minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{card.name}</div>
                </div>
              ))}
            </div>
          </div>

          {wisdomQuote && (
            <>
              {/* Canvas 分享卡片 */}
              <div style={{ marginBottom: 20 }}>
                <ShareCard
                  text={wisdomQuote.text}
                  source={wisdomQuote.source}
                  chapter={wisdomQuote.chapter}
                  tradition={wisdom!}
                />
              </div>

              {/* 传统引用展示 */}
              <div style={{
                background: "linear-gradient(135deg, var(--primary), #2C5F7A)", color: "#fff",
                borderRadius: 12, padding: 32, textAlign: "center",
              }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                  {wisdom === "buddhism" ? "佛家·禅意" : wisdom === "daoism" ? "道家·自然" : "儒家·修身"}
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.8, marginBottom: 12, fontStyle: "italic" }}>「{wisdomQuote.text}」</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
                  —— {wisdomQuote.source}{wisdomQuote.chapter ? ` · ${wisdomQuote.chapter}` : ""}
                </div>
                <div style={{
                  fontSize: 15, lineHeight: 1.6, background: "rgba(255,255,255,0.1)",
                  padding: 16, borderRadius: 8, marginBottom: 20,
                }}>
                  {wisdomQuote.explanation}
                </div>
                <button onClick={handleShare} style={{
                  padding: "10px 24px", border: "2px solid rgba(255,255,255,0.3)", borderRadius: 20,
                  background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "var(--font)",
                }}>
                  📱 分享到朋友圈
                </button>
              </div>
            </>
          )}

          <button onClick={handleRestart}
            style={{
              display: "block", margin: "30px auto 0", padding: "12px 40px",
              background: "var(--accent)", border: "none", borderRadius: 8,
              color: "#fff", fontSize: 15, fontFamily: "var(--font)", cursor: "pointer",
            }}>
            再来一次 🔄
          </button>
        </div>
      )}

      {/* 手机端响应式：Step 4 三列→一列 */}
      <style>{`
        @media (max-width: 599px) {
          .wisdom-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes ellipsis {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          40% { opacity: 0.2; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

export default function ThinkPage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: 40, textAlign: "center", color: "var(--muted)" }}>加载中...</div>}>
      <ThinkPageInner />
    </Suspense>
  );
}
