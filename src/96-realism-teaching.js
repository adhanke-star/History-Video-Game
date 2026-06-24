/* ===========================================================================
   E2 · 96-realism-teaching.js — "THE REAL COST" — a citation-grade HISTORICAL
   TEACHING layer over the tactical realism dials.
   (S4 education; V1-CHECKLIST E2 increment 5; DECISIONS D124.)

   The tactical "Command & Realism" picker (src/tactical/T6-presets.js · FLDP)
   already ships the difficulty + realism dials (Recruit…Hardee × Arcade/Balanced/
   Historian, plus per-lever advanced chips). E2-i5's value is EDUCATIONAL, not a
   new combat lever: for each realism dial — and each realism bundle — this module
   teaches WHAT THE DIAL ABSTRACTS in real terms. Why did "Historian" attrition
   cost what it did? Because the rifle-musket met Napoleonic ranks and Antietam
   bled ~22,700 men in a single day. The teaching is contextual to the player's
   CURRENT selection ("you've set canister to Murderous — here is what that meant").

   ARCHITECTURE — PURE READ-OUT (byte-identical combat BY CONSTRUCTION, D74):
   this module reads FLDP labels + a passed-in resolved config and RETURNS HTML.
   It WRITES NOTHING — no G mutation, no localStorage, no RNG, no _SAVE_VER bump,
   and it touches NO combat-path knob. It changes ZERO lever value: fldPresetCompute
   / fldPresetsApply / _fldClampCfg / the FLDP severity tables are all untouched, so
   the 9 tactical baselines stay byte-identical (the no-leak static scan + the
   probe-presets 9-baseline byte-identity gate prove it; no A/B sweep needed because
   no number changed). Surfaced on TWO surfaces, both via a typeof-guarded hook so
   the host stays byte-identical when this module is absent: (1) a "What this costs
   in real life" expander in the T6 picker (the primary, at-the-decision-point
   surface), and (2) a deepened read-out line in the 95-playstyle "Play Your Way"
   hub.

   CITATION-GRADE / ANTI-LOST-CAUSE: every entry's prose names the real cost
   honestly (slavery named as the war's cause where relevant; no valorization of
   the Confederacy; the human cost reckoned with, never romanticized). Content was
   produced + adversarially verified by a research+verify Workflow (Opus historians
   WebSearch-grounded × default-refute Opus verifiers checking for fabricated cites,
   Lost-Cause framing, and accuracy; ≥2 verified sources per entry).

   Bare-name globals (FLDP, document, htmlEsc). All public symbols rtm-prefixed;
   internals _rtm; the content table RTM. No literal comment-closer inside a block
   comment.
   =========================================================================== */

