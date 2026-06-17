/**
 * tests/helpers.mjs — Shared test harness for unit-testing src/ modules.
 *
 * The game's source files are plain browser-global scripts (var/function at
 * top-level, referencing a global `G`). This helper evaluates them inside a
 * controlled vm context so the exported functions are available to Node tests.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');

/**
 * Load one or more src/ modules into a shared sandbox and return the context.
 * @param {string[]} files — file paths relative to src/ (e.g. '10-president-state.js')
 * @param {object} [extras] — additional globals to inject (e.g. { G: {...} })
 * @returns {object} the sandbox context with all top-level vars/fns available
 */
export function loadModules(files, extras = {}) {
  const ctx = {
    // Minimal browser-compat stubs
    window: {},
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    console,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    ...extras,
  };
  // G is referenced as a bare global in every module
  if (!ctx.G) ctx.G = { campaign: null, mode: 'menu' };

  vm.createContext(ctx);

  for (const file of files) {
    const path = file.startsWith('/') ? file : resolve(SRC, file);
    const code = readFileSync(path, 'utf8');
    vm.runInContext(code, ctx, { filename: path });
  }
  return ctx;
}
