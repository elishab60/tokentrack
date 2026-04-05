# TokenTrack

Track your AI coding agent token consumption across Claude Code and OpenAI Codex.

```bash
npx tokentrack
```

## Why

Claude Code and Codex store detailed usage logs on your machine — every prompt, every completion, every cached context. But there's no easy way to see the full picture: how many tokens you've burned, which projects consume the most, which models you're actually using, and how your usage evolves over time.

TokenTrack reads those local files and gives you a visual dashboard. Whether you're on a Pro plan watching your limits, a Max subscriber optimizing your workflow, or an API user tracking real costs — you get full visibility into your consumption.

## Quick Start

```bash
# Instant — no install needed
npx tokentrack

# CLI summary only (no browser)
npx tokentrack --summary

# Export your data
npx tokentrack --export csv --output usage.csv
```

Requires Node.js 18+. Works on macOS and Linux.

## What You See

**KPI overview** — total tokens consumed, broken down by input / output / cache, with estimated API-equivalent cost

**Usage over time** — daily, weekly, or monthly token consumption with stacked breakdown (cache read, cache write, output, input)

**Provider comparison** — Claude Code vs Codex side by side: tokens consumed and estimated cost

**Model distribution** — which models you're actually using (opus-4-6, sonnet-4-6, gpt-5.4, gpt-5.3-codex, haiku-4-5...)

**Cost by project** — ranked by estimated API-equivalent cost so you can see where your tokens go

**Activity heatmap** — GitHub-style grid showing your daily coding agent activity

**Project table** — every project with sessions count, token breakdown, provider badges, and last activity date

**Session explorer** — drill into individual sessions, see every message with its token count and cost

**Filters** — slice everything by provider, project, model, and date range (7d / 30d / 90d / all time)

## About "Estimated Cost"

TokenTrack shows an **estimated API-equivalent cost** — what your usage would cost at standard API pay-per-token rates. This is a reference metric, not your actual bill.

- If you're on **Claude Pro/Max** or **ChatGPT Plus/Pro** → you pay a flat subscription. The cost shown is what your consumption would cost at API rates. Useful for understanding the value you're getting from your plan and how close you might be to usage limits.
- If you're using **API keys** (per-token billing) → the cost shown approximates your actual spend.

Pricing is fetched from [LiteLLM](https://github.com/BerriAI/litellm) (2600+ models, updated daily) and verified against [ccusage](https://github.com/ryoppippi/ccusage).

## Data Sources

| Tool | Local data path | Tokens tracked |
|------|----------------|----------------|
| Claude Code | `~/.claude/projects/` or `~/.config/claude/projects/` | input, output, cache write, cache read |
| OpenAI Codex | `~/.codex/sessions/` | prompt, completion, cached input, reasoning |

TokenTrack reads these files directly. No API keys needed. No accounts. **Nothing leaves your machine.**

## CLI Options

```bash
tokentrack                     # Launch dashboard (opens browser)
tokentrack --summary           # Terminal summary only
tokentrack --port 4000         # Custom port
tokentrack --export csv        # Export as CSV
tokentrack --export json       # Export as JSON
tokentrack --output file.csv   # Specify output file
tokentrack --pricing           # Show current pricing table
tokentrack --provider codex    # Filter to one provider
tokentrack --project adswize   # Filter to one project
```

## Stack

TypeScript · React · Recharts · Hono · Tailwind · Zustand · Vite · tsup

## Acknowledgments

Built on ideas from [ccusage](https://github.com/ryoppippi/ccusage) by @ryoppippi — the reference CLI for Claude Code token tracking. TokenTrack adds a visual dashboard and multi-provider support.

## Contributing

PRs welcome. Open an issue first for major changes.

```bash
git clone https://github.com/elishab60/tokentrack.git
cd tokentrack
npm install
npm run dev
```

## License

MIT — [Elisha Bajemon](https://github.com/elishab60)

---

*TokenTrack reads local data only. Nothing is sent anywhere. Your usage stays yours.*
