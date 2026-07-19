#!/usr/bin/env node
// Read-only data-schema validator. Reads all data/*.json files and validates
// required top-level keys per file type. Writes tools/shots/data-schema-validation.html
// with pass/fail per file.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from './report-html-escape.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = join(ROOT, 'data');
const SHOTS = join(__dirname, 'shots');
const diagnosticArg = process.argv.find(arg => arg.startsWith('--diagnostic-invalid='));
const DIAGNOSTIC_INVALID = diagnosticArg ? diagnosticArg.slice('--diagnostic-invalid='.length) : '';
const DIAGNOSTIC_FAMILIES = new Set(['', 'all', 'battle', 'meta', 'schema', 'ratings', 'battle-homeedge', 'battle-doctrine', 'battle-learnmeta', 'cos-badrule', 'concept-badanchor']);
if (!DIAGNOSTIC_FAMILIES.has(DIAGNOSTIC_INVALID)) {
  console.error('Unknown diagnostic family: ' + DIAGNOSTIC_INVALID);
  process.exit(2);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// ---- Closed-world schema map: every family requires substantive nonempty keys ----
const BATTLE_FILES = new Set([
  'antietam.json', 'atlanta.json', 'bullrun.json', 'chancellorsville.json', 'chickamauga.json',
  'chattanooga.json', 'cedar-creek.json', 'cold-harbor.json', 'cross-keys-port-republic.json', 'franklin.json', 'fredericksburg.json', 'gaines-mill.json', 'gettysburg.json', 'kennesaw.json',
  'five-forks.json', 'fort-donelson.json', 'nashville.json', 'new-market-heights.json',
  'malvern-hill.json', 'elkhorn-tavern.json', 'petersburg-assaults.json', 'shiloh.json', 'spotsylvania.json', 'stones-river.json', 'vicksburg.json', 'wilderness.json'
]);
// D442: 56 -> 57 data files — cold-harbor.json enrolls as the 26th battle family member (the
// documented pin-bump idiom; prior transitions D436 55->56 Atlanta, D397 53->54 Petersburg,
// D393 52->53 Wilderness). D445: 57 -> 58 — chief-of-staff.json enrolls in the schema family
// (GEA-08; scenarios stay 26). D446: 58 -> 59 — concept-links.json enrolls (GEA-10).

const META_REQUIREMENTS = new Map([
  ['cabinet.json', ['_meta', 'sides', 'crossCards']],
  ['codex.json', ['_meta', 'axes', 'entries']],
  ['decisions.json', ['_meta', 'cards']],
  ['generals.json', ['comment', 'sides', 'teachingCards']],
  ['loot-survival.json', ['_meta', 'rarities', 'survival', 'drops', 'items']],
  ['press.json', ['_meta', 'papers', 'teachingCards']],
  ['primary-sources.json', ['_meta', 'schema', 'categories', 'records']],
  ['soldier-replacements.json', ['_meta', 'schema', 'records', '_template']],
  ['women-in-war.json', ['_meta', 'schema', 'records']]
]);

const SCHEMA_REQUIREMENTS = new Map([
  ['chief-of-staff.json', ['schema', 'schemaVersion', 'config', 'rules']],
  ['concept-links.json', ['schema', 'schemaVersion', 'concepts']],
  ['mayhem-rules.json', ['schema', 'version', 'actions']],
  ['artillery.json', ['schemaVersion', 'guns', 'teachingCards']],
  ['cs-finance.json', ['schema', 'schemaVersion', 'config', 'profile', 'instruments']],
  ['diplomacy.json', ['schemaVersion', 'teachingCards', 'realDiplomacy', 'numbersAudit']],
  ['disease-medical.json', ['schema', 'schemaVersion', 'config', 'profiles', 'practices', 'debates']],
  ['economy.json', ['schemaVersion', 'sides', 'finance', 'production', 'manpower', 'timeline', 'teachingCardIndex']],
  ['engineering.json', ['schemaVersion', 'branches', 'teachingCards']],
  ['flagship-units.json', ['schema', 'schemaVersion', 'config', 'profiles', 'units', 'debates']],
  ['footage-cutaways.json', ['schema', 'schemaVersion', 'policy', 'records']],
  ['hard-war.json', ['schema', 'schemaVersion', 'config', 'profiles', 'policies', 'debates']],
  ['human-cost.json', ['schema', 'schemaVersion', 'historicalScale', 'profile', 'anchors', 'debates']],
  ['irregular-war.json', ['schema', 'schemaVersion', 'config', 'profiles', 'threads', 'debates']],
  ['logistics-rail.json', ['schema', 'schemaVersion', 'config', 'profiles', 'theaters', 'routes', 'benchmarks', 'debates']],
  ['manpower-teaching.json', ['schemaVersion', 'teachingCards', 'numbersAudit']],
  ['media-budget.json', ['schema', 'schemaVersion', 'policy', 'performanceProfile', 'categories', 'locks']],
  ['prisoner-exchange.json', ['schema', 'schemaVersion', 'config', 'profiles', 'policyTimeline', 'camps', 'debates']],
  ['terrain-cover.json', ['schemaVersion', 'types', 'teachingCards']],
  ['tripo-unit-assets.json', ['schema', 'version', 'policy', 'records']],
  ['under-told-perspectives.json', ['schema', 'schemaVersion', 'config', 'profiles', 'threads', 'debates']],
  ['weapons.json', ['schemaVersion', 'weapons']],
  ['western-theater.json', ['schema', 'schemaVersion', 'profile', 'currentArc', 'strategicHinges', 'futureLocks', 'guardrails']]
]);

const RATINGS_FILE = 'ratings.json';
const RATINGS_REQUIREMENTS = ['_meta', 'attributes', 'ovrWeights', 'gradeBands', 'rankBase', 'realismCaps', 'badgeDefs', 'personas', 'generalPersonas'];
const BATTLE_ROOT_REQUIREMENTS = ['_comment'];
const BATTLE_REQUIREMENTS = [
  'id', 'name', 'date', 'place', 'blurb', 'attacker', 'defender', 'defaultFog',
  'field', 'objective', 'holdToWinSec', 'timeLimitSec', 'brief', 'sides',
  'teaching', 'provenance', 'weather'
];
const PHASE_REQUIREMENTS = [
  'id', 'name', 'attacker', 'defender', 'defaultFog', 'objective', 'holdToWinSec',
  'timeLimitSec', 'scoreWeight', 'oob', 'leaders', 'reinforcements', 'terrain',
  'supply', 'teaching', 'timing', 'transition', 'sector'
];
const META_ROOT_KEYS = new Set(['_comment', '_meta', 'schemaVersion']);

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function isMeaningful(v) {
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  if (Array.isArray(v)) return v.length > 0;
  if (isObject(v)) return Object.keys(v).length > 0;
  return false;
}

function requireKeys(obj, keys, prefix, issues) {
  if (!isObject(obj)) {
    issues.push((prefix || 'root') + ' must be an object');
    return;
  }
  for (const key of keys) {
    const path = prefix ? prefix + '.' + key : key;
    if (!Object.prototype.hasOwnProperty.call(obj, key)) issues.push(path + ' missing');
    else if (!isMeaningful(obj[key])) issues.push(path + ' empty/invalid');
  }
}

function ruleFor(filename) {
  if (BATTLE_FILES.has(filename)) return { family: 'battle', required: BATTLE_ROOT_REQUIREMENTS };
  if (META_REQUIREMENTS.has(filename)) return { family: 'meta', required: META_REQUIREMENTS.get(filename) };
  if (filename === RATINGS_FILE) return { family: 'ratings', required: RATINGS_REQUIREMENTS };
  if (SCHEMA_REQUIREMENTS.has(filename)) return { family: 'schema', required: SCHEMA_REQUIREMENTS.get(filename) };
  return null;
}

const MAYHEM_OPERATIONS = new Set([
  'battle.score.add','phase.score.add','objective.resolve','casualty.apply','casualty.credit','capture.credit',
  'result.declare','result.reclassify','campaign.victoryProgress.add','enemyWill.add','morale.add','discipline.add',
  'press.add','diplomacy.add','funds.add','resource.add','loot.grant','technology.unlock','weapon.grant',
  'career.promote','reputation.add','notoriety.add','achievement.unlock','modifier.add','roster.add',
  'roster.transfer','reinforcement.add','scenario.unlock','timeline.branch','chronicle.event'
]);
const MAYHEM_PREDICATES = new Set(['ruleset.is','side.isActor']);
const MAYHEM_TAGS = new Set(['side','faction','unit','identity','leader','policy','timeline']);
function exactKeys(node, allowed, prefix, issues) {
  if (!isObject(node)) { issues.push(prefix + ' must be an object'); return false; }
  for (const key of Object.keys(node)) if (!allowed.includes(key)) issues.push(prefix + '.' + key + ' unknown key');
  return true;
}
function stableId(value) { return typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{0,79}$/.test(value); }
function safeText(value, max) {
  return typeof value === 'string' && value.length > 0 && value.length <= max &&
    !/(?:function\b|=>|\beval\b|constructor|callback|import\s*\(|require\s*\(|prototype|__proto__|\[\s*['"])/i.test(value);
}
function validateMayhem(data, issues) {
  exactKeys(data, ['schema','version','actions'], 'root', issues);
  if (data.schema !== 'cw_mayhem_rules_v1') issues.push('schema must be cw_mayhem_rules_v1');
  if (data.version !== 1) issues.push('version must be 1');
  if (!Array.isArray(data.actions) || !data.actions.length || data.actions.length > 64) { issues.push('actions must be a nonempty bounded array'); return; }
  const ids = new Set();
  data.actions.forEach((action, ai) => {
    const p = 'actions[' + ai + ']';
    exactKeys(action, ['id','rulesetId','availableWhen','actorTags','effects','presentation'], p, issues);
    if (!stableId(action.id)) issues.push(p + '.id malformed'); else if (ids.has(action.id)) issues.push(p + '.id duplicate'); else ids.add(action.id);
    // D457 chain (LANE-013 incidental root-fix): the pre-D457 tooth pinned rulesetId==='mayhem'
    // only; D457 shipped the Historical judged action (rulesetId 'historical', exact-match law in
    // src/107 _mhResolve). The gate now admits exactly the two shipped ruleset ids, requires the
    // ruleset.is predicate to EQUAL the action's declared rulesetId (the exact-match law), and —
    // strengthening, below — enforces the D457 massacre-block consequence allowlist + sign law on
    // historical actions at the data layer. Old: must-be-mayhem. New: the shipped D457 contract.
    if (action.rulesetId !== 'mayhem' && action.rulesetId !== 'historical') issues.push(p + '.rulesetId must be mayhem or historical (D457)');
    if (!Array.isArray(action.availableWhen) || !action.availableWhen.length || action.availableWhen.length > 16) issues.push(p + '.availableWhen malformed');
    else action.availableWhen.forEach((pred, pi) => { const q=p+'.availableWhen['+pi+']'; exactKeys(pred, ['id','value'], q, issues); if(!MAYHEM_PREDICATES.has(pred.id))issues.push(q+'.id unknown predicate'); if(pred.id==='ruleset.is'&&pred.value!==action.rulesetId)issues.push(q+'.value must equal the declared rulesetId (D457 exact-match law)'); if(pred.id==='side.isActor'&&Object.keys(pred).includes('value'))issues.push(q+'.value forbidden'); });
    // D457 massacre-block at the data layer (LANE-013): a historical-ruleset action may carry
    // ONLY the consequence family — morale/press/diplomacy.add (<= 0), notoriety.add (>= 0),
    // modifier.add, chronicle.event. Every other operation family fails the gate here, before
    // the engine's _MH_HISTORICAL_OPS ever sees it. A red here is a design failure.
    if (action.rulesetId === 'historical' && Array.isArray(action.effects)) {
      const HIST_OPS = { 'morale.add': -1, 'press.add': -1, 'diplomacy.add': -1, 'notoriety.add': 1, 'modifier.add': 0, 'chronicle.event': 0 };
      action.effects.forEach((effect, ei) => {
        const q = p + '.effects[' + ei + ']';
        if (!effect || typeof effect !== 'object') return;
        const rule = HIST_OPS[effect.operation];
        if (rule === undefined) issues.push(q + '.operation forbidden for a historical-ruleset action (D457 massacre-block)');
        else if (rule === -1 && !(Number(effect.value) <= 0)) issues.push(q + '.value must be <= 0 (D457 sign law)');
        else if (rule === 1 && !(Number(effect.value) >= 0)) issues.push(q + '.value must be >= 0 (D457 sign law)');
      });
    }
    if (!Array.isArray(action.actorTags) || !action.actorTags.length || action.actorTags.length > 16) issues.push(p + '.actorTags malformed');
    else action.actorTags.forEach((tag, ti) => { const q=p+'.actorTags['+ti+']'; exactKeys(tag,['namespace','value'],q,issues); if(!MAYHEM_TAGS.has(tag.namespace))issues.push(q+'.namespace unknown'); if(!stableId(tag.value))issues.push(q+'.value malformed'); });
    if (!Array.isArray(action.effects) || !action.effects.length || action.effects.length > 64) issues.push(p + '.effects malformed');
    else action.effects.forEach((effect, ei) => { const q=p+'.effects['+ei+']'; exactKeys(effect,['operation','target','value','tag'],q,issues); if(!MAYHEM_OPERATIONS.has(effect.operation))issues.push(q+'.operation unknown'); if(!stableId(effect.target))issues.push(q+'.target malformed'); if(!Number.isFinite(effect.value)||Math.abs(effect.value)>1000000)issues.push(q+'.value unsafe'); if(effect.tag!==undefined){exactKeys(effect.tag,['namespace','value'],q+'.tag',issues);if(!MAYHEM_TAGS.has(effect.tag.namespace))issues.push(q+'.tag.namespace unknown');if(!stableId(effect.tag.value))issues.push(q+'.tag.value malformed');} });
    if (exactKeys(action.presentation,['label','summary','tone','icon'],p+'.presentation',issues)) { const x=action.presentation; if(!safeText(x.label,80)||!safeText(x.summary,240)||!safeText(x.tone,32)||!stableId(x.icon))issues.push(p+'.presentation invalid'); }
  });
}

// GEA-08 (D445): the Chief of Staff brief data — closed shapes end to end. Reader ids are the
// CLOSED registry src/109-chief-of-staff.js resolves (pure property-path reads); tab ids are
// LIVE-DERIVED from the src/30 desk shell's tab registry (the D423 registry-truth idiom — a
// renamed/removed desk tab forces this data file to move with it). Copy templates are plain
// text ({value} substitution only): no markup, no eval-shaped content.
const COS_READER_IDS = new Set([
  'decisions-pending', 'treasury-funds', 'treasury-inflation', 'morale-public',
  'manpower-pool', 'blockade-recognition', 'rail-integrity'
]);
let COS_TAB_SET = null;
function cosDeskTabSet(issues) {
  if (COS_TAB_SET) return COS_TAB_SET;
  try {
    const shell = readFileSync(join(ROOT, 'src', '30-president-shell.js'), 'utf8');
    const m = shell.match(/var tabs = \[([^\]]+)\]/);
    if (m) COS_TAB_SET = new Set(m[1].split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean));
  } catch (e) { /* fall through */ }
  if (!COS_TAB_SET || !COS_TAB_SET.size) { COS_TAB_SET = new Set(); issues.push('cannot derive the desk tab registry from src/30-president-shell.js'); }
  return COS_TAB_SET;
}
function validateChiefOfStaff(data, issues) {
  exactKeys(data, ['_comment', 'schema', 'schemaVersion', 'config', 'rules'], 'root', issues);
  if (data.schema !== 'cw_chief_of_staff_v1') issues.push('schema must be cw_chief_of_staff_v1');
  if (data.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (exactKeys(data.config, ['maxLines', 'allQuiet'], 'config', issues)) {
    if (!Number.isInteger(data.config.maxLines) || data.config.maxLines < 1 || data.config.maxLines > 3) issues.push('config.maxLines must be an integer 1-3');
    if (!safeText(data.config.allQuiet, 240) || /[<>]/.test(data.config.allQuiet)) issues.push('config.allQuiet must be bounded plain text');
  }
  if (!Array.isArray(data.rules) || !data.rules.length || data.rules.length > 16) { issues.push('rules must be a nonempty array of at most 16'); return; }
  const tabs = cosDeskTabSet(issues);
  const ids = new Set();
  data.rules.forEach((rule, i) => {
    const p = 'rules[' + i + ']';
    if (!exactKeys(rule, ['id', 'reader', 'op', 'threshold', 'severity', 'copy', 'tab', 'label'], p, issues)) return;
    if (!stableId(rule.id)) issues.push(p + '.id malformed'); else if (ids.has(rule.id)) issues.push(p + '.id duplicate'); else ids.add(rule.id);
    if (!COS_READER_IDS.has(rule.reader)) issues.push(p + '.reader unknown reader id ' + JSON.stringify(rule.reader));
    if (rule.op !== 'lt' && rule.op !== 'gte') issues.push(p + '.op must be lt or gte');
    if (!Number.isFinite(rule.threshold)) issues.push(p + '.threshold must be finite');
    if (!Number.isFinite(rule.severity) || rule.severity < 0 || rule.severity > 100) issues.push(p + '.severity must be 0-100');
    if (!safeText(rule.copy, 240) || /[<>]/.test(rule.copy)) issues.push(p + '.copy must be bounded plain text (no markup)');
    if (tabs.size && !tabs.has(rule.tab)) issues.push(p + '.tab is not a live desk tab id: ' + JSON.stringify(rule.tab));
    if (!safeText(rule.label, 40) || /[<>]/.test(rule.label)) issues.push(p + '.label must be bounded plain text');
  });
}

// GEA-10 (D446): the concept-links registry — closed shape + LIVE-DERIVED anchor resolution
// (the registry-truth idiom): kind codex -> a real codex entry id; glossary -> a real codex
// entry term (case-insensitive exact); source -> a real primary-sources record id; card -> a
// real teaching-card id somewhere in the battle files (battle- or phase-level). A renamed or
// deleted anchor in the owning file forces this registry to move with it.
const CONCEPT_KINDS = new Set(['codex', 'glossary', 'source', 'card']);
let CONCEPT_ANCHORS = null;
function conceptAnchorSets() {
  if (CONCEPT_ANCHORS) return CONCEPT_ANCHORS;
  const sets = { codex: new Set(), glossary: new Set(), source: new Set(), card: new Set() };
  try {
    const cx = JSON.parse(readFileSync(join(DATA, 'codex.json'), 'utf8'));
    for (const en of (cx.entries || [])) { if (en && en.id) sets.codex.add(en.id); if (en && en.term) sets.glossary.add(String(en.term).toLowerCase()); }
  } catch (e) { /* codex.json fails its own row */ }
  try {
    const ps = JSON.parse(readFileSync(join(DATA, 'primary-sources.json'), 'utf8'));
    for (const rec of (ps.records || [])) if (rec && rec.id) sets.source.add(rec.id);
  } catch (e) { /* primary-sources.json fails its own row */ }
  for (const file of BATTLE_FILES) {
    try {
      const data = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
      const key = Object.keys(data).find(name => !META_ROOT_KEYS.has(name));
      const battle = key ? data[key] : null; if (!battle) continue;
      const packs = [];
      if (battle.teaching && Array.isArray(battle.teaching.cards)) packs.push(battle.teaching.cards);
      for (const phase of (battle.phases || [])) if (phase && phase.teaching && Array.isArray(phase.teaching.cards)) packs.push(phase.teaching.cards);
      for (const cards of packs) for (const card of cards) if (card && card.id) sets.card.add(card.id);
    } catch (e) { /* the battle file fails its own row */ }
  }
  CONCEPT_ANCHORS = sets;
  return sets;
}
function validateConceptLinks(data, issues) {
  exactKeys(data, ['_comment', 'schema', 'schemaVersion', 'concepts'], 'root', issues);
  if (data.schema !== 'cw_concept_links_v1') issues.push('schema must be cw_concept_links_v1');
  if (data.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (!Array.isArray(data.concepts) || !data.concepts.length || data.concepts.length > 64) { issues.push('concepts must be a nonempty array of at most 64'); return; }
  const anchors = conceptAnchorSets();
  const ids = new Set();
  data.concepts.forEach((c, i) => {
    const p = 'concepts[' + i + ']';
    if (!exactKeys(c, ['id', 'kind', 'anchor'], p, issues)) return;
    if (typeof c.id !== 'string' || !/^concept:[a-z0-9][a-z0-9-]{0,60}$/.test(c.id)) issues.push(p + '.id malformed');
    else if (ids.has(c.id)) issues.push(p + '.id duplicate'); else ids.add(c.id);
    if (!CONCEPT_KINDS.has(c.kind)) { issues.push(p + '.kind unknown'); return; }
    if (typeof c.anchor !== 'string' || !c.anchor || c.anchor.length > 120) { issues.push(p + '.anchor malformed'); return; }
    const pool = anchors[c.kind];
    const hit = (c.kind === 'glossary') ? pool.has(c.anchor.toLowerCase()) : pool.has(c.anchor);
    if (!hit) issues.push(p + '.anchor does not resolve to a real ' + c.kind + ' entry: ' + JSON.stringify(c.anchor));
  });
}

function validateRoles(node, prefix, issues) {
  if (!['US', 'CS'].includes(node.attacker)) issues.push(prefix + '.attacker must be US or CS');
  if (!['US', 'CS'].includes(node.defender)) issues.push(prefix + '.defender must be US or CS');
  if (node.attacker === node.defender) issues.push(prefix + ' attacker and defender must differ');
  if (typeof node.defaultFog !== 'boolean') issues.push(prefix + '.defaultFog must be boolean');
}

// E73 (D426): OPTIONAL gameplay-input fields must be shape-valid WHEN PRESENT — a typo
// (homeEdge US "lo", assaultDoctrine "cautius") used to fall back silently to the default
// rout/supply edges or standard AI while this schema stayed green. Semantics mirror the
// runtime exactly and change no battle value: fldHomeEdgeSpec (src/tactical/T0:603) accepts
// exactly {US,CS} each "low"|"high"; T1/T8 treat exactly "cautious" as the cautious posture;
// live data also carries explicit nulls (equivalent to absent), which stay legal.
function validateHomeEdge(node, prefix, issues) {
  if (!isObject(node) || !Object.prototype.hasOwnProperty.call(node, 'homeEdge') || node.homeEdge == null) return;
  const he = node.homeEdge;
  if (!isObject(he)) { issues.push(prefix + '.homeEdge must be an object with US/CS'); return; }
  for (const key of Object.keys(he)) if (key !== 'US' && key !== 'CS') issues.push(prefix + '.homeEdge.' + key + ' unknown key');
  for (const side of ['US', 'CS']) {
    if (he[side] !== 'low' && he[side] !== 'high') issues.push(prefix + '.homeEdge.' + side + ' must be "low" or "high"');
  }
}
function validateAssaultDoctrine(node, prefix, issues) {
  if (!isObject(node) || !Object.prototype.hasOwnProperty.call(node, 'assaultDoctrine') || node.assaultDoctrine == null) return;
  if (node.assaultDoctrine !== 'cautious' && node.assaultDoctrine !== 'standard') {
    issues.push(prefix + '.assaultDoctrine must be "cautious" or "standard" when present');
  }
}

// GEA-07 (D444): learnMeta is OPTIONAL presentation metadata on the battle payload —
// { phases, approxMinutes: [lo, hi], skills: [known ids], recommendedAfter: id|null }.
// Closed shape, bounded arrays, known skill ids only, recommendedAfter must be a REAL
// scenario id (live-derived from the battle files' payload keys, never a hardcoded list)
// or null, and phases must equal the battle's actual phase count. It is NEVER a gameplay
// input (no combat/AI file may read it — the probe grep-guard pins that side).
const LEARN_SKILL_IDS = new Set([
  'facing', 'formations', 'fog-scouting', 'reinforcements', 'phases', 'works-assault',
  'artillery', 'assault-pacing', 'defense-hold', 'morale-rally', 'supply-ammo', 'cavalry'
]);
let SCENARIO_ID_SET = null;
function scenarioIdSet() {
  if (SCENARIO_ID_SET) return SCENARIO_ID_SET;
  SCENARIO_ID_SET = new Set();
  for (const file of BATTLE_FILES) {
    try {
      const data = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
      const key = Object.keys(data).find(name => !META_ROOT_KEYS.has(name));
      if (key) SCENARIO_ID_SET.add(key);
    } catch (e) { /* an unparseable file already fails its own row */ }
  }
  return SCENARIO_ID_SET;
}
function validateLearnMeta(battle, battleKey, issues) {
  if (!isObject(battle) || !Object.prototype.hasOwnProperty.call(battle, 'learnMeta') || battle.learnMeta == null) return;
  const lm = battle.learnMeta;
  const prefix = battleKey + '.learnMeta';
  if (!isObject(lm)) { issues.push(prefix + ' must be an object'); return; }
  for (const key of Object.keys(lm)) {
    if (!['phases', 'approxMinutes', 'skills', 'recommendedAfter'].includes(key)) issues.push(prefix + '.' + key + ' unknown key');
  }
  const actualPhases = Array.isArray(battle.phases) ? battle.phases.length : 1;
  if (!Number.isInteger(lm.phases) || lm.phases !== actualPhases) {
    issues.push(prefix + '.phases must equal the actual phase count ' + actualPhases);
  }
  if (!Array.isArray(lm.approxMinutes) || lm.approxMinutes.length !== 2 ||
      !Number.isInteger(lm.approxMinutes[0]) || !Number.isInteger(lm.approxMinutes[1]) ||
      lm.approxMinutes[0] < 1 || lm.approxMinutes[0] > lm.approxMinutes[1] || lm.approxMinutes[1] > 240) {
    issues.push(prefix + '.approxMinutes must be [lo, hi] integers with 1 <= lo <= hi <= 240');
  }
  if (!Array.isArray(lm.skills) || !lm.skills.length || lm.skills.length > 6) {
    issues.push(prefix + '.skills must be a nonempty array of at most 6 skill ids');
  } else {
    const seen = new Set();
    lm.skills.forEach((skill, i) => {
      if (!LEARN_SKILL_IDS.has(skill)) issues.push(prefix + '.skills[' + i + '] unknown skill id ' + JSON.stringify(skill));
      else if (seen.has(skill)) issues.push(prefix + '.skills[' + i + '] duplicate skill id ' + skill);
      else seen.add(skill);
    });
  }
  if (lm.recommendedAfter !== null) {
    if (typeof lm.recommendedAfter !== 'string' || !scenarioIdSet().has(lm.recommendedAfter)) {
      issues.push(prefix + '.recommendedAfter must be null or a registered scenario id');
    } else if (lm.recommendedAfter === battleKey) {
      issues.push(prefix + '.recommendedAfter must not be the scenario itself');
    }
  }
}

function validateObjective(objective, prefix, issues) {
  if (!isObject(objective)) {
    issues.push(prefix + ' must be an object');
    return;
  }
  if (typeof objective.name !== 'string' || !objective.name.trim()) issues.push(prefix + '.name missing');
  for (const key of ['x', 'z', 'r']) {
    if (!Number.isFinite(objective[key])) issues.push(prefix + '.' + key + ' must be finite');
  }
  if (Number.isFinite(objective.r) && objective.r <= 0) issues.push(prefix + '.r must be positive');
}

function validateOob(oob, prefix, issues) {
  if (!isObject(oob)) {
    issues.push(prefix + ' must be an object');
    return;
  }
  const ids = new Set();
  for (const side of ['US', 'CS']) {
    const units = oob[side];
    if (!Array.isArray(units) || !units.length) {
      issues.push(prefix + '.' + side + ' must be a nonempty array');
      continue;
    }
    for (let i = 0; i < units.length; i++) {
      const id = units[i] && units[i].id;
      if (typeof id !== 'string' || !id.trim()) issues.push(prefix + '.' + side + '[' + i + '].id missing');
      else if (ids.has(id)) issues.push(prefix + ' duplicate unit id ' + id);
      else ids.add(id);
    }
  }
}

function validateBattle(file, data, issues) {
  const payloadKeys = Object.keys(data).filter(key => !META_ROOT_KEYS.has(key));
  if (payloadKeys.length !== 1) {
    issues.push('battle root must contain exactly one payload object; found ' + payloadKeys.length);
    return { extraInfo: payloadKeys.length + ' payload keys' };
  }
  const battleKey = payloadKeys[0];
  const battle = data[battleKey];
  requireKeys(battle, BATTLE_REQUIREMENTS, battleKey, issues);
  if (!isObject(battle)) return { extraInfo: battleKey + ' invalid' };
  if (battle.id !== battleKey) issues.push(battleKey + '.id must match payload key');
  validateRoles(battle, battleKey, issues);
  validateHomeEdge(battle, battleKey, issues);            // E73: T1 reads data.homeEdge; T8 falls back to top.homeEdge
  validateAssaultDoctrine(battle, battleKey, issues);     // E73: T1 reads data.assaultDoctrine
  validateLearnMeta(battle, battleKey, issues);           // GEA-07: presentation-only Learn-the-Battle metadata
  if (!isObject(battle.field) || !Number.isFinite(battle.field.w) || battle.field.w <= 0 || !Number.isFinite(battle.field.h) || battle.field.h <= 0) {
    issues.push(battleKey + '.field must have positive finite w/h');
  }
  validateObjective(battle.objective, battleKey + '.objective', issues);
  if (!Number.isFinite(battle.holdToWinSec) || battle.holdToWinSec <= 0) issues.push(battleKey + '.holdToWinSec must be a positive number');
  if (!Number.isFinite(battle.timeLimitSec) || battle.timeLimitSec <= 0) issues.push(battleKey + '.timeLimitSec must be a positive number');
  if (!isObject(battle.brief) || typeof battle.brief.attack !== 'string' || !battle.brief.attack.trim() || typeof battle.brief.defend !== 'string' || !battle.brief.defend.trim()) issues.push(battleKey + '.brief needs nonempty attack/defend strings');
  if (!isObject(battle.sides) || !isObject(battle.sides.US) || !isObject(battle.sides.CS)) issues.push(battleKey + '.sides needs US/CS objects');
  if (!isObject(battle.teaching) || !Array.isArray(battle.teaching.cards) || !battle.teaching.cards.length) issues.push(battleKey + '.teaching.cards must be nonempty');

  if (Object.prototype.hasOwnProperty.call(battle, 'phases')) {
    if (!Array.isArray(battle.phases) || !battle.phases.length) {
      issues.push(battleKey + '.phases must be a nonempty array when present');
    } else {
      const phaseIds = new Set();
      battle.phases.forEach((phase, i) => {
        const prefix = battleKey + '.phases[' + i + ']';
        requireKeys(phase, PHASE_REQUIREMENTS, prefix, issues);
        if (!isObject(phase)) return;
        if (typeof phase.id !== 'string' || !phase.id.trim()) issues.push(prefix + '.id must be a nonempty string');
        else if (phaseIds.has(phase.id)) issues.push(battleKey + ' duplicate phase id ' + phase.id);
        else phaseIds.add(phase.id);
        validateRoles(phase, prefix, issues);
        validateHomeEdge(phase, prefix, issues);           // E73: T8 reads p.homeEdge per phase
        validateAssaultDoctrine(phase, prefix, issues);    // E73: T8 reads p.assaultDoctrine per phase
        validateObjective(phase.objective, prefix + '.objective', issues);
        validateOob(phase.oob, prefix + '.oob', issues);
        if (!Number.isFinite(phase.holdToWinSec) || phase.holdToWinSec <= 0) issues.push(prefix + '.holdToWinSec must be a positive number');
        if (!Number.isFinite(phase.timeLimitSec) || phase.timeLimitSec <= 0) issues.push(prefix + '.timeLimitSec must be a positive number');
        if (!Number.isFinite(phase.scoreWeight) || phase.scoreWeight <= 0) issues.push(prefix + '.scoreWeight must be a positive number');
      });
    }
  } else {
    validateOob(battle.oob, battleKey + '.oob', issues);
    if (!Array.isArray(battle.reinforcements)) issues.push(battleKey + '.reinforcements must be an array');
    if (!isObject(battle.terrain)) issues.push(battleKey + '.terrain must be an object');
  }
  return { extraInfo: Array.isArray(battle.phases) ? battle.phases.length + ' phases, ' + battle.attacker + ' vs ' + battle.defender : 'single-phase, ' + battle.attacker + ' vs ' + battle.defender };
}

function validateDocument(file, data) {
  const rule = ruleFor(file);
  const issues = [];
  if (!rule) return { family: 'unclassified', requiredKeys: [], issues: ['file has no registered schema rule'], extraInfo: 'FAIL CLOSED' };
  if (!rule.required.length) issues.push('internal schema error: ' + rule.family + ' requires zero keys');
  requireKeys(data, rule.required, '', issues);
  let extraInfo = rule.required.length + ' required keys';
  if (rule.family === 'battle') {
    extraInfo = validateBattle(file, data, issues).extraInfo;
  } else if (rule.family === 'meta') {
    if (file === 'generals.json') {
      if (typeof data.comment !== 'string' || !data.comment.trim()) issues.push('comment metadata must be nonempty');
    } else if (!isObject(data._meta)) {
      issues.push('_meta must be an object');
    }
    extraInfo = rule.required.length + ' explicit keys';
  } else if (rule.family === 'schema') {
    const marker = ['schemaVersion', 'schema', 'version'].find(key => Object.prototype.hasOwnProperty.call(data, key) && isMeaningful(data[key]));
    if (!marker) issues.push('schema/version marker missing');
    else if (!((typeof data[marker] === 'string' && data[marker].trim()) || (typeof data[marker] === 'number' && Number.isFinite(data[marker])))) issues.push(marker + ' must be a nonempty string or finite number');
    if (file === 'mayhem-rules.json') validateMayhem(data, issues);
    if (file === 'chief-of-staff.json') validateChiefOfStaff(data, issues);
    if (file === 'concept-links.json') validateConceptLinks(data, issues);
    extraInfo = (marker ? marker + '=' + String(data[marker]) : 'no version marker') + ', ' + rule.required.length + ' explicit keys';
  } else if (rule.family === 'ratings') {
    if (typeof data._meta !== 'string' || !data._meta.trim()) issues.push('_meta must be a nonempty string');
    if (!Array.isArray(data.attributes) || !data.attributes.length) issues.push('attributes must be nonempty');
    if (!isObject(data.ovrWeights)) issues.push('ovrWeights must be an object');
    extraInfo = rule.required.length + ' ratings invariants';
  }
  return { family: rule.family, requiredKeys: rule.required, issues, extraInfo };
}

function injectDiagnostic(file, family, data, rule, applied) {
  // E73 (D426): 'battle-homeedge' / 'battle-doctrine' are PERMANENT NEGATIVE FIXTURES for the
  // optional gameplay-input checks — they inject exactly the silent-typo class the checks exist
  // to catch (US "lo"; "cautius") into the first battle file, proving the teeth on demand.
  const wants = (DIAGNOSTIC_INVALID === 'all') ? family : (DIAGNOSTIC_INVALID.indexOf('battle-') === 0 ? 'battle' : ((DIAGNOSTIC_INVALID === 'cos-badrule' || DIAGNOSTIC_INVALID === 'concept-badanchor') ? 'schema' : DIAGNOSTIC_INVALID));
  if (!DIAGNOSTIC_INVALID || wants !== family || applied.some(item => item.family === family)) return data;
  // GEA-08 (D445): the cos-badrule PERMANENT NEGATIVE FIXTURE targets exactly chief-of-staff.json
  // (an unknown reader id + an unreal desk tab — the silent-rule-drop class the checks exist to name).
  if (DIAGNOSTIC_INVALID === 'cos-badrule' && file !== 'chief-of-staff.json') return data;
  // GEA-10 (D446): the concept-badanchor PERMANENT NEGATIVE FIXTURE targets exactly
  // concept-links.json (an anchor that resolves nowhere — the dead-deep-link class).
  if (DIAGNOSTIC_INVALID === 'concept-badanchor' && file !== 'concept-links.json') return data;
  const copy = JSON.parse(JSON.stringify(data));
  let key = '';
  if (DIAGNOSTIC_INVALID === 'cos-badrule') {
    if (Array.isArray(copy.rules) && copy.rules.length) { copy.rules[0].reader = 'not-a-reader'; copy.rules[0].tab = 'not-a-tab'; }
    applied.push({ family, file, removed: 'rules[0].reader/tab (GEA-08 invalid fixture)' });
    return copy;
  }
  if (DIAGNOSTIC_INVALID === 'concept-badanchor') {
    if (Array.isArray(copy.concepts) && copy.concepts.length) copy.concepts[0].anchor = 'not-a-real-anchor';
    applied.push({ family, file, removed: 'concepts[0].anchor (GEA-10 invalid fixture)' });
    return copy;
  }
  if (family === 'battle') {
    const battleKey = Object.keys(copy).find(name => !META_ROOT_KEYS.has(name));
    if (battleKey && isObject(copy[battleKey])) {
      if (DIAGNOSTIC_INVALID === 'battle-homeedge') { copy[battleKey].homeEdge = { US: 'lo', CS: 'high' }; key = battleKey + '.homeEdge (E73 typo fixture)'; }
      else if (DIAGNOSTIC_INVALID === 'battle-doctrine') { copy[battleKey].assaultDoctrine = 'cautius'; key = battleKey + '.assaultDoctrine (E73 typo fixture)'; }
      else if (DIAGNOSTIC_INVALID === 'battle-learnmeta') { copy[battleKey].learnMeta = { phases: 99, approxMinutes: [25, 5], skills: ['not-a-skill'], recommendedAfter: 'notAScenario' }; key = battleKey + '.learnMeta (GEA-07 invalid fixture)'; }
      else { delete copy[battleKey].objective; key = battleKey + '.objective'; }
    }
  } else {
    const skip = new Set(['_meta', 'comment', 'schema', 'schemaVersion', 'version']);
    key = rule.required.find(name => !skip.has(name)) || rule.required[0];
    delete copy[key];
  }
  applied.push({ family, file, removed: key });
  return copy;
}

function main() {
  ensureDir(SHOTS);

  const files = readdirSync(DATA)
    .filter(f => f.endsWith('.json'))
    .sort();

  const results = [];
  const diagnosticApplied = [];

  for (const file of files) {
    const filePath = join(DATA, file);
    const rule = ruleFor(file);
    let parseOk = false;
    let family = rule ? rule.family : 'unclassified';
    let requiredKeys = rule ? rule.required.slice() : [];
    let issues = [];
    let extraInfo = '';

    try {
      const raw = readFileSync(filePath, 'utf8');
      let data = JSON.parse(raw);
      parseOk = true;
      if (rule) data = injectDiagnostic(file, rule.family, data, rule, diagnosticApplied);
      const validated = validateDocument(file, data);
      family = validated.family;
      requiredKeys = validated.requiredKeys;
      issues = validated.issues;
      extraInfo = validated.extraInfo;
    } catch (e) {
      parseOk = false;
      issues = ['parse error: ' + e.message];
      extraInfo = e.message;
    }

    const pass = parseOk && issues.length === 0;
    results.push({ file, family, parseOk, requiredKeys, issues, extraInfo, pass });
  }

  const totalPassed = results.filter(r => r.pass).length;
  const totalFailed = results.filter(r => !r.pass).length;
  const totalRows = results.length;

  const tableRows = results.map(r => {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    const statusClass = r.pass ? 'pass' : 'fail';
    const parseStatus = r.parseOk ? '✅' : '❌';
    const issueStr = r.issues.length > 0 ? r.issues.join('; ') : '—';
    return `<tr>
      <td>${escapeHtml(r.file)}</td>
      <td>${escapeHtml(r.family)}</td>
      <td>${parseStatus}</td>
      <td>${escapeHtml(issueStr)}</td>
      <td>${escapeHtml(r.extraInfo || '—')}</td>
      <td class="${statusClass}">${status}</td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Data Schema Validation</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }
  h1 { border-bottom: 2px solid #2980b9; padding-bottom: 0.5rem; }
  .summary { margin: 1rem 0; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary span { margin-right: 2rem; }
  .pass { color: #27ae60; font-weight: bold; }
  .fail { color: #c0392b; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #2c3e50; color: #fff; font-weight: 600; }
  tr:hover { background: #f1f2f6; }
</style>
</head>
<body>
<h1>📋 Data Schema Validation</h1>
<div class="summary">
  <span>Total: <strong>${totalRows}</strong></span>
  <span class="pass">✅ Passed: <strong>${totalPassed}</strong></span>
  <span class="fail">❌ Failed: <strong>${totalFailed}</strong></span>
  <span>Generated: ${new Date().toISOString()}</span>
</div>
<table>
<thead>
<tr><th>File</th><th>Family</th><th>Parse OK</th><th>Missing / Invalid</th><th>Info</th><th>Status</th></tr>
</thead>
<tbody>
${tableRows}
</tbody>
</table>
</body>
</html>`;

  const outPath = join(SHOTS, 'data-schema-validation.html');
  writeFileSync(outPath, html, 'utf8');
  const familyCounts = {};
  for (const result of results) {
    const row = familyCounts[result.family] || { total: 0, passed: 0, failed: 0 };
    row.total++;
    if (result.pass) row.passed++; else row.failed++;
    familyCounts[result.family] = row;
  }
  const artifact = {
    ok: totalFailed === 0,
    diagnostic: DIAGNOSTIC_INVALID || null,
    diagnosticApplied,
    total: totalRows,
    passed: totalPassed,
    failed: totalFailed,
    familyCounts,
    pageerrors: [],
    results
  };
  writeFileSync(join(SHOTS, 'validate-data-schemas.json'), JSON.stringify(artifact, null, 2), 'utf8');
  console.log(`${artifact.ok ? '✅' : '❌'} data-schema-validation.html written (${totalRows} files, ${totalPassed} passed, ${totalFailed} failed)`);
  console.log(`validate-data-schemas ok=${artifact.ok} families=${Object.keys(familyCounts).join(',')} diagnostic=${artifact.diagnostic || 'none'}`);
  process.exitCode = artifact.ok ? 0 : 1;
}

try {
  main();
} catch (e) {
  ensureDir(SHOTS);
  try {
    writeFileSync(join(SHOTS, 'validate-data-schemas.json'), JSON.stringify({ ok: false, fatal: String(e && e.message || e), pageerrors: [] }, null, 2), 'utf8');
  } catch (_) {}
  console.error('FATAL validate-data-schemas:', e && e.message || e);
  process.exitCode = 1;
}
