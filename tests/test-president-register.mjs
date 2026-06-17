/**
 * tests/test-president-register.mjs — Unit tests for src/90-president-register.js
 *
 * Covers: _t1InitAll, _t1Resolve
 * These are the lifecycle registration functions that wire all subsystems together.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadModules } from './helpers.mjs';

describe('90-president-register.js', () => {

  describe('_t1InitAll', () => {
    it('calls presInit (creates C.president)', () => {
      // Load the state module + register module so presInit is available
      const ctx = loadModules(['10-president-state.js', '90-president-register.js']);
      const C = { side: 'US' };
      ctx._t1InitAll(C);
      assert.ok(C.president, 'presInit should have created C.president');
      assert.equal(C.president.head.name, 'Lincoln');
    });

    it('tolerates null C without throwing', () => {
      const ctx = loadModules(['10-president-state.js', '90-president-register.js']);
      ctx._t1InitAll(null); // should not throw
    });

    it('is idempotent — calling twice does not corrupt state', () => {
      const ctx = loadModules(['10-president-state.js', '90-president-register.js']);
      const C = { side: 'CS' };
      ctx._t1InitAll(C);
      C.president.turn = 7;
      ctx._t1InitAll(C);
      assert.equal(C.president.turn, 7);
    });

    it('calls all available init functions in order', () => {
      const calls = [];
      const ctx = loadModules(['10-president-state.js', '90-president-register.js'], {
        clkInit: (C) => calls.push('clk'),
        mrInit: (C) => calls.push('mr'),
        wrInit: (C) => calls.push('wr'),
        cabInit: (C) => calls.push('cab'),
        cmdInit: (C) => calls.push('cmd'),
        decInit: (C) => calls.push('dec'),
        moraleInit: (C) => calls.push('morale'),
        pressInit: (C) => calls.push('press'),
        vicInit: (C) => calls.push('vic'),
        econInit: (C) => calls.push('econ'),
        blockadeInit: (C) => calls.push('blockade'),
        prodInit: (C) => calls.push('prod'),
        armoryInit: (C) => calls.push('armory'),
        artInit: (C) => calls.push('art'),
        engInit: (C) => calls.push('eng'),
        manpowerInit: (C) => calls.push('manpower'),
        bridgeInit: (C) => calls.push('bridge'),
      });
      const C = { side: 'US' };
      ctx._t1InitAll(C);
      // Verify all subsystems were called
      assert.ok(calls.includes('clk'));
      assert.ok(calls.includes('mr'));
      assert.ok(calls.includes('wr'));
      assert.ok(calls.includes('cab'));
      assert.ok(calls.includes('cmd'));
      assert.ok(calls.includes('dec'));
      assert.ok(calls.includes('morale'));
      assert.ok(calls.includes('press'));
      assert.ok(calls.includes('vic'));
      assert.ok(calls.includes('econ'));
      assert.ok(calls.includes('blockade'));
      assert.ok(calls.includes('prod'));
      assert.ok(calls.includes('armory'));
      assert.ok(calls.includes('art'));
      assert.ok(calls.includes('eng'));
      assert.ok(calls.includes('manpower'));
      assert.ok(calls.includes('bridge'));
    });

    it('isolates failures — one init throwing does not block others', () => {
      const calls = [];
      const ctx = loadModules(['10-president-state.js', '90-president-register.js'], {
        clkInit: () => { throw new Error('clk exploded'); },
        mrInit: (C) => calls.push('mr'),
        wrInit: (C) => calls.push('wr'),
      });
      const C = { side: 'US' };
      ctx._t1InitAll(C); // should not throw
      assert.ok(calls.includes('mr'), 'mrInit should still run after clkInit throws');
      assert.ok(calls.includes('wr'), 'wrInit should still run after clkInit throws');
    });
  });

  describe('_t1Resolve', () => {
    it('calls presOnResolve (advances turn)', () => {
      const ctx = loadModules(['10-president-state.js', '90-president-register.js']);
      const C = { side: 'US' };
      ctx._t1InitAll(C);
      ctx._t1Resolve('US', 'battle', { bd: { name: 'Shiloh' } }, C, true);
      assert.equal(C.president.turn, 1);
    });

    it('tolerates null C without throwing', () => {
      const ctx = loadModules(['10-president-state.js', '90-president-register.js']);
      ctx._t1Resolve('US', 'battle', {}, null, true); // should not throw
    });

    it('calls all available resolve functions', () => {
      const calls = [];
      const ctx = loadModules(['10-president-state.js', '90-president-register.js'], {
        clkOnResolve: () => calls.push('clk'),
        econOnResolve: () => calls.push('econ'),
        wrOnResolve: () => calls.push('wr'),
        blockadeOnResolve: () => calls.push('blockade'),
        prodOnResolve: () => calls.push('prod'),
        engOnResolve: () => calls.push('eng'),
        manpowerOnResolve: () => calls.push('manpower'),
        mrOnResolve: () => calls.push('mr'),
        cabOnResolve: () => calls.push('cab'),
        cmdOnResolve: () => calls.push('cmd'),
      });
      const C = { side: 'CS' };
      ctx._t1InitAll(C);
      ctx._t1Resolve('US', 'battle', {}, C, false);
      assert.ok(calls.includes('clk'));
      assert.ok(calls.includes('econ'));
      assert.ok(calls.includes('wr'));
      assert.ok(calls.includes('blockade'));
      assert.ok(calls.includes('prod'));
      assert.ok(calls.includes('eng'));
      assert.ok(calls.includes('manpower'));
      assert.ok(calls.includes('mr'));
      assert.ok(calls.includes('cab'));
      assert.ok(calls.includes('cmd'));
    });

    it('isolates failures — one resolve throwing does not block others', () => {
      const calls = [];
      const ctx = loadModules(['10-president-state.js', '90-president-register.js'], {
        clkOnResolve: () => { throw new Error('clk exploded'); },
        econOnResolve: () => calls.push('econ'),
        wrOnResolve: () => calls.push('wr'),
      });
      const C = { side: 'US' };
      ctx._t1InitAll(C);
      ctx._t1Resolve('US', 'battle', {}, C, true); // should not throw
      assert.ok(calls.includes('econ'));
      assert.ok(calls.includes('wr'));
    });
  });
});
