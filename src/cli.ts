#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import open from 'open';
import { getRecords, getProviderInfo } from './data/cache.js';
import { applyFilters, getSummary, aggregateByProject, aggregateByProvider, type Filters } from './data/aggregator.js';
import { getPricingTable } from './data/pricing.js';
import { loadLiteLLMPricing, updatePricingCache, findLiteLLMPricing } from './data/litellm-pricing.js';
import type { Provider } from './data/providers/index.js';
import { createServer } from './server.js';

const program = new Command();

program
  .name('tokentrack')
  .description('Visual analytics dashboard for Claude Code, Codex & Antigravity token usage')
  .version('2.0.0')
  .option('-p, --port <number>', 'Server port', '3847')
  .option('--summary', 'Show CLI summary only (no browser)')
  .option('--project <name>', 'Filter by project')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('--provider <name>', 'Filter by provider (claude-code, codex, antigravity, all)', 'all')
  .option('--export <format>', 'Export data (csv or json)')
  .option('--output <file>', 'Export output file path')
  .option('--pricing', 'Display current pricing table (with LiteLLM live data when available)')
  .option('--pricing-update', 'Force refresh of LiteLLM pricing cache')
  .option('--verbose', 'Show verbose parsing output')
  .option('--dev', 'Development mode')
  .action(async (opts) => {
    // Force pricing cache update
    if (opts.pricingUpdate) {
      const spinner2 = ora('Fetching latest pricing from LiteLLM...').start();
      try {
        const count = await updatePricingCache();
        spinner2.succeed(`Updated LiteLLM pricing cache (${count} models)`);
      } catch (e: any) {
        spinner2.fail(`Failed to update pricing: ${e.message}`);
      }
      return;
    }

    // Pricing table display
    if (opts.pricing) {
      const spinner2 = ora('Loading LiteLLM pricing...').start();
      let litellm: Map<string, any>;
      let litellmSource = 'hardcoded fallback';
      try {
        litellm = await loadLiteLLMPricing();
        if (litellm.size > 0) {
          litellmSource = `LiteLLM (${litellm.size} models)`;
        }
      } catch {
        litellm = new Map();
      }
      spinner2.succeed(`Pricing source: ${litellmSource}`);

      const table = getPricingTable();
      // Deduplicate: skip .N variants when -N variant already shown
      const seen = new Set<string>();
      const ptable = new Table({
        head: ['Model', 'Provider', 'Input/M', 'Output/M', 'Cache W/M', 'Cache R/M'].map(h => chalk.bold(h)),
        style: { head: [], border: [] },
      });
      for (const [model, p] of Object.entries(table)) {
        // Skip dot-variant duplicates (e.g. claude-opus-4.6 when claude-opus-4-6 already shown)
        const normalized = model.replace(/\./g, '-');
        if (seen.has(normalized)) continue;
        seen.add(normalized);

        // Try to get live LiteLLM pricing
        let inputDisplay: string;
        let outputDisplay: string;
        let cacheWDisplay: string;
        let cacheRDisplay: string;

        const live = findLiteLLMPricing(model, litellm);
        if (live) {
          inputDisplay = `$${(live.input_cost_per_token * 1_000_000).toFixed(2)}`;
          outputDisplay = `$${(live.output_cost_per_token * 1_000_000).toFixed(2)}`;
          const isOpenAI = p.provider === 'openai';
          if (live.cache_creation_input_token_cost) {
            cacheWDisplay = `$${(live.cache_creation_input_token_cost * 1_000_000).toFixed(3)}`;
          } else if (isOpenAI) {
            cacheWDisplay = '-';
          } else {
            cacheWDisplay = p.cacheWrite ? `$${p.cacheWrite}` : '-';
          }
          if (live.cache_read_input_token_cost != null) {
            const label = isOpenAI ? 'Cached/M' : 'Cache R/M';
            cacheRDisplay = `$${(live.cache_read_input_token_cost * 1_000_000).toFixed(3)}`;
            void label; // suppress unused warning; column header handles the label
          } else {
            cacheRDisplay = p.cacheRead ? `$${p.cacheRead}` : p.cachedInput ? `$${p.cachedInput}` : '-';
          }
        } else {
          inputDisplay = `$${p.input}`;
          outputDisplay = `$${p.output}`;
          const isOpenAI = p.provider === 'openai';
          cacheWDisplay = isOpenAI
            ? (p.cachedInput ? `$${p.cachedInput}` : '-')
            : (p.cacheWrite ? `$${p.cacheWrite}` : '-');
          cacheRDisplay = p.cacheRead ? `$${p.cacheRead}` : '-';
        }

        ptable.push([
          model,
          p.provider,
          inputDisplay,
          outputDisplay,
          cacheWDisplay,
          cacheRDisplay,
        ]);
      }
      console.log(chalk.bold('\n  TokenTrack — Pricing Table\n'));
      console.log(ptable.toString());
      console.log(chalk.gray(`  Source: ${litellmSource}. Run --pricing-update to refresh.\n`));
      return;
    }

    const spinner = ora('Scanning data files across all providers...').start();

    try {
      // Detect providers
      const providerInfo = await getProviderInfo();
      const available = providerInfo.filter(p => p.isAvailable);
      spinner.text = `Found ${available.length} provider(s). Parsing...`;

      const records = await getRecords();
      spinner.succeed(`Parsed ${records.length} usage records from ${available.map(p => p.name).join(', ') || 'no providers'}`);

      // Apply filters
      const filters: Filters = {};
      if (opts.from) filters.from = new Date(opts.from);
      if (opts.to) filters.to = new Date(opts.to + 'T23:59:59');
      if (opts.project) filters.project = opts.project;
      if (opts.provider && opts.provider !== 'all') filters.provider = opts.provider as Provider;

      const filtered = applyFilters(records, filters);
      const summary = getSummary(filtered);

      // Print header
      console.log('');
      console.log(chalk.bold('  TokenTrack v2.0 — Multi-Provider Usage Summary'));
      console.log(chalk.gray(`  ${summary.dateRange.from} → ${summary.dateRange.to}`));
      console.log('');

      // Provider breakdown
      const providerSummaries = aggregateByProvider(filtered);
      if (providerSummaries.length > 0) {
        for (const ps of providerSummaries) {
          const color = ps.provider === 'claude-code' ? chalk.hex('#d97757') : ps.provider === 'codex' ? chalk.hex('#10a37f') : chalk.hex('#4285f4');
          console.log(`  ${color('■')} ${chalk.bold(ps.name.padEnd(16))} ${String(ps.records).padStart(6)} records │ ${String(ps.projects).padStart(2)} projects │ ${chalk.bold(`$${ps.totalCost.toFixed(2)}`)}`);
        }
        console.log('');
      }

      const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

      // Summary table
      const table = new Table({
        head: ['Metric', 'Value'].map(h => chalk.bold(h)),
        style: { head: [], border: [] },
      });

      table.push(
        ['Total Tokens', chalk.white.bold(fmt(summary.totalTokens))],
        ['Input Tokens', chalk.hex('#6a9bcc')(fmt(summary.totalInputTokens))],
        ['Output Tokens', chalk.hex('#d97757')(fmt(summary.totalOutputTokens))],
        ['Cache Tokens', chalk.hex('#788c5d')(fmt(summary.totalCacheTokens))],
        ['Est. API Cost', chalk.hex('#d97757').bold(`$${summary.totalCost.toFixed(2)}`)],
        ['Sessions', String(summary.totalSessions)],
        ['Projects', String(summary.totalProjects)],
      );

      console.log(table.toString());
      console.log('');

      // Projects breakdown
      const projects = aggregateByProject(filtered);
      if (projects.length > 0) {
        const ptable = new Table({
          head: ['Project', 'Provider', 'Sessions', 'Input', 'Output', 'Cache', 'Cost'].map(h => chalk.bold(h)),
          style: { head: [], border: [] },
        });

        for (const p of projects.slice(0, 15)) {
          const providerBadges = p.providers.map(pr => {
            if (pr === 'claude-code') return chalk.hex('#d97757')('CC');
            if (pr === 'codex') return chalk.hex('#10a37f')('CX');
            return chalk.hex('#4285f4')('AG');
          }).join(' ');

          ptable.push([
            p.project,
            providerBadges,
            String(p.sessions),
            fmt(p.inputTokens),
            fmt(p.outputTokens),
            fmt(p.cacheTokens),
            chalk.hex('#d97757')(`$${p.totalCost.toFixed(2)}`),
          ]);
        }

        console.log(chalk.bold('  Projects'));
        console.log(ptable.toString());
        console.log('');
      }

      // Handle export
      if (opts.export) {
        const { writeFileSync } = await import('fs');
        if (opts.export === 'csv') {
          const header = 'timestamp,session_id,project,provider,model,input_tokens,output_tokens,cache_write_tokens,cache_read_tokens,cost_usd,is_estimated';
          const rows = filtered.map(r =>
            `${r.timestamp.toISOString()},${r.sessionId},${r.project},${r.provider},${r.model},${r.inputTokens},${r.outputTokens},${r.cacheWriteTokens},${r.cacheReadTokens},${r.costUSD.toFixed(6)},${r.isEstimated}`
          );
          const csv = '\uFEFF' + header + '\n' + rows.join('\n');
          const outPath = opts.output || 'tokentrack-export.csv';
          writeFileSync(outPath, csv, 'utf-8');
          console.log(chalk.green(`  ✓ Exported to ${outPath}`));
        } else {
          const outPath = opts.output || 'tokentrack-export.json';
          writeFileSync(outPath, JSON.stringify(filtered, null, 2), 'utf-8');
          console.log(chalk.green(`  ✓ Exported to ${outPath}`));
        }
        return;
      }

      if (opts.summary) return;

      // Start server
      const requestedPort = parseInt(opts.port);
      const { port: actualPort } = await createServer(requestedPort);

      const url = `http://localhost:${actualPort}`;
      console.log(chalk.bold(`  🔷 Dashboard → ${chalk.underline(url)}`));
      console.log(chalk.gray('  Press Ctrl+C to stop\n'));

      if (!opts.dev) {
        await open(url);
      }

    } catch (err) {
      spinner.fail('Failed to parse usage data');
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
