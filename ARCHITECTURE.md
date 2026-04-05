# TokenTrack — Architecture

## Data Flow
```
JSONL files → Parser → Aggregator → Cache → API → React SPA
```

## Key Decisions
- **Hono** for API server (lightweight, typed)
- **Vite** builds the React SPA, served statically by Hono
- **Zustand** for filter state (date range, project, model)
- **Recharts** for all visualizations
- **Streaming parser** reads JSONL line-by-line for perf
- All data stays local — no network calls to external services

## File Structure
See README.md for full tree. Key modules:
- `src/data/` — Pure data layer, no HTTP dependency
- `src/api/` — Hono routes, thin wrappers over data layer
- `src/web/` — React SPA with Vite
- `src/cli.ts` — Entry point, launches server + opens browser