var RTM = {
  /* the framing shown at the top of the teaching expander (authored, engine-honest). */
  intro: "These dials are not a score to beat &mdash; they tune how honestly the battle models the real war. Below is what each setting abstracts, and what it cost the men who lived it. Your current choices are marked.",

  /* per-LEVER teaching. `models` is engine-accurate (what the dial does in THIS game); `title` /
     `cost` / `sources` are citation-grade history, produced + adversarially verified by the
     realism-teaching-content Workflow (Opus historians WebSearch-grounded x default-refute Opus
     verifiers; >=2 verified real sources each; anti-Lost-Cause). Keyed by the FLDP.levers key. */
  levers: {
    attrition: {
      title: 'The rifle musket&rsquo;s terrible arithmetic',
      models: "Scales how many men fall to fire and to the bayonet.",
      cost: 'This dial scales how many men a volley or charge actually costs. The horror was real: roughly 22,717 fell at Antietam on September 17, 1862, the bloodiest single day in American history, and the war killed at least 620,000 (J. David Hacker&rsquo;s census work revises that toward 750,000, with the heaviest mortality among Southern-born white men). But the cause is disputed. The old &ldquo;rifle revolution&rdquo; thesis credited the rifle musket; Earl J. Hess shows most effective fire stayed near smoothbore ranges. &ldquo;Heavier&rdquo; attrition models close-order tactics, disease, and grinding scale, not just the rifle.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era,&rdquo; 1988', 'Earl J. Hess, &ldquo;The Rifle Musket in Civil War Combat: Reality and Myth,&rdquo; 2008', 'Paddy Griffith, &ldquo;Battle Tactics of the Civil War,&rdquo; 1989', 'J. David Hacker, &ldquo;A Census-Based Count of the Civil War Dead,&rdquo; Civil War History, 2011'],
    },
    canister: {
      title: 'When the cannon became a giant shotgun',
      models: "Scales the killing power of close-range artillery canister (not long-range shelling).",
      cost: 'Canister was a thin tin can packed in sawdust holding about 27 iron balls for a 12-pounder Napoleon; fired, the can burst and the gun became a giant shotgun, deadly at a few hundred yards. At Malvern Hill (July 1, 1862) Henry Hunt&rsquo;s massed Union batteries shredded Confederate assaults, gunners ramming double-canister at point-blank to break a charge. This is why the &ldquo;long arm&rdquo; was far more decisive on defense than offense: advancing infantry made dense targets, while attacking guns rarely silenced dug-in defenders.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era,&rdquo; 1988', 'Earl J. Hess, &ldquo;Field Armies and Fortifications in the Civil War: The Eastern Campaigns, 1861-1864,&rdquo; 2005', 'American Battlefield Trust, &ldquo;10 Facts: Civil War Artillery&rdquo; (battlefields.org)'],
    },
    supply: {
      title: 'Armies move on railroads, rivers, and full wagons',
      models: "Sets how generous or strict ammunition and supply are.",
      cost: 'Civil War armies lived or starved by logistics. The Union held the edge: Quartermaster General Montgomery Meigs&mdash;appointed in 1861&mdash;built a depot-and-railroad machine that fed armies deep in hostile territory and remains, to many historians, an unsung architect of northern victory. The Confederacy, with almost no locomotive-building capacity and no way past the blockade for spare rails, let its lines decay toward collapse by 1864. Both sides foraged hard; Sherman&rsquo;s marches deliberately stripped Georgia&rsquo;s and the Carolinas&rsquo; civilians. A &ldquo;strict&rdquo; supply setting evokes that late-war shortfall: thin ammunition, hungry men, worn-out trains.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era&rdquo; (1988)', 'Robert O&rsquo;Harrow Jr., &ldquo;The Quartermaster: Montgomery C. Meigs, Lincoln&rsquo;s General, Master Builder of the Union Army&rdquo; (2016)', 'Edward Hagerman, &ldquo;The American Civil War and the Origins of Modern Warfare: Ideas, Organization, and Field Command&rdquo; (1988)'],
    },
    cmdShock: {
      title: 'Shoot the head, and the body wanders',
      models: "Sets how hard morale and command shake when a unit breaks or a leader falls.",
      cost: 'Civil War command moved by courier and line-of-sight: an order could take many minutes to reach a brigade, and a leader&rsquo;s fall or a regiment&rsquo;s panic was hard to contain. When Albert Sidney Johnston bled to death from a severed leg artery at Shiloh (April 6, 1862) and Jackson was shot by his own men at Chancellorsville (May 2, 1863), assaults faltered for lack of direction &mdash; on both sides. Green troops worsened it: the Union army routed at First Bull Run (1861). Harder command shock models that fragility &mdash; a break or fallen leader cascades into wider paralysis.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era,&rdquo; 1988', 'John J. Hennessy, &ldquo;The First Battle of Manassas: An End to Innocence, July 18-21, 1861,&rdquo; 1989', 'Larry J. Daniel, &ldquo;Shiloh: The Battle That Changed the Civil War,&rdquo; 1997'],
    },
    sight: {
      title: 'The eyes of the army',
      models: "Sets how far your units can see and scout the field.",
      cost: 'Commanders saw the field through cavalry. Mounted scouts screened the march, found the enemy&rsquo;s columns, and reported strength and direction; without them an army groped blind. When J.E.B. Stuart rode a long loop around the Federal army (departing June 25, 1863) and did not regain contact with Lee until the afternoon of July 2 at Gettysburg, Lee advanced into Pennsylvania ignorant of where the Union army was &mdash; and stumbled into a battle on ground he had not chosen. A short scouting range models that blindness: fog of war, late contact, fights begun before you know the odds.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era&rdquo;, 1988', 'Stephen W. Sears, &ldquo;Gettysburg&rdquo;, 2003', 'Edward G. Longacre, &ldquo;The Cavalry at Gettysburg&rdquo;, 1986'],
    },
    veteran: {
      title: 'Green alike &mdash; and the long schooling in blood',
      models: "Sets how much a unit&rsquo;s combat experience counts.",
      cost: 'At First Bull Run (July 1861) amateurs fought amateurs &mdash; McDowell&rsquo;s expiring 90-day volunteers and Beauregard&rsquo;s equally raw recruits, the men Lincoln is said to have called &ldquo;green alike.&rdquo; Volleys flew high; brigades dissolved into panic. By 1863-64 the survivors were hardened veterans: they held under fire, aimed lower, and dug in reflexively. In the 1864 Overland Campaign, Grant&rsquo;s relentless contact taught both armies to entrench within minutes of halting. Steep experience weight models that earned steadiness &mdash; paid for in the dead who never became veterans.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era,&rdquo; 1988', 'Earl J. Hess, &ldquo;Trench Warfare under Grant and Lee: Field Fortifications in the Overland Campaign,&rdquo; 2007', 'Earl J. Hess, &ldquo;Field Armies and Fortifications in the Civil War: The Eastern Campaigns, 1861-1864,&rdquo; 2005', 'Paddy Griffith, &ldquo;Battle Tactics of the Civil War,&rdquo; 1989'],
    },
    aiSkill: {
      title: 'A sharper opponent decides better &mdash; it never cheats',
      models: "Sets how sharply the opposing commander decides &mdash; never a cheat.",
      cost: 'This dial raises the enemy&rsquo;s judgment, never grants extra sight or steadier nerve. Command competence ran a wide spectrum. McClellan, fed Pinkerton&rsquo;s wildly inflated counts, fought Antietam (Sept. 17, 1862) fearing forces that did not exist, then failed to crush Lee&rsquo;s battered army. Lee&rsquo;s aggression won battles but bled the outnumbered South dry &mdash; his army&rsquo;s casualty rate exceeded Grant&rsquo;s. Caution squandered openings; recklessness emptied ranks. A smarter foe times attacks, concentrates force, and reads ground &mdash; the gap between generals, not a thumb on the scale.',
      sources: ['James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era&rdquo; (1988)', 'Stephen W. Sears, &ldquo;George B. McClellan: The Young Napoleon&rdquo; (1988)', 'Joseph T. Glatthaar, &ldquo;General Lee&rsquo;s Army: From Victory to Collapse&rdquo; (2008)'],
    },
    fog: {
      title: 'Generals fought half-blind',
      models: "Sets whether you see the whole field or only what your men can scout.",
      cost: 'A Civil War commander saw almost nothing by modern standards. Knowledge came from cavalry scouts, prisoners, civilians, and Albert Myer&rsquo;s flag-and-torch &ldquo;wig-wag&rdquo; signal stations perched on hills; the U.S. Military Telegraph linked armies but not the battlefield itself. Decisions rested on rumor and hours-old reports. At Shiloh (April 6, 1862) Sherman dismissed warnings&mdash;&ldquo;You militia officers get scared too easy&rdquo;&mdash;leaving his camps unfortified when Albert Sidney Johnston struck at dawn. &ldquo;Fog on&rdquo; honestly models that blindness: you command only what you can actually see.',
      sources: ['Edward Hagerman, &ldquo;The American Civil War and the Origins of Modern Warfare: Ideas, Organization, and Field Command&rdquo;, 1988', 'Edwin C. Fishel, &ldquo;The Secret War for the Union: The Untold Story of Military Intelligence in the Civil War&rdquo;, 1996', 'James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era&rdquo;, 1988'],
    },
  },
  /* the order levers are taught in (mirrors FLDP.leverOrder minus autoPause, a pure UX dial). */
  leverOrder: ['attrition', 'canister', 'supply', 'cmdShock', 'sight', 'veteran', 'aiSkill', 'fog'],

  /* per-BUNDLE framing (the realism level as a whole). */
  bundles: {
    arcade: {
      title: 'A gentle scaffold over a merciless war',
      cost: 'Arcade is a teaching abstraction, not a depiction. It softens casualties, loosens supply, dulls command shock, and lifts the fog so you can learn maneuver without being punished. The real war was nothing like this. Massed firepower behind earthworks made frontal attacks brutally costly; J. David Hacker&rsquo;s 2011 census study puts the dead near 750,000. Antietam alone cost roughly 23,000 casualties in one day, September 17, 1862. Disease killed about twice as many as combat. Treat easy mode as training wheels &mdash; then turn the dial up.',
      sources: ['J. David Hacker, &ldquo;A Census-Based Count of the Civil War Dead,&rdquo; Civil War History, vol. 57, no. 4 (2011)', 'James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era,&rdquo; 1988', 'Earl J. Hess, &ldquo;Field Armies and Fortifications in the Civil War: The Eastern Campaigns, 1861-1864,&rdquo; 2005'],
    },
    balanced: {
      title: 'The faithful middle, where the real war emerges',
      cost: 'This is the historically-tuned default: fight both armies roughly as they fought, and the engine drifts toward the documented outcome. A real battle at this level was no clean duel of long-range rifles. Despite muskets sighted past 500 yards, most fighting collapsed to under 100 yards &mdash; protracted, smoky firefights where men stood and traded volleys. Casualties came less from the weapon than from soldiers&rsquo; willingness to endure, shaped by numbers, ground, command, and timing. Outcomes were earned in attrition, not decided by drama.',
      sources: ['Earl J. Hess, &ldquo;The Rifle Musket in Civil War Combat: Reality and Myth&rdquo; (University Press of Kansas, 2008)', 'Paddy Griffith, &ldquo;Battle Tactics of the Civil War&rdquo; (Yale University Press, 1989)', 'James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era&rdquo; (Oxford University Press, 1988)'],
    },
    historian: {
      title: 'The war as the men who fought it knew it',
      cost: 'Historian mode strips the cushioning. About twice as many of the war&rsquo;s dead died of disease as of combat wounds &mdash; dysentery, typhoid, pneumonia in fetid camps &mdash; and the true toll ran higher than long thought; J. David Hacker&rsquo;s revised estimate reaches some 750,000. Supply was scarce, intelligence often blind, command friction constant; infantry traded fire at close range (Hess finds an average near 94 yards), and massed canister shredded assaults. This was no glory but the price &mdash; Lincoln&rsquo;s &ldquo;blood drawn with the lash&rdquo; &mdash; borne to destroy slavery and preserve the Union.',
      sources: ['J. David Hacker, &ldquo;A Census-Based Count of the Civil War Dead,&rdquo; Civil War History 57, no. 4 (2011)', 'Earl J. Hess, &ldquo;The Rifle Musket in Civil War Combat: Reality and Myth&rdquo; (2008)', 'James M. McPherson, &ldquo;Battle Cry of Freedom: The Civil War Era&rdquo; (1988)', 'Edward Hagerman, &ldquo;The American Civil War and the Origins of Modern Warfare: Ideas, Organization, and Field Command&rdquo; (1988)'],
    },
  },
};

