# TokenTrack — Implementation Plan

## RALPH Loop 1: Data Layer
1. Setup project (package.json, tsconfig, configs)
2. Data path resolution (`paths.ts`)
3. JSONL streaming parser (`parser.ts`)
4. Zod schemas (`schema.ts`)
5. Cost calculator (`cost-calculator.ts`)
6. Aggregation engine (`aggregator.ts`)
7. Tests for parser + aggregator

## RALPH Loop 2: API + CLI
1. Hono server with REST endpoints
2. CLI entry point with commander
3. Terminal summary output
4. Cache layer

## RALPH Loop 3: Frontend Shell
1. Vite + React setup
2. Tailwind + theme + fonts
3. Layout + KPI Cards
4. Filter bar + state (Zustand)

## RALPH Loop 4: Charts + Tables
1. Token usage stacked area chart
2. Model distribution donut
3. Cost breakdown bar chart
4. Activity heatmap calendar
5. Projects table
6. Session explorer

## RALPH Loop 5: Polish
1. Dark mode toggle
2. CSV/JSON export
3. Responsive design
4. Error states + empty states
5. Final testing
