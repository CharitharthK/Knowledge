# Knowledge

Interactive learning maps for mastering a field end-to-end. Visualize how every topic connects, optionally lock tiers until you master the basics, and track your progress from foundations to advanced.

Nine comprehensive knowledge hubs covering the modern tech stack — from cloud infrastructure and system design to AI engineering and cybersecurity. All content is current as of mid-2026.

## Live hubs

| Hub | Description |
|-----|-------------|
| [Machine Learning Engineer](hub.html?topic=ml) | Math foundations through deep learning and NLP |
| [AI Engineering](hub.html?topic=ai-eng) | The applied LLM stack — RAG, agents, reasoning, multimodal |
| [Cloud Computing](hub.html?topic=cloud) | Cloud fundamentals, containers, IaC, security, and observability |
| [System Design](hub.html?topic=system-design) | Distributed systems, databases, caching, and architecture patterns |
| [Data Engineering](hub.html?topic=data-eng) | Ingestion, storage, transformation, orchestration, and serving |
| [MLOps](hub.html?topic=mlops) | Productionising ML — experiment tracking to model monitoring |
| [Cybersecurity](hub.html?topic=cybersecurity) | Security principles, cryptography, AppSec, and incident response |
| [Software Engineering](hub.html?topic=swe) | Clean code, design patterns, testing, APIs, and architecture |
| [DevOps & SRE](hub.html?topic=devops) | CI/CD, GitOps, SLOs, chaos engineering, and platform engineering |

## How it works

One engine (`assets/hub.js`), one stylesheet, many hubs — each hub is just a JSON file in `/data`.

```
index.html                 landing page (auto-generated from data/index.json)
hub.html                   the renderer → hub.html?topic=<id>
sw.js                      service worker (offline/PWA support)
manifest.webmanifest       PWA metadata
assets/
  hub.js                   shared engine
  hub.css                  shared hub styles
  index.css                landing page styles
  icon.png                 home-screen icon
  fonts/                   self-hosted Inter, Space Grotesk, JetBrains Mono
data/
  index.json               hub registry (array of hub IDs)
  ml.json                  Machine Learning hub data
  ai-eng.json              AI Engineering hub data
  cloud.json               Cloud Computing hub data
  system-design.json       System Design hub data
  data-eng.json            Data Engineering hub data
  mlops.json               MLOps hub data
  cybersecurity.json       Cybersecurity hub data
  swe.json                 Software Engineering hub data
  devops.json              DevOps & SRE hub data
docs/
  HUB_SCHEMA.md            authoring guide and JSON schema
```

## Add a new hub

1. Copy `data/ml.json` to `data/yourid.json`.
2. Edit its `meta`, `cols`, `topics`, `leaves`, and edges.
3. Add `"yourid"` to the array in `data/index.json`.
4. Open `hub.html?topic=yourid`. Done.

The landing page reads `data/index.json` at runtime and renders a card for each hub automatically — no HTML edits needed.

See [docs/HUB_SCHEMA.md](docs/HUB_SCHEMA.md) for the full authoring guide and JSON schema.

## Features

- Zoomable, pannable topic map with connection tracing
- Click any card to see descriptions, leveled content (basics → advanced), and resource links
- Completion tracking saved in localStorage per hub
- Progressive disclosure mode — lock later tiers until prerequisites are done
- Full-text search across topics and tags
- Mobile-friendly with touch gestures (pinch zoom, tap-to-trace)
- Works offline as an installable PWA (service worker caches all assets)
- Accessible: semantic HTML, keyboard-navigable, WCAG AA contrast, focus indicators

## Running locally

The app must be served over HTTP(S) — opening from `file://` blocks `fetch`.

```bash
# Any static server works:
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000` (or whichever port your server uses).

## Tech stack

- Vanilla HTML/CSS/JS — zero build step, zero dependencies
- Self-hosted fonts (no external requests needed)
- Service worker with cache-first for assets, stale-while-revalidate for data
- PWA-installable on desktop and mobile

## License

See [LICENSE](LICENSE).
