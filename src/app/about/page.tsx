export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", marginBottom: 24 }}>关于「我在故我在」</h1>

      <div className="card">
        <h2 className="card-title">项目由来</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text)" }}>
          「我在故我在」是一个让普通人通过哲学思辨理解生活问题的互动网站。
          名字取自笛卡尔"我思故我在"（Cogito ergo sum）的双关演绎——
          将纯粹的理性思辨延伸至具体的生活场景。
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">哲学体系</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text)" }}>
          网站的哲学家体系和流派分类以伯特兰·罗素的经典著作
          《西方哲学史》（A History of Western Philosophy）为准，
          覆盖从泰勒斯到维特根斯坦的38位主要思想家，横跨古代、中世纪和近代三卷。
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">内容生成</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text)" }}>
          所有分析和建议由 DeepSeek V4 Flash 大语言模型动态生成。
          采用费曼学习法（Feynman Technique）进行阐述——
          用最简单的语言、最贴切的生活类比，让深奥的哲学思想变得人人可懂。
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">知识来源</h2>
        <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>伯特兰·罗素《西方哲学史》—— 哲学家体系框架</li>
          <li>《心经》《金刚经》《六祖坛经》—— 佛家原文</li>
          <li>《道德经》《庄子》—— 道家原文</li>
          <li>《论语》《孟子》《大学》《中庸》—— 儒家原文</li>
          <li>GitHub 开源社区 —— 设计美学技能（frontend-design 146K⭐ / ui-ux-pro-max 51.2K⭐）</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="card-title">技术栈</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Next.js", "TypeScript", "Tailwind CSS", "DeepSeek V4 Flash", "Vercel", "Claude Code"].map(t => (
            <span key={t} style={{
              padding: "4px 12px", borderRadius: 16, background: "var(--bg)",
              fontSize: 12, color: "var(--primary)",
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
