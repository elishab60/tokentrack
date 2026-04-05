# TokenTrack Bugs Found & Fixed

## BUG 1: Pricing Key Mismatch (CRITICAL)
**Root cause:** Pricing table keys used dots (`claude-opus-4.6`) but model names from JSONL use dashes (`claude-opus-4-6`). The fuzzy matcher fell back to `claude-opus-4` ($15/$75 legacy) instead of `claude-opus-4-6` ($5/$25 current).
**Impact:** opus-4-6 billed at 3× correct rate, haiku-4-5 billed as sonnet.
**Fix:** Added dash-variant keys to PRICING_TABLE alongside dot variants.

## BUG 2: Streaming Duplicate Records (CRITICAL)
**Root cause:** Claude Code writes multiple JSONL lines per message.id (streaming updates). Our dedup used `timestamp+session+model+tokens` which didn't catch these.
**Impact:** 12,825 duplicate records (57% overcounting).
**Fix:** Dedup by `message.id`, keeping entry with lowest non-zero `output_tokens` (matching ccusage behavior — first turn entry, not cumulative).

## BUG 3: Output Tokens Cumulative (CRITICAL)
**Root cause:** For agentic tool_use sequences, the final JSONL entry has cumulative `output_tokens` across all iterations. Keeping the max gave 3× the correct output count.
**Impact:** 5.2M output vs 1.7M reference (3× overcounting).
**Fix:** Keep the FIRST (lowest) non-zero output entry per message.id.

## BUG 4: Subagent Files Excluded
**Root cause:** Glob ignored `**/subagents/**` but ccusage includes them.
**Impact:** Missing ~30% of cache tokens.
**Fix:** Removed subagents from ignore list.

## BUG 5: costUSD Field Not Used
**Root cause:** Always recalculated cost instead of using pre-calculated `costUSD` from JSONL.
**Impact:** Minor — costUSD is rarely present in JSONL entries.
**Fix:** Prefer `costUSD` when available, fallback to calculation.

## Results After Fixes
- ccusage: $552.38 | 305K in | 1.7M out | 40.9M cW | 813M cR
- TokenTrack: $557.08 | 305K in | 1.7M out | 40.9M cW | 821M cR
- Delta: **0.8%** (target was <5%)
