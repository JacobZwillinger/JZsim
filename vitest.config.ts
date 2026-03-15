import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@jzsim/core': '/Users/jz/Desktop/JZSim/packages/core/src/index.ts',
      '@jzsim/engine': '/Users/jz/Desktop/JZSim/packages/engine/src/index.ts',
      '@jzsim/command-parser': '/Users/jz/Desktop/JZSim/packages/command-parser/src/index.ts',
    },
  },
});