/* the period-broadsheet palette (AA on the dark sheet; reused from T6 / codex tokens).
   #9f845c label 4.58:1 · #e9dcc0 body · #f0d98a heading · #e8c84a selection ring. */
var _rtmEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&(?![a-zA-Z#0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

/* ---- pure accessors ---- */
function rtmLeverTeach(key) { try { return (key && RTM.levers[key]) ? RTM.levers[key] : null; } catch (e) { return null; } }
function rtmBundleTeach(key) { try { return (key && RTM.bundles[key]) ? RTM.bundles[key] : null; } catch (e) { return null; } }
/* the human label of a lever's CURRENT value (e.g. attrition 1.3 -> "Heavy"), read from
   FLDP so the teaching is contextual. Returns "" when FLDP / the value isn't resolvable. */
function rtmSettingLabel(leverKey, value) {
  try {
    if (typeof FLDP === "undefined" || !FLDP.levers || !FLDP.levers[leverKey]) return "";
    var opts = FLDP.levers[leverKey].opts || [];
    for (var i = 0; i < opts.length; i++) if (String(opts[i].v) === String(value)) return opts[i].l;
    return "";
  } catch (e) { return ""; }
}

/* gather the unique source list across the current bundle + all taught levers (for the
   single combined "Sources" block — keeps the per-lever cards uncluttered). */
function _rtmAllSources(bundleKey) {
  var seen = {}, out = [], i, j, push = function (arr) { if (!arr) return; for (j = 0; j < arr.length; j++) { var s = arr[j]; if (s && !seen[s]) { seen[s] = 1; out.push(s); } } };
  var b = rtmBundleTeach(bundleKey); if (b) push(b.sources);
  for (i = 0; i < RTM.leverOrder.length; i++) { var L = rtmLeverTeach(RTM.leverOrder[i]); if (L) push(L.sources); }
  return out;
}

/* ===========================================================================
   THE EXPANDER — rendered into the T6 picker when "What this costs in real life"
   is open. cfg = a resolved/working preset config: { realism, attrition, canister,
   supply, cmdShock, sight, veteran, aiSkill, fog }. Robust to a null / partial cfg.
   Full keyboard/ARIA via native elements; CVD-safe (the ▸ marker + the word label
   carry meaning, never colour alone); reduce-motion-safe (no transitions added).
   =========================================================================== */
function _rtmCard(leverKey, cfg) {
  var L = rtmLeverTeach(leverKey); if (!L) return "";
  var cur = cfg ? cfg[leverKey] : undefined;
  var setLbl = rtmSettingLabel(leverKey, cur);
  var chip = setLbl
    ? '<span style="margin-left:8px;font-size:10.5px;font-weight:bold;letter-spacing:.05em;color:#241c10;background:#c9a85f;border-radius:3px;padding:1px 7px;white-space:nowrap">YOURS: ' + _rtmEsc(setLbl).toUpperCase() + '</span>'
    : '';
  return '<div style="margin:0 0 10px 0;padding:8px 10px;border-radius:6px;background:#1a150d">'
    + '<div style="display:flex;align-items:baseline;flex-wrap:wrap;gap:2px"><span aria-hidden="true" style="color:#c9a85f;margin-right:5px">&#9656;</span>'
    +   '<span style="font-weight:bold;color:#f0d98a;letter-spacing:.02em">' + L.title + '</span>' + chip + '</div>'
    + '<div style="font-size:11px;font-style:italic;opacity:.72;color:#e9dcc0;margin:2px 0 4px 14px">' + L.models + '</div>'
    + '<div style="font-size:12px;line-height:1.55;color:#e9dcc0;margin-left:14px">' + L.cost + '</div></div>';
}
function rtmRealismExpanderHTML(cfg) {
  cfg = cfg || {};
  var bKey = cfg.realism, b = rtmBundleTeach(bKey), i;
  var head = '<div id="rtmTeach" style="margin-top:10px;border-top:1px solid #8c724e;padding-top:10px">'
    + '<div style="font-size:11px;line-height:1.55;opacity:.85;color:#e9dcc0;margin-bottom:10px">' + RTM.intro + '</div>';
  if (b) {
    head += '<div style="margin:0 0 12px 0;padding:9px 11px;border-radius:6px;background:#241c10;border-left:3px solid #c9a85f">'
      + '<div style="font-weight:bold;color:#f0d98a;letter-spacing:.02em;margin-bottom:3px">' + b.title + '</div>'
      + '<div style="font-size:12px;line-height:1.55;color:#e9dcc0">' + b.cost + '</div></div>';
  }
  var cards = '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9f845c;margin:2px 0 6px">The dials, and what they cost</div>';
  for (i = 0; i < RTM.leverOrder.length; i++) cards += _rtmCard(RTM.leverOrder[i], cfg);
  // a single combined, collapsed Sources block (native <details> — keyboard-accessible, reduce-motion-safe)
  var srcs = _rtmAllSources(bKey), srcHTML = "";
  if (srcs.length) {
    srcHTML = '<details style="margin-top:6px"><summary style="cursor:pointer;font-size:11px;color:#9f845c;letter-spacing:.05em">Sources &amp; further reading (' + srcs.length + ')</summary>'
      + '<ul style="margin:6px 0 0 0;padding-left:18px;font-size:11px;line-height:1.6;color:#e9dcc0">';
    for (i = 0; i < srcs.length; i++) srcHTML += '<li>' + srcs[i] + '</li>';
    srcHTML += '</ul></details>';
  }
  return head + cards + srcHTML + '</div>';
}

/* ===========================================================================
   THE HUB READ-OUT — a compact teaching line for the 95-playstyle "Play Your Way"
   hub's battlefield row. cfg = the resolved tactical config (fldPresetResolve() ||
   fldPresetNeutral()). Returns "" when there's nothing to say (robust).
   =========================================================================== */
function rtmHubReadout(cfg) {
  try {
    cfg = cfg || {};
    var b = rtmBundleTeach(cfg.realism); if (!b) return "";
    // the bundle title + the FIRST sentence of its framing (a one-line teaser; the full
    // teaching lives in the picker's expander, which the hub links to). Split on ". "
    // (a plain string, NOT a lookbehind regex — lookbehind is a parse-time SyntaxError on
    // Safari < 16.4 and would break the whole single-file game on those engines).
    var _parts = String(b.cost).split(". ");
    var first = (_parts.length > 1) ? _parts[0] + "." : String(b.cost);
    return '<div style="font-size:11px;line-height:1.5;opacity:.82;color:#e9dcc0;margin-top:3px">'
      + '<span aria-hidden="true" style="color:#c9a85f">&#9656;</span> <b style="color:#f0d98a">' + b.title + '</b><br>' + first
      + ' <span style="opacity:.7">&mdash; the full reckoning is under &ldquo;What this costs in real life&rdquo; in the <span aria-hidden="true">&#9881;</span> Command &amp; Realism picker.</span></div>';
  } catch (e) { return ""; }
}
