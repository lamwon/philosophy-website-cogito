import Link from "next/link";

const cards = [
  {
    title: "开始思辨",
    href: "/think",
    border: true,
    description: "选一个问题，配一位哲学家，看看会产生什么火花",
  },
  {
    title: "浏览先哲",
    href: "/concepts",
    border: false,
    description: "翻阅罗素《西方哲学史》中的38位思想者",
  },
  {
    title: "关于",
    href: "/about",
    border: false,
    description: "这个网站是怎么来的",
  },
];

export default function Home() {
  return (
    <>
      <style>{`
        .hero {
          background: linear-gradient(135deg, var(--primary) 0%, #0f2a45 100%);
          color: white;
          text-align: center;
          padding: 80px 20px 64px;
        }
        .hero h1 {
          font-size: clamp(2rem, 6vw, 3.2rem);
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .hero p {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.15em;
        }
        .section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 48px 20px 64px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .card {
          background: var(--card-bg);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 32px 28px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: block;
          text-decoration: none;
          color: var(--text);
        }
        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.10);
        }
        .card-border {
          border: 2px solid var(--accent);
        }
        .card h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 10px;
        }
        .card p {
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--muted);
        }
        .footer-quote {
          text-align: center;
          padding: 40px 20px 48px;
          border-top: 1px solid rgba(0,0,0,0.06);
          color: var(--muted);
          font-size: 0.95rem;
          line-height: 1.8;
          max-width: 600px;
          margin: 0 auto;
        }
        .footer-quote cite {
          display: block;
          margin-top: 8px;
          font-style: normal;
          font-size: 0.85rem;
          opacity: 0.7;
        }
        @media (min-width: 768px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .section {
            padding: 56px 32px 80px;
          }
        }
      `}</style>

      <header className="hero">
        <h1>我在故我在</h1>
        <p>思辨即生活</p>
      </header>

      <section className="section">
        <div className="grid">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`card ${card.border ? "card-border" : ""}`}
            >
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="footer-quote">
        &ldquo;须知参差多态，乃是幸福本源。&rdquo;
        <cite>—— 伯特兰·罗素《西方哲学史》</cite>
      </footer>
    </>
  );
}
