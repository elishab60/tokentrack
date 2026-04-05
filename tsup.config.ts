import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/server.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  splitting: true,
});
