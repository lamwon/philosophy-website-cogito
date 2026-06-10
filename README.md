# Cogito Ergo Vivo (I Think, Therefore I Am)

**An interactive philosophy website** — Match your life dilemmas with philosophers from Bertrand Russell's *A History of Western Philosophy*, get Feynman-style AI analysis, and conclude with Eastern wisdom (Buddhism/Daoism/Confucianism) shareable cards.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Or double-click `public/test_latest.html` for a standalone offline demo.

## Core Flow

```
Pick a Problem → Pick a Philosopher (or deliberately mismatched) 
  → AI generates Feynman-style analysis (typewriter effect)
    → Choose Buddhism/Daoism/Confucianism for a closing quote + share card
```

Every analysis section **must**:
1. Begin with a direct quote of the user's question (e.g. `You asked "Should I quit my job?"...`)
2. Reference the user's question at least once more in the body
3. Cite the philosopher's original text (`famousQuote` field)

## Philosophy System

Based on Bertrand Russell's *A History of Western Philosophy* (3 volumes):

| Volume | Era | Philosophers | Highlights |
|--------|-----|-------------|-----------|
| I | Ancient | 16 | Thales, Plato, Aristotle, Diogenes |
| II | Catholic | 4 | Augustine, Thomas Aquinas, Ockham |
| III | Modern | 18 | Descartes, Kant, Nietzsche, Wittgenstein |

**Total: 38 philosophers** with structured data including name, school, era, summary, key works, opposite thinkers, and famous quotes.

## Wisdom Library

130 hand-curated Chinese classical quotes:

| Tradition | Count | Sources |
|-----------|-------|---------|
| Buddhism | 40 | Heart Sutra, Diamond Sutra, Platform Sutra |
| Daoism | 40 | Tao Te Ching, Zhuangzi |
| Confucianism | 50 | Analects, Mencius, Great Learning |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 + CSS custom properties |
| AI | DeepSeek V4 Flash (via cc-switch proxy) |
| Data | Zero database — pure JSON files |
| Deployment | Vercel (Hobby Plan) |
| Dev Tools | Claude Code (VS Code) + Hermes Agent |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── think/page.tsx        # Core interaction (4-step flow)
│   ├── concepts/page.tsx     # Philosopher library
│   ├── about/page.tsx        # About page
│   └── api/analyze/route.ts  # DeepSeek SSE proxy
├── components/
│   └── ShareCard.tsx         # Canvas share card (3 styles)
├── lib/
│   ├── api.ts                # API client + mock data
│   ├── types.ts              # TypeScript interfaces
│   └── useUrlState.ts        # URL state management hook
└── data/
    ├── philosophers.json     # 38 philosophers
    └── wisdom-quotes.json    # 130 wisdom quotes
public/
└── test_latest.html          # Standalone test (double-click)
```

## Team (Agent Skills)

| Role | Skill | Purpose |
|------|-------|---------|
| Architect | Claude Code | Implementation |
| Frontend Lead | Subagent | Architecture review |
| Supervisor | `project-supervisor` | Architecture oversight |
| Reviewer | `requesting-code-review` | Code quality |
| Prompt Engineer | `prompt-engineer` | AI prompt design |
| Design Expert | `frontend-design` (146K⭐) | Aesthetic direction |
| UI/UX | `ui-ux-pro-max` (51.2K⭐) | Design system |
| DevOps | `vercel-deploy-engineer` | Deployment |

## Team (Hermes Skills)

| Skill | Purpose |
|-------|---------|
| `philosophy-website-feynman-digital-garden` | Feynman + Digital Garden website builder |
| `philosophy-website-cogito` | Complete project workflow (this document) |
| `prompt-engineer-philosophy-website` | Philosophy-specific prompt engineering |

## Deployment

```bash
npm run build
npx vercel --prod
```

Environment variables:
- `DEEPSEEK_PROXY_URL` — DeepSeek API proxy address (default: `http://127.0.0.1:15721/anthropic/v1/messages`)

## License

MIT
