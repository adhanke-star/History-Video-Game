/**
 * tests/test-t7-command-side.mjs — Unit tests for src/tactical/T7-command-side.js
 *
 * Covers: _fldSideName, _fldSideNameFull, fldPlayerOutcomeLine,
 *         fldBriefObjectiveHtml, fldBullRunSideChoice, _fldBrSideCard
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadModules } from './helpers.mjs';

function loadT7(extras = {}) {
  return loadModules(['tactical/T7-command-side.js'], {
    __FIELD: { attacker: 'US', playerSide: 'US' },
    FLD: {},
    openSheet: null,
    openMainMenu: null,
    closeSheet: null,
    fldPlayerSide: () => 'US',
    fldScenarioData: () => null,
    ...extras,
  });
}

describe('tactical/T7-command-side.js', () => {

  describe('_fldSideName', () => {
    it('returns "Rebel" for CS', () => {
      const ctx = loadT7();
      assert.equal(ctx._fldSideName('CS'), 'Rebel');
    });

    it('returns "Union" for US', () => {
      const ctx = loadT7();
      assert.equal(ctx._fldSideName('US'), 'Union');
    });

    it('returns "Union" for any non-CS value', () => {
      const ctx = loadT7();
      assert.equal(ctx._fldSideName(''), 'Union');
      assert.equal(ctx._fldSideName(null), 'Union');
    });
  });

  describe('_fldSideNameFull', () => {
    it('returns "Confederate" for CS', () => {
      const ctx = loadT7();
      assert.equal(ctx._fldSideNameFull('CS'), 'Confederate');
    });

    it('returns "Union" for US', () => {
      const ctx = loadT7();
      assert.equal(ctx._fldSideNameFull('US'), 'Union');
    });
  });

  describe('fldPlayerOutcomeLine', () => {
    it('returns a draw message for "draw"', () => {
      const ctx = loadT7();
      const result = ctx.fldPlayerOutcomeLine('draw');
      assert.ok(result.includes('neither army broke'));
    });

    it('returns attacker-won message when player is attacker and wins', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'US' },
        fldPlayerSide: () => 'US',
      });
      const result = ctx.fldPlayerOutcomeLine('US');
      assert.ok(result.includes('carried the position'));
    });

    it('returns attacker-lost message when player is attacker and loses', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'US' },
        fldPlayerSide: () => 'US',
      });
      const result = ctx.fldPlayerOutcomeLine('CS');
      assert.ok(result.includes('assault was repulsed'));
    });

    it('returns defender-won message when player is defender and wins', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'CS' },
        fldPlayerSide: () => 'US',
      });
      const result = ctx.fldPlayerOutcomeLine('US');
      assert.ok(result.includes('held the field'));
    });

    it('returns defender-lost message when player is defender and loses', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'CS' },
        fldPlayerSide: () => 'US',
      });
      const result = ctx.fldPlayerOutcomeLine('CS');
      assert.ok(result.includes('line was forced'));
    });

    it('returns generic win/loss for symmetric sandbox (no attacker)', () => {
      const ctx = loadT7({
        __FIELD: { attacker: null },
        fldPlayerSide: () => 'US',
      });
      assert.ok(ctx.fldPlayerOutcomeLine('US').includes('won the field'));
      assert.ok(ctx.fldPlayerOutcomeLine('CS').includes('enemy carried'));
    });
  });

  describe('fldBriefObjectiveHtml', () => {
    it('returns attack objective text when player is attacker', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'US' },
      });
      const sd = { objective: { name: 'Henry House Hill' }, brief: null };
      const html = ctx.fldBriefObjectiveHtml('US', sd, 30);
      assert.ok(html.includes('seize and hold'));
      assert.ok(html.includes('Henry House Hill'));
      assert.ok(html.includes('30s'));
    });

    it('returns defend objective text when player is defender', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'US' },
      });
      const sd = { objective: { name: 'Marye\'s Heights' }, brief: null };
      const html = ctx.fldBriefObjectiveHtml('CS', sd, 60);
      assert.ok(html.includes('HOLD'));
      assert.ok(html.includes("Marye's Heights"));
    });

    it('uses data-driven brief text when available', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'US' },
      });
      const sd = {
        objective: { name: 'the crest' },
        brief: { attack: 'Charge uphill!', defend: 'Hold the line!' },
      };
      const html = ctx.fldBriefObjectiveHtml('US', sd, 30);
      assert.ok(html.includes('Charge uphill!'));
    });

    it('falls back to generic flavor when no brief provided', () => {
      const ctx = loadT7({
        __FIELD: { attacker: 'CS' },
      });
      const html = ctx.fldBriefObjectiveHtml('CS', null, 45);
      assert.ok(html.includes('Your objective'));
    });
  });

  describe('_fldBrSideCard', () => {
    it('renders a button with data-brside attribute', () => {
      const ctx = loadT7();
      const html = ctx._fldBrSideCard('US', 'Lead the Union', '&#9876; ATTACK', 'Seize the hill', true);
      assert.ok(html.includes('data-brside="US"'));
      assert.ok(html.includes('Lead the Union'));
      assert.ok(html.includes('ATTACK'));
    });

    it('uses blue accent for US side', () => {
      const ctx = loadT7();
      const html = ctx._fldBrSideCard('US', 'title', 'badge', 'deck', true);
      assert.ok(html.includes('#6c8ebf'));
    });

    it('uses red accent for CS side', () => {
      const ctx = loadT7();
      const html = ctx._fldBrSideCard('CS', 'title', 'badge', 'deck', false);
      assert.ok(html.includes('#b77668'));
    });

    it('escapes HTML in title for aria-label safety', () => {
      const ctx = loadT7();
      const html = ctx._fldBrSideCard('US', '<script>alert("xss")</script>', 'badge', 'deck', true);
      // The aria-label attribute should have the title escaped
      assert.ok(html.includes('&lt;script&gt;'));
      // The visible title div still renders raw HTML (by design — it's trusted content)
      assert.ok(html.includes('aria-label='));
    });
  });

  describe('fldScenarioSideChoice', () => {
    it('falls back to US launch when openSheet is unavailable', () => {
      let chosenSide = null;
      const ctx = loadT7({
        openSheet: null,  // not a function
        fldScenarioData: () => null,
      });
      // Override openSheet to be falsy (not a function)
      ctx.openSheet = undefined;
      ctx.fldScenarioSideChoice('bullrun1', (side) => { chosenSide = side; });
      assert.equal(chosenSide, 'US');
    });
  });

  describe('fldBullRunSideChoice', () => {
    it('delegates to fldScenarioSideChoice with bullrun1 id', () => {
      let chosenSide = null;
      const ctx = loadT7({ openSheet: null });
      ctx.openSheet = undefined;
      ctx.fldBullRunSideChoice((side) => { chosenSide = side; });
      assert.equal(chosenSide, 'US');
    });
  });
});
