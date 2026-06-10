"use client";
import Link from "next/link";
import philosophersData from "@/data/philosophers.json";

const PHILOSOPHERS = philosophersData.philosophers;
const VOLUMES = philosophersData.volumes;

export default function ConceptsPage() {
  return (
    <div className="container page-enter" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>浏览先哲</h1>
      <p style={{ color: "var(--muted)", marginBottom: 30, fontSize: 14 }}>
        翻阅罗素《西方哲学史》中的{PHILOSOPHERS.length}位思想者
      </p>

      {VOLUMES.map(vol => {
        const volumePhilosophers = PHILOSOPHERS.filter((p: any) => p.volume === vol.id);
        return (
          <div key={vol.id} style={{ marginBottom: 40 }}>
            <div style={{
              padding: "16px 20px", background: "var(--primary)", color: "#fff",
              borderRadius: "12px 12px 0 0", marginBottom: 0,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>卷{vol.id}：{vol.name}</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{vol.description}</p>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 0,
              border: "1px solid #eee", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden",
            }}>
              {volumePhilosophers.map((p: any) => (
                <div key={p.id} style={{
                  padding: 20, borderBottom: "1px solid #f0f0f0", borderRight: "1px solid #f0f0f0",
                  transition: "background 0.2s", cursor: "default",
                  display: "flex", flexDirection: "column",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "var(--primary)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700, flexShrink: 0,
                    }}>{p.englishName.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.englishName}</div>
                    </div>
                  </div>
                  <div style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 4,
                    background: "var(--bg)", fontSize: 11, color: "var(--muted)", marginBottom: 8, alignSelf: "flex-start",
                  }}>{p.school}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", flex: 1 }}>{p.summary}</div>
                  <div style={{ fontSize: 12, color: "var(--accent)", fontStyle: "italic", marginTop: 8, marginBottom: 12 }}>
                    &ldquo;{p.famousQuote}&rdquo;
                  </div>
                  <Link
                    href={`/think?philosopher=${p.id}`}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "#fff",
                      fontSize: 13, textDecoration: "none", transition: "opacity 0.2s",
                      alignSelf: "flex-start",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    开始用TA思辨 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
