#!/usr/bin/env node

import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

// Bundle extension files with their dependencies
const config = {
  entryPoints: {
    'popup-bundle': 'extension/popup.js',
    'content-bundle': 'extension/content.js',
  },
  bundle: true,
  outdir: 'extension',
  format: 'iife',
  sourcemap: watch ? 'inline' : false,
  // Don't bundle dependencies that aren't ours
  external: ['chrome'],
};

async function build() {
  try {
    if (watch) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(config);
      console.log('✓ Build complete');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
