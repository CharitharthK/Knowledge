# Knowledge Hub — authoring guide

One engine renders every hub. To add a new subject (e.g. Web3, System Design),
you only write a JSON file — no HTML/JS edits.

## Files
```
index.html              landing page (auto-lists hubs you link here)
hub.html                the renderer  ->  hub.html?topic=<id>
manifest.webmanifest    PWA metadata
assets/hub.js           the engine (shared, don't edit per-topic)
assets/hub.css          the styles  (shared)
assets/icon.png         home-screen icon
data/<id>.json          ONE file per hub  <-- this is all you author
```

## Create a hub
1. Copy `data/ml.json` to `data/web3.json`.
2. Edit its `meta`, `cols`, `topics`, `leaves`, and edges (see schema below).
3. Open `hub.html?topic=web3`. That's it.
4. (Optional) add a card on `index.html` linking to it.

## data/<id>.json schema
```jsonc
{
  "meta": { "id": "ml", "kbd": "...", "title": "...", "subtitle": "...", "blurb": "...",
            "progressive": false },     // OPTIONAL gating, default false (see below)

  "domains": {                      // colour groups
    "math": { "name": "Mathematics", "c": "#F0B23C" }
  },

  "cols": [                         // left-to-right learning stages (columns)
    { "title": "Mathematics", "keys": ["t-calculus", "t-linalg"] }
  ],

  "topics": {                       // one card per topic
    "t-calculus": {
      "label": "Calculus",
      "domain": "math",
      "col": 0,                     // index into cols[]
      "desc": "short summary",
      "subs": ["l-deriv", "l-chain"],     // leaf keys shown as chips
      "links": [ { "type":"article", "title":"...", "url":"..." } ],
      "levels": [                   // OPTIONAL  basics -> advanced
        { "label":"Basics", "tag":"basics", "body":"**markdown-lite** text", "open":true },
        { "label":"Going deeper", "tag":"mid", "body":"..." },
        { "label":"In ML", "tag":"adv", "body":"..." }
      ]
    }
  },

  "leaves": {                       // sub-topics (chips inside a card)
    "l-deriv": { "label":"Derivatives", "parent":"t-calculus", "domain":"math",
                 "desc":"...", "links":[...], "levels":[...] }
  },

  "topicEdges": [ { "s":"t-calculus", "t":"t-neuralnet", "k":"prereq" } ],
  "leafEdges":  [ { "s":"l-chain",    "t":"l-backprop",  "k":"builds" } ]
}
```

### Edge kinds (`k`)
- `prereq`  — is a prerequisite for (gold, dashed)
- `builds`  — builds on / leads to (cyan)
- `applies` — is applied in / uses (mint, dotted)

### Progressive disclosure (locks) — optional
Set `meta.progressive: true` to start a hub with tier-locking enabled; omit it or
set `false` (the default) and the hub opens fully browsable. Either way the
**🔒 Focus / 🔓 Free** button in the top bar lets the user switch at any time, and
their choice is remembered per hub.

When enabled, locks are derived from `cols` order automatically: foundation columns
(those with no prerequisite) start unlocked; each later column unlocks when the
previous one's topics are all marked complete. Tune the `PREREQ` map at the top of
`boot()` in `hub.js` for a different gating graph.

### markdown-lite (in `desc` is plain; in `levels[].body`)
`**bold**`, `` `code` ``, blank line = new paragraph, lines starting `- ` = bullet list.

## Notes
- Must be served over http(s) (GitHub Pages is fine). Opening from `file://`
  blocks `fetch`, so the data won't load.
- Progress is saved per hub in `localStorage` under `kh.progress.<id>`.
