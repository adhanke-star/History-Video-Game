/**
 * tests/test-president-state.mjs — Unit tests for src/10-president-state.js
 *
 * Covers: presInit, presOnResolve, _pdLog, _pdMonthName
 * These are the core state-management functions for the President's Desk system.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadModules } from './helpers.mjs';

describe('10-president-state.js', () => {

  describe('_pdMonthName', () => {
    it('returns correct month names for valid indices', () => {
      const ctx = loadModules(['10-president-state.js']);
      assert.equal(ctx._pdMonthName(1), 'January');
      assert.equal(ctx._pdMonthName(4), 'April');
      assert.equal(ctx._pdMonthName(12), 'December');
    });

    it('returns empty string for out-of-range indices', () => {
      const ctx = loadModules(['10-president-state.js']);
      assert.equal(ctx._pdMonthName(0), '');
      assert.equal(ctx._pdMonthName(13), '');
      assert.equal(ctx._pdMonthName(-1), '');
    });
  });

  describe('_pdLog', () => {
    it('prepends a log line (newest-first)', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { president: { log: [] } };
      ctx._pdLog(C, 'First');
      ctx._pdLog(C, 'Second');
      assert.deepEqual(C.president.log, ['Second', 'First']);
    });

    it('caps the log at _pdLOG_MAX entries', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { president: { log: [] } };
      for (let i = 0; i < 10; i++) ctx._pdLog(C, `Line ${i}`);
      assert.equal(C.president.log.length, ctx._pdLOG_MAX);
      assert.equal(C.president.log[0], 'Line 9');
    });

    it('is safe when C is null or missing president', () => {
      const ctx = loadModules(['10-president-state.js']);
      // Should not throw
      ctx._pdLog(null, 'test');
      ctx._pdLog({}, 'test');
      ctx._pdLog({ president: null }, 'test');
    });
  });

  describe('presInit', () => {
    it('creates C.president for a US campaign', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      assert.ok(C.president);
      assert.equal(C.president.head.name, 'Lincoln');
      assert.equal(C.president.date.year, 1861);
      assert.equal(C.president.date.month, 4);
      assert.equal(C.president.cabinet.length, 4);
      assert.equal(C.president.cabinet[0].name, 'Stanton');
      assert.equal(C.president.turn, 0);
      assert.equal(C.president.onboarded, false);
    });

    it('creates C.president for a CS campaign', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'CS' };
      ctx.presInit(C);
      assert.equal(C.president.head.name, 'Davis');
      assert.equal(C.president.cabinet[0].name, 'Seddon');
      assert.equal(C.president.cabinet[1].name, 'Memminger');
    });

    it('is idempotent — does not overwrite existing president', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      C.president.turn = 5;
      ctx.presInit(C);
      assert.equal(C.president.turn, 5);
    });

    it('tolerates null C', () => {
      const ctx = loadModules(['10-president-state.js']);
      ctx.presInit(null); // should not throw
    });

    it('repairs a corrupt president (non-object primitive)', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US', president: 'corrupted' };
      ctx.presInit(C);
      assert.equal(typeof C.president, 'object');
      assert.equal(C.president.head.name, 'Lincoln');
    });

    it('repairs missing/corrupt date', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'CS', president: { date: 'bad' } };
      ctx.presInit(C);
      assert.equal(C.president.date.year, 1861);
      assert.equal(C.president.date.month, 4);
    });

    it('repairs missing cabinet', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US', president: { date: { year: 1862, month: 6 }, cabinet: null } };
      ctx.presInit(C);
      assert.equal(C.president.cabinet.length, 4);
      // Preserves existing valid date
      assert.equal(C.president.date.year, 1862);
    });
  });

  describe('presOnResolve', () => {
    it('advances the strategic turn counter', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      assert.equal(C.president.turn, 0);
      ctx.presOnResolve('US', 'battle', { bd: { name: 'Bull Run' } }, C, true);
      assert.equal(C.president.turn, 1);
    });

    it('advances the date by one month', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      assert.equal(C.president.date.month, 4);
      ctx.presOnResolve('US', 'battle', {}, C, true);
      assert.equal(C.president.date.month, 5);
    });

    it('wraps month from December to January and increments year', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'CS' };
      ctx.presInit(C);
      C.president.date.month = 12;
      C.president.date.year = 1862;
      ctx.presOnResolve('US', 'draw', {}, C, false);
      assert.equal(C.president.date.month, 1);
      assert.equal(C.president.date.year, 1863);
    });

    it('logs a dispatch with battle name (victory)', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      ctx.presOnResolve('US', 'battle', { bd: { name: 'Shiloh' } }, C, true);
      assert.ok(C.president.log[0].includes('Victory'));
      assert.ok(C.president.log[0].includes('Shiloh'));
    });

    it('logs "Stalemate" for a draw', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      ctx.presOnResolve('CS', 'draw', { bd: { name: 'Antietam' } }, C, false);
      assert.ok(C.president.log[0].includes('Stalemate'));
    });

    it('logs "Setback" for a loss', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US' };
      ctx.presInit(C);
      ctx.presOnResolve('CS', 'battle', { bd: { name: 'Fredericksburg' } }, C, false);
      assert.ok(C.president.log[0].includes('Setback'));
    });

    it('syncs year with C.clock if clock is ahead', () => {
      const ctx = loadModules(['10-president-state.js']);
      const C = { side: 'US', clock: { year: 1864 } };
      ctx.presInit(C);
      C.president.date.year = 1862;
      C.president.date.month = 11;
      ctx.presOnResolve('US', 'battle', {}, C, true);
      assert.equal(C.president.date.year, 1864);
    });

    it('tolerates null C', () => {
      const ctx = loadModules(['10-president-state.js']);
      ctx.presOnResolve('US', 'battle', {}, null, true); // should not throw
    });
  });
});
