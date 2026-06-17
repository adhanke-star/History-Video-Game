/**
 * tests/test-t8-phases.mjs — Unit tests for src/tactical/T8-phases.js
 *
 * Covers: _fldBattleWinner, _fldPhaseTopLabel, _fldPhaseView, _fldSidePhaseCas,
 *         _fldSideFull, _fldScFmt, _fldComma, _fldEscPh, _fldScenarioInitPhased,
 *         _fldPhaseResolved, _fldPhasesEndHtml
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadModules } from './helpers.mjs';

function loadT8(extras = {}) {
  return loadModules(['tactical/T8-phases.js'], {
    __FIELD: {
      phases: null,
      phaseIdx: 0,
      phaseScore: { US: 0, CS: 0 },
      phaseLog: [],
      battleCas: { US: 0, CS: 0 },
      units: [],
      _scenTop: null,
      scenData: null,
      terrain: {},
      objective: {},
      holdToWin: 30,
      timeLimit: 120,
      attacker: 'US',
      defender: 'CS',
      _atkCautious: false,
      fog: false,
      _fogSpecified: false,
      reinforce: [],
      autoBoth: false,
      winner: null,
      winBy: null,
      phase: 'battle',
      paused: false,
    },
    FLD: { HOLD_TO_WIN: 30, TIME_LIMIT: 120 },
    fldMakeUnit: (spec) => ({ ...spec, alive: true, men: spec.men || 100, maxMen: spec.men || 100 }),
    fldBrSpec: (raw, side, auto) => ({ ...raw, side, ai: auto }),
    fldResetRun: () => {},
    fldOnOver: () => {},
    fldPlayerSide: () => 'US',
    fldComputeVisibility: () => {},
    fldAnnounce: () => {},
    fldReduceMotion: () => false,
    ...extras,
  });
}

describe('tactical/T8-phases.js', () => {

  describe('_fldSideFull', () => {
    it('returns "Confederate" for CS', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldSideFull('CS'), 'Confederate');
    });

    it('returns "Union" for US', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldSideFull('US'), 'Union');
    });
  });

  describe('_fldScFmt', () => {
    it('formats integers without decimals', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldScFmt(3), '3');
      assert.equal(ctx._fldScFmt(0), '0');
    });

    it('formats floats to one decimal place', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldScFmt(1.5), '1.5');
      assert.equal(ctx._fldScFmt(2.333), '2.3');
    });

    it('handles falsy values as 0', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldScFmt(null), '0');
      assert.equal(ctx._fldScFmt(undefined), '0');
    });
  });

  describe('_fldComma', () => {
    it('adds thousands separators', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldComma(1000), '1,000');
      assert.equal(ctx._fldComma(23456), '23,456');
      assert.equal(ctx._fldComma(1234567), '1,234,567');
    });

    it('does not add commas for values under 1000', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldComma(999), '999');
      assert.equal(ctx._fldComma(0), '0');
    });

    it('handles null/undefined as 0', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldComma(null), '0');
    });
  });

  describe('_fldEscPh', () => {
    it('escapes &, <, >', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldEscPh('a & b < c > d'), 'a &amp; b &lt; c &gt; d');
    });

    it('handles null/undefined as empty string', () => {
      const ctx = loadT8();
      assert.equal(ctx._fldEscPh(null), '');
      assert.equal(ctx._fldEscPh(undefined), '');
    });
  });

  describe('_fldBattleWinner', () => {
    it('returns "draw" when scores are within 0.5', () => {
      const ctx = loadT8();
      ctx.__FIELD.phaseScore = { US: 1.5, CS: 1.5 };
      assert.equal(ctx._fldBattleWinner(), 'draw');
    });

    it('returns "draw" for a tight split (diff < 0.5)', () => {
      const ctx = loadT8();
      ctx.__FIELD.phaseScore = { US: 1.3, CS: 1.7 };
      assert.equal(ctx._fldBattleWinner(), 'draw');
    });

    it('returns "US" when US clearly leads', () => {
      const ctx = loadT8();
      ctx.__FIELD.phaseScore = { US: 2, CS: 1 };
      assert.equal(ctx._fldBattleWinner(), 'US');
    });

    it('returns "CS" when CS clearly leads', () => {
      const ctx = loadT8();
      ctx.__FIELD.phaseScore = { US: 0, CS: 2 };
      assert.equal(ctx._fldBattleWinner(), 'CS');
    });

    it('boundary: diff of exactly 0.5 is NOT a draw', () => {
      const ctx = loadT8();
      ctx.__FIELD.phaseScore = { US: 2, CS: 1.5 };
      assert.equal(ctx._fldBattleWinner(), 'US');
    });
  });

  describe('_fldPhaseTopLabel', () => {
    it('returns empty string when no phases are set', () => {
      const ctx = loadT8();
      ctx.__FIELD.phases = null;
      assert.equal(ctx._fldPhaseTopLabel(), '');
    });

    it('shows phase number, total, name, and scores', () => {
      const ctx = loadT8();
      ctx.__FIELD.phases = [{ name: 'Cornfield' }, { name: 'Bloody Lane' }, { name: 'Bridge' }];
      ctx.__FIELD.phaseIdx = 1;
      ctx.__FIELD.scenData = { _phase: { name: 'Bloody Lane' } };
      ctx.__FIELD.phaseScore = { US: 1, CS: 0.5 };
      const label = ctx._fldPhaseTopLabel();
      assert.ok(label.includes('Phase 2/3'));
      assert.ok(label.includes('Bloody Lane'));
      assert.ok(label.includes('US 1'));
      assert.ok(label.includes('CS 0.5'));
    });
  });

  describe('_fldPhaseView', () => {
    it('creates a shallow copy with phase leaders/supply/objective spliced', () => {
      const ctx = loadT8();
      const top = { name: 'Antietam', date: '1862', attacker: 'US', leaders: { US: ['A'] } };
      const phase = { leaders: { US: ['B', 'C'] }, supply: { US: 5 }, objective: { name: 'Cornfield' } };
      const view = ctx._fldPhaseView(top, phase);
      assert.equal(view.name, 'Antietam');
      assert.deepEqual(view.leaders, { US: ['B', 'C'] });
      assert.deepEqual(view.supply, { US: 5 });
      assert.deepEqual(view.objective, { name: 'Cornfield' });
      assert.equal(view._phase, phase);
    });

    it('preserves top-level fields when phase does not override them', () => {
      const ctx = loadT8();
      const top = { name: 'Test', attacker: 'CS', endNote: 'xyz' };
      const phase = {};
      const view = ctx._fldPhaseView(top, phase);
      assert.equal(view.name, 'Test');
      assert.equal(view.attacker, 'CS');
      assert.equal(view.endNote, 'xyz');
      assert.equal(view._phase, phase);
    });
  });

  describe('_fldSidePhaseCas', () => {
    it('calculates casualties as maxMen - surviving men', () => {
      const ctx = loadT8();
      ctx.__FIELD.units = [
        { side: 'US', alive: true, men: 80, maxMen: 100 },
        { side: 'US', alive: true, men: 60, maxMen: 100 },
        { side: 'CS', alive: true, men: 90, maxMen: 100 },
      ];
      assert.equal(ctx._fldSidePhaseCas('US'), 60);  // (100-80) + (100-60)
      assert.equal(ctx._fldSidePhaseCas('CS'), 10);  // (100-90)
    });

    it('counts dead units as full maxMen losses', () => {
      const ctx = loadT8();
      ctx.__FIELD.units = [
        { side: 'US', alive: false, men: 0, maxMen: 100 },
        { side: 'US', alive: true, men: 50, maxMen: 100 },
      ];
      assert.equal(ctx._fldSidePhaseCas('US'), 150);  // 100 (dead) + 50 (wounded)
    });

    it('returns 0 when no units of that side exist', () => {
      const ctx = loadT8();
      ctx.__FIELD.units = [
        { side: 'CS', alive: true, men: 80, maxMen: 100 },
      ];
      assert.equal(ctx._fldSidePhaseCas('US'), 0);
    });
  });

  describe('_fldScenarioInitPhased', () => {
    it('sets up phase 0 and returns true', () => {
      const ctx = loadT8();
      const data = {
        name: 'Antietam',
        attacker: 'US',
        terrain: { type: 'field' },
        holdToWinSec: 45,
        timeLimitSec: 180,
        defaultFog: true,
        phases: [
          {
            name: 'Cornfield',
            terrain: { type: 'corn' },
            objective: { x: 10, z: 20, r: 5, name: 'Cornfield' },
            attacker: 'US',
            oob: { US: [], CS: [] },
          },
          {
            name: 'Bloody Lane',
            objective: { x: 30, z: 40, r: 5, name: 'Bloody Lane' },
            oob: { US: [], CS: [] },
          },
        ],
      };
      const result = ctx._fldScenarioInitPhased({}, data);
      assert.equal(result, true);
      assert.equal(ctx.__FIELD._scenTop, data);
      assert.equal(ctx.__FIELD.phaseIdx, 0);
      assert.equal(ctx.__FIELD.phaseScore.US, 0);
      assert.equal(ctx.__FIELD.phaseScore.CS, 0);
      assert.equal(ctx.__FIELD.phaseLog.length, 0);
      assert.equal(ctx.__FIELD.battleCas.US, 0);
      assert.equal(ctx.__FIELD.battleCas.CS, 0);
    });
  });

  describe('_fldPhaseResolved', () => {
    it('accumulates casualties and scores into phaseScore', () => {
      const ctx = loadT8();
      const data = {
        name: 'Antietam',
        attacker: 'US',
        phases: [
          { name: 'Cornfield', scoreWeight: 2, objective: { x: 0, z: 0, r: 5, name: 'C' }, oob: { US: [], CS: [] } },
          { name: 'Bloody Lane', scoreWeight: 1, objective: { x: 0, z: 0, r: 5, name: 'B' }, oob: { US: [], CS: [] } },
        ],
      };
      ctx.__FIELD._scenTop = data;
      ctx.__FIELD.phases = data.phases;
      ctx.__FIELD.phaseIdx = 0;
      ctx.__FIELD.units = [
        { side: 'US', alive: true, men: 70, maxMen: 100 },
        { side: 'CS', alive: true, men: 80, maxMen: 100 },
      ];
      ctx._fldPhaseResolved('US', 'hold');
      assert.equal(ctx.__FIELD.phaseScore.US, 2);  // scoreWeight=2 -> US gets 2 pts
      assert.equal(ctx.__FIELD.phaseScore.CS, 0);
      assert.equal(ctx.__FIELD.battleCas.US, 30);
      assert.equal(ctx.__FIELD.battleCas.CS, 20);
      assert.equal(ctx.__FIELD.phaseLog.length, 1);
    });

    it('splits score evenly on a draw', () => {
      const ctx = loadT8();
      const data = {
        phases: [
          { name: 'Test', scoreWeight: 2, objective: { x: 0, z: 0, r: 5, name: 'T' }, oob: { US: [], CS: [] } },
          { name: 'Test2', objective: { x: 0, z: 0, r: 5, name: 'T2' }, oob: { US: [], CS: [] } },
        ],
      };
      ctx.__FIELD._scenTop = data;
      ctx.__FIELD.phases = data.phases;
      ctx.__FIELD.phaseIdx = 0;
      ctx.__FIELD.units = [];
      ctx._fldPhaseResolved('draw', 'timeout');
      assert.equal(ctx.__FIELD.phaseScore.US, 1);
      assert.equal(ctx.__FIELD.phaseScore.CS, 1);
    });

    it('ends the battle when the last phase resolves', () => {
      let overCalled = false;
      const ctx = loadT8({ fldOnOver: () => { overCalled = true; } });
      const data = {
        phases: [
          { name: 'Only Phase', scoreWeight: 1, objective: { x: 0, z: 0, r: 5, name: 'O' }, oob: { US: [], CS: [] } },
        ],
      };
      ctx.__FIELD._scenTop = data;
      ctx.__FIELD.phases = data.phases;
      ctx.__FIELD.phaseIdx = 0;
      ctx.__FIELD.units = [];
      ctx._fldPhaseResolved('US', 'hold');
      assert.equal(ctx.__FIELD.phase, 'over');
      assert.equal(ctx.__FIELD.winner, 'US');
      assert.ok(overCalled);
    });
  });

  describe('_fldPhasesEndHtml', () => {
    it('returns empty string when no phases', () => {
      const ctx = loadT8();
      ctx.__FIELD.phases = null;
      assert.equal(ctx._fldPhasesEndHtml(), '');
    });

    it('renders a result table for completed phases', () => {
      const ctx = loadT8();
      ctx.__FIELD.phases = [{ name: 'Cornfield', attacker: 'US' }];
      ctx.__FIELD._scenTop = { phases: [{ name: 'Cornfield', attacker: 'US' }], attacker: 'US' };
      ctx.__FIELD.phaseLog = [{ idx: 0, name: 'Cornfield', winner: 'US', winBy: 'hold', usCas: 500, csCas: 300 }];
      ctx.__FIELD.phaseScore = { US: 1, CS: 0 };
      ctx.__FIELD.battleCas = { US: 500, CS: 300 };
      ctx.__FIELD.winner = 'US';
      const html = ctx._fldPhasesEndHtml();
      assert.ok(html.includes('Cornfield'));
      assert.ok(html.includes('Union'));
      assert.ok(html.includes('500'));
    });
  });
});
