#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D538 / LANE-022 Slice 1 focused proof — the READ-ONLY traced conquest supply route.
//
// Two halves by design. The STATIC half rebuilds the seam in a node:vm context from the ON-DISK
// src/115 + src/114 + src/61, so a source mutation reds it WITHOUT a rebuild (that is what makes the
// declared negative bind meaningful). The BROWSER half proves the identical behavior in the built
// deliverable. The declared D538 bind target is the single CONTAINMENT-B step.
//
// The vm context is created EMPTY on purpose: injecting a host Object breaks the substrate's
// prototype-identity ruleset check, which would silently fail every query closed.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { createContext, runInContext } from "node:vm";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
const ART = join(OUT, "probe-conquest-supply.json");
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, "shots.json"), "utf8"));
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const result = { ok: true, steps: [], failed: [], errors: [], pageerrors: [], realErrors: [], summary: null };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const need = (v, m) => { if (!v) throw new Error(m); };
async function up(u) { try { const r = await fetch(u, { method: "HEAD" }); return r.ok || r.status === 200; } catch { return false; } }
async function step(name, fn) {
  try { const v = await fn(); result.steps.push({ name, ok: true, v: v === undefined ? null : v }); console.log("  OK   " + name); }
  catch (e) { const err = String(e && e.message || e); result.ok = false; result.failed.push(name); result.steps.push({ name, ok: false, err }); console.error("  FAIL " + name + " :: " + err); }
}

/* ---- the on-disk seam, rebuilt from source ------------------------------- */
const SRC61 = "src/61-logistics-rail.js";
const DATA = {
  "conquest-territories": JSON.parse(read("data/conquest-territories.json")),
  "conquest-transport-evidence": JSON.parse(read("data/conquest-transport-evidence.json")),
  "logistics-rail": JSON.parse(read("data/logistics-rail.json"))
};
function diskSeam() {
  const ctx = createContext({});
  runInContext("var GAME_DATA=" + JSON.stringify(DATA) + "; function gameData(n){return GAME_DATA[n]||null;}", ctx);
  for (const f of ["src/115-conquest-transport.js", "src/114-conquest-board.js", SRC61]) runInContext(read(f), ctx);
  runInContext([
    "function mkPlain(side){return {side:side};}",
    "function mkConquest(side,id){return {side:side,campaignKind:{id:'conquest',version:1},ruleset:{id:id,version:1}};}"
  ].join("\n"), ctx);
  return expr => runInContext("JSON.stringify((function(){" + expr + "})())", ctx) ;
}
const SHIPPED_ROUTE_KEYS = ["id", "label", "theater", "theaterName", "friction", "note"];
const TRACE_KEYS = ["rulesetId", "authored", "applied", "side", "theater", "depot", "depotName", "target",
  "targetName", "reachable", "segments", "territories", "modeMix", "segmentCount", "reachedCount",
  "tracedFriction", "label"];

let server = null, browser = null;
try {
  /* ===================== STATIC / ON-DISK HALF ============================ */

  await step("SEAM SHAPE: a non-conquest carrier keeps the shipped six-key route and gets no trace", () => {
    const run = diskSeam();
    const v = JSON.parse(run("var r=_lgRoute(mkPlain('US'),null);return {keys:Object.keys(r),trace:conquestSupplyTrace(mkPlain('US'),null),hasTrace:Object.prototype.hasOwnProperty.call(r,'trace'),friction:r.friction};"));
    need(JSON.stringify(v.keys) === JSON.stringify(SHIPPED_ROUTE_KEYS), "non-conquest route keys drifted: " + JSON.stringify(v.keys));
    need(v.hasTrace === false, "non-conquest route attached a trace");
    need(v.trace === null, "non-conquest carrier produced a trace object");
    return { keys: v.keys.length, trace: null, friction: v.friction };
  });

  await step("CONTAINMENT-A: an authored trace object IS reachable on the open ruleset", () => {
    const run = diskSeam();
    const v = JSON.parse(run("var C=mkConquest('US','mayhem');var t=conquestSupplyTrace(C,null);var r=_lgRoute(C,null);return {t:t,routeKeys:Object.keys(r),sameRef:r.trace&&r.trace.depot===t.depot,frozen:[Object.isFrozen(t),Object.isFrozen(t.segments),Object.isFrozen(t.segments[0]),Object.isFrozen(t.modeMix)]};"));
    need(v.t && typeof v.t === "object", "the open ruleset produced no trace object");
    need(JSON.stringify(Object.keys(v.t)) === JSON.stringify(TRACE_KEYS), "trace field set drifted: " + JSON.stringify(Object.keys(v.t)));
    need(v.t.rulesetId === "mayhem" && v.t.authored === true, "trace is not stamped as authored open-ruleset content");
    need(v.t.applied === false, "Slice 1 must carry applied:false — nothing consumes the trace");
    need(v.t.depot === "CT-01" && v.t.target === "CT-03", "authored depot/front pair moved");
    need(v.t.reachable === true && v.t.segmentCount === 1 && v.t.segments[0].id === "CTS-R-02" && v.t.segments[0].mode === "rail",
      "the sourced Washington-Manassas rail segment no longer carries the default US route");
    need(JSON.stringify(v.t.territories) === JSON.stringify(["CT-01", "CT-03"]), "traced territory chain moved");
    need(v.routeKeys.length === 7 && v.routeKeys[6] === "trace", "the guarded route tail did not attach exactly one field");
    need(v.sameRef === true, "the route tail does not carry the same traced value");
    need(v.frozen.every(Boolean), "the trace is not deeply frozen");
    return { reachable: true, segments: v.t.segments, tracedFriction: v.t.tracedFriction, frozen: true };
  });

  // *** THE D538 DECLARED NEGATIVE-BIND TARGET ***
  // Mutating the containment allowlist in src/61 so the evidence-gated side would leak an authored
  // object must red THIS step and no other. It is deliberately the ONLY step that queries the seam
  // on a non-admitted ruleset, and the only one that reads the allowlist literal from source.
  await step("CONTAINMENT-B: the IDENTICAL query on every non-admitted ruleset returns the absent result", () => {
    const run = diskSeam();
    const src = read(SRC61);
    need(/var _LG_TRACE_RULESETS = \{ mayhem: 1 \};/.test(src),
      "the containment allowlist is no longer the exact single-id allowlist — authored content may leak");
    need(!/["']historical["']/.test(src),
      "the seam names a second ruleset id — containment must be an allowlist, never a denylist");
    const v = JSON.parse(run([
      "var C=mkConquest('US','historical');",
      "var r=_lgRoute(C,null);",
      "var closed=[];",
      "var probes=[{side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'historical',version:1}},",
      " {side:'CS',campaignKind:{id:'conquest',version:1},ruleset:{id:'historical',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'MAYHEM',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'mayhem',version:2}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'constructor',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'toString',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:null},",
      " {side:'US',campaignKind:{id:'conquest',version:1}}];",
      "for(var i=0;i<probes.length;i++)closed.push(conquestSupplyTrace(probes[i],'CT-03')===null);",
      "var inherited={side:'US',campaignKind:{id:'conquest',version:1},ruleset:Object.create({id:'mayhem',version:1})};",
      "closed.push(conquestSupplyTrace(inherited,'CT-03')===null);",
      "var calls=0,accessor={version:1};Object.defineProperty(accessor,'id',{enumerable:true,get:function(){calls++;return 'mayhem';}});",
      "closed.push(conquestSupplyTrace({side:'US',campaignKind:{id:'conquest',version:1},ruleset:accessor},'CT-03')===null&&calls===0);",
      "var partial={side:'US',campaignKind:{id:'conquest',version:1},ruleset:Object.assign(Object.create({version:1}),{id:'mayhem'})};",
      "closed.push(conquestSupplyTrace(partial,'CT-03')===null);",
      "return {trace:conquestSupplyTrace(C,'CT-03'),routeKeys:Object.keys(r),hasTrace:Object.prototype.hasOwnProperty.call(r,'trace'),closed:closed};"
    ].join("")));
    need(v.trace === null, "the evidence-gated ruleset produced an authored trace object — CONTAINMENT LEAK");
    need(v.hasTrace === false, "_lgRoute attached a trace on the evidence-gated ruleset — CONTAINMENT LEAK");
    need(JSON.stringify(v.routeKeys) === JSON.stringify(SHIPPED_ROUTE_KEYS), "evidence-gated route keys drifted");
    need(v.closed.length === 11 && v.closed.every(Boolean), "a non-admitted ruleset shape opened the gate: " + JSON.stringify(v.closed));
    return { absent: true, closedShapes: v.closed.length, allowlist: "single-id", accessorsInvoked: 0 };
  });

  await step("READ-ONLY OUTCOME: the capped bridge and the snapshot are byte-identical across all three carriers", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var a=logisticsBridgeBonus(mkPlain('US')),b=logisticsBridgeBonus(mkConquest('US','mayhem')),c=logisticsBridgeBonus(mkConquest('US','historical'));",
      "var sa=logisticsSnapshot(mkPlain('US')),sb=logisticsSnapshot(mkConquest('US','mayhem')),sc=logisticsSnapshot(mkConquest('US','historical'));",
      "var ra=_lgRoute(mkPlain('US'),null),rb=_lgRoute(mkConquest('US','mayhem'),null);",
      "return {bridge:[JSON.stringify(a),JSON.stringify(b),JSON.stringify(c)],snap:[JSON.stringify(sa),JSON.stringify(sb),JSON.stringify(sc)],snapKeys:Object.keys(sa),frictionSame:ra.friction===rb.friction,labelSame:ra.label===rb.label,thSame:ra.theater===rb.theater,noteSame:ra.note===rb.note,caps:_lgCfg().bridgeCaps};"
    ].join("")));
    need(v.bridge[0] === v.bridge[1] && v.bridge[1] === v.bridge[2], "logisticsBridgeBonus moved between carriers:\n" + v.bridge.join("\n"));
    need(v.snap[0] === v.snap[1] && v.snap[1] === v.snap[2], "logisticsSnapshot moved between carriers:\n" + v.snap.join("\n"));
    need(!v.snapKeys.includes("conquestTrace") && !v.snapKeys.includes("trace"), "the snapshot gained a trace field — downstream must stay untouched");
    need(v.frictionSame && v.labelSame && v.thSame && v.noteSame, "a shipped route field moved on the conquest carrier");
    need(v.caps.supply === 7 && v.caps.fatigueRelief === 5 && v.caps.overall === 2, "the shipped bridge caps moved");
    return { bridgeIdentical: true, snapshotIdentical: true, caps: v.caps };
  });

  await step("TRACE CORRECTNESS: the sourced substrate is ELEVEN components and the walk is deterministic", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var g=_lgTraceGraph({id:'mayhem',version:1});",
      "var ids=[];for(var n=1;n<=36;n++)ids.push('CT-'+(n<10?'0':'')+n);",
      "var seen={},comps=[];",
      "var und={};for(var k in g){for(var e=0;e<g[k].length;e++){(und[k]=und[k]||[]).push(g[k][e].to);(und[g[k][e].to]=und[g[k][e].to]||[]).push(k);}}",
      "for(var i=0;i<ids.length;i++){if(seen[ids[i]])continue;var q=[ids[i]],c=[];seen[ids[i]]=1;",
      " while(q.length){var x=q.shift();c.push(x);var nb=und[x]||[];for(var j=0;j<nb.length;j++)if(!seen[nb[j]]){seen[nb[j]]=1;q.push(nb[j]);}}",
      " comps.push(c.length);}",
      "var t1=conquestSupplyTrace(mkConquest('US','mayhem'),null),t2=conquestSupplyTrace(mkConquest('US','mayhem'),null);",
      "var cs=conquestSupplyTrace(mkConquest('CS','mayhem'),null);",
      "var far=conquestSupplyTrace(mkConquest('US','mayhem'),'CT-20');",
      "var self=conquestSupplyTrace(mkConquest('US','mayhem'),'CT-01');",
      "var bogus=conquestSupplyTrace(mkConquest('US','mayhem'),'CT-99');",
      "return {comps:comps.sort(function(a,b){return b-a;}),det:JSON.stringify(t1)===JSON.stringify(t2),cs:{r:cs.reachable,f:cs.tracedFriction,reached:cs.reachedCount},far:{r:far.reachable,f:far.tracedFriction},self:{r:self.reachable,seg:self.segmentCount},bogusTarget:bogus.target,us:{f:t1.tracedFriction,mix:t1.modeMix}};"
    ].join("")));
    need(v.comps.length === 11, "the sourced substrate no longer resolves to ELEVEN components: " + JSON.stringify(v.comps));
    need(JSON.stringify(v.comps) === JSON.stringify([18, 5, 4, 2, 1, 1, 1, 1, 1, 1, 1]), "component sizes moved: " + JSON.stringify(v.comps));
    need(v.det === true, "the walk is not deterministic across repeated calls");
    need(v.cs.r === false && v.cs.f === 100 && v.cs.reached === 5, "the honest CS/E no-path result moved");
    need(v.far.r === false && v.far.f === 100, "a cross-component target must stay unreachable until the authored road layer lands");
    need(v.self.r === true && v.self.seg === 0, "a depot-to-itself trace must resolve with zero segments");
    need(v.bogusTarget === "CT-03", "an unknown target must fall back to the authored theatre front");
    need(v.us.f === 7 && v.us.mix.rail === 1 && v.us.mix["inland-water"] === 0 && v.us.mix.sea === 0 && v.us.mix.road === 0,
      "the default US derivation moved: " + JSON.stringify(v.us));
    return { components: v.comps, deterministic: true, csUnreachable: true, usFriction: 7 };
  });

  await step("SUBSTRATE IMMUTABILITY: tracing never writes the evidence pack, the board, or module 115", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var before=[JSON.stringify(conquestTransportNormalized()),JSON.stringify(conquestBoardNormalized()),JSON.stringify(GAME_DATA)];",
      "for(var i=0;i<5;i++){conquestSupplyTrace(mkConquest('US','mayhem'),null);conquestSupplyTrace(mkConquest('CS','mayhem'),'CT-20');_lgRoute(mkConquest('US','mayhem'),null);}",
      "var after=[JSON.stringify(conquestTransportNormalized()),JSON.stringify(conquestBoardNormalized()),JSON.stringify(GAME_DATA)];",
      "return {same:before[0]===after[0]&&before[1]===after[1]&&before[2]===after[2],road:conquestTransportNormalized().roadStatus,interchanges:conquestTransportNormalized().interchanges.length};"
    ].join("")));
    need(v.same === true, "tracing mutated the read-only substrate, the board, or the injected data");
    need(v.road === "ROAD_REQUIRES_BOUNDED_SOURCE_PASS", "the zero-road authority moved");
    need(v.interchanges === 4, "the four interchange faces moved");
    const s115 = read("src/115-conquest-transport.js");
    for (const token of ["conquestSupplyTrace", "_LG_TRACE", "campaignKind", "logisticsInit", "_lgRoute"])
      need(!s115.includes(token), "the immutable substrate gained a LANE-022 token: " + token);
    return { substrateUnchanged: true, roadServices: 0, interchanges: 4 };
  });

  await step("NO NEW AUTHORITY: the trace consumes services only, and creates no window, road, or interchange", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var t=conquestSupplyTrace(mkConquest('US','mayhem'),null);",
      "var text=JSON.stringify(t);",
      "var pack=conquestTransportNormalized();",
      "var ctiSeen=false,nlSeen=false;",
      "for(var i=0;i<pack.interchanges.length;i++)if(text.indexOf(pack.interchanges[i].id)>=0)ctiSeen=true;",
      "for(var j=0;j<pack.nonLinks.length;j++)if(text.indexOf(pack.nonLinks[j].id)>=0)nlSeen=true;",
      "return {text:text,cti:ctiSeen,nl:nlSeen,modes:t.segments.map(function(s){return s.mode;})};"
    ].join("")));
    need(v.cti === false, "an interchange face leaked into the trace — CTI-01..CTI-04 stay unadjudicated");
    need(v.nl === false, "an explicit non-link leaked into the trace as a usable segment");
    for (const forbidden of ["dateText", "historicalEligibility", "eligibility", "window", "roadService", "RD-", "legalNow", "availability"])
      need(v.text.indexOf(forbidden) < 0, "the trace manufactured a forbidden authority field: " + forbidden);
    need(v.modes.every(m => m === "rail" || m === "inland-water" || m === "sea"), "a non-service mode entered the trace: " + JSON.stringify(v.modes));
    const src = read(SRC61);
    for (const forbidden of ["dateText", "historicalEligibility", "roadStatus", "interchanges", "nonLinks"])
      need(!src.includes(forbidden), "the seam reads an authority it may not consume: " + forbidden);
    return { interchanges: 0, nonLinks: 0, forbiddenFields: 0 };
  });

  await step("D74: the new seam writes no scoreboard, no save owner, and no campaign state", () => {
    const src = read(SRC61);
    const from = src.indexOf("LANE-022 Slice 1 (D538)");
    const to = src.indexOf("function _lgWord(");
    need(from > 0 && to > from, "the LANE-022 region markers are missing from the seam");
    const region = src.slice(from, to);
    const forbidden = [
      [/\.(men|cas|aCas|bCas)\s*(\+=|-=|=)(?!=)/, "a strength or casualty count"],
      [/\.victory\s*=(?!=)/, "the victory result"],
      [/\.(strength|maxStr|morale|maxMor|ammo)\s*(\+=|-=|=)(?!=)/, "a Classic or modern combat field"],
      [/\bsev\./, "a severity lever"],
      [/\.conquest\s*(\.|\[|=)/, "the C.conquest namespace"],
      [/saveLocal|applySave|importSave|exportSave|localStorage|_SAVE_VER/, "a save owner"],
      [/\bdocument\b|openSheet|innerHTML/, "a DOM or UI owner"],
      [/Math\.random|\bRNG\b|_rng/, "RNG state"],
      [/\bG\.|\bwindow\./, "a global campaign or window authority"]
    ];
    for (const [re, what] of forbidden) need(!re.test(region), "the LANE-022 region writes/reads " + what + ": " + String((region.match(re) || [""])[0]).trim());
    const run = diskSeam();
    const v = JSON.parse(run([
      "var C=mkConquest('US','mayhem');var before=JSON.stringify(C);",
      "conquestSupplyTrace(C,null);_lgRoute(C,null);",
      "return {carrierUnchanged:JSON.stringify(C)===before,keys:Object.keys(C)};"
    ].join("")));
    need(v.carrierUnchanged === true, "the trace mutated its own carrier: " + JSON.stringify(v.keys));
    need(!v.keys.includes("conquest"), "the trace created a C.conquest field");
    return { scoreboardWrites: 0, saveWrites: 0, carrierWrites: 0, regionBytes: region.length };
  });

  await step("ENROLMENT: no new module, no data change, and both new probes are in the suite", () => {
    const manifest = JSON.parse(read("src/00-manifest.json"));
    const vet = read("tools/vet-no-regression.mjs");
    const rows = ((/const SUITE = \[([\s\S]*?)\n\];/.exec(vet) || [null, ""])[1].match(/^\s*\['/gm) || []).length;
    need(manifest.modules.length === 112, "Slice 1 must add no module; manifest is " + manifest.modules.length);
    need(manifest.modules.at(-1) === "116-conquest-state.js", "manifest tail moved");
    need(rows === 142, "suite must be 142 after enrolling the two D538 probes, counted " + rows);
    need(vet.includes("tools/probe-conquest-supply.mjs") && vet.includes("tools/probe-conquest-supply-plan.mjs"), "a D538 probe is not enrolled");
    return { modules: 112, last: manifest.modules.at(-1), suite: rows };
  });

  /* ===================== BROWSER / BUILT-DELIVERABLE HALF ================= */

  const url = `${cfg.baseUrl}/${cfg.file}`;
  if (!(await up(url))) {
    server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd: ROOT, stdio: "ignore" });
    for (let i = 0; i < 80 && !await up(url); i++) await sleep(150);
  }
  try { browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-dev-shm-usage"] }); }
  catch { browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--disable-dev-shm-usage"] }); }
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  page.setDefaultTimeout(10000);
  page.on("pageerror", e => result.pageerrors.push(String(e && e.message || e)));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource.*404/.test(m.text())) result.realErrors.push(m.text()); });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(350);

  await step("IN PAGE: the built deliverable carries the seam and holds containment in both directions", () => page.evaluate(() => {
    if (typeof conquestSupplyTrace !== "function") throw new Error("conquestSupplyTrace is absent from the built game");
    const mk = (side, id) => ({ side, campaignKind: { id: "conquest", version: 1 }, ruleset: { id, version: 1 } });
    const open = conquestSupplyTrace(mk("US", "mayhem"), null);
    const gated = conquestSupplyTrace(mk("US", "historical"), null);
    const plain = conquestSupplyTrace({ side: "US" }, null);
    if (!open || open.rulesetId !== "mayhem" || open.authored !== true || open.applied !== false) throw new Error("open-ruleset trace missing in page");
    if (open.segments.length !== 1 || open.segments[0].id !== "CTS-R-02") throw new Error("in-page default route moved");
    if (gated !== null) throw new Error("IN-PAGE CONTAINMENT LEAK: the evidence-gated ruleset produced a trace");
    if (plain !== null) throw new Error("a non-conquest carrier produced a trace in page");
    const r = _lgRoute(mk("US", "mayhem"), null), g = _lgRoute(mk("US", "historical"), null), p = _lgRoute({ side: "US" }, null);
    if (Object.keys(r).length !== 7 || Object.keys(g).length !== 6 || Object.keys(p).length !== 6) throw new Error("in-page route key counts drifted");
    if (r.friction !== g.friction || g.friction !== p.friction) throw new Error("in-page friction moved on a conquest carrier");
    return { open: open.segments[0].id, gated: null, routeKeys: [7, 6, 6], friction: p.friction };
  }));

  await step("IN PAGE: repeated tracing is pure — no G, C, save, storage, DOM, or board movement", () => page.evaluate(() => {
    const snap = () => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); storage[k] = localStorage.getItem(k); }
      return {
        g: typeof G === "undefined" ? "__absent__" : JSON.stringify(G),
        storage: JSON.stringify(storage),
        dom: document.body.innerHTML.length,
        board: typeof conquestBoardNormalized === "function" ? JSON.stringify(conquestBoardNormalized()) : "__absent__",
        transport: typeof conquestTransportNormalized === "function" ? JSON.stringify(conquestTransportNormalized()) : "__absent__"
      };
    };
    const mk = (side, id) => ({ side, campaignKind: { id: "conquest", version: 1 }, ruleset: { id, version: 1 } });
    const before = snap();
    for (let i = 0; i < 5; i++) { conquestSupplyTrace(mk("US", "mayhem"), null); conquestSupplyTrace(mk("CS", "mayhem"), "CT-20"); _lgRoute(mk("US", "mayhem"), null); }
    const after = snap();
    for (const k of Object.keys(before)) if (before[k] !== after[k]) throw new Error("repeated tracing moved " + k);
    const a = JSON.stringify(logisticsBridgeBonus({ side: "US" }));
    const b = JSON.stringify(logisticsBridgeBonus(mk("US", "mayhem")));
    const c = JSON.stringify(logisticsBridgeBonus(mk("US", "historical")));
    if (a !== b || b !== c) throw new Error("in-page capped bridge moved between carriers:\n" + [a, b, c].join("\n"));
    return { calls: 15, writes: 0, bridgeIdentical: true };
  }));

  await step("IN PAGE: the shipped logistics readout is untouched and shows no conquest surface", () => page.evaluate(() => {
    if (typeof presLogisticsBlock !== "function") throw new Error("presLogisticsBlock is absent");
    const html = presLogisticsBlock({ side: "US" });
    const mk = { side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 } };
    const conquestHtml = presLogisticsBlock(mk);
    if (html !== conquestHtml) throw new Error("the shipped logistics readout moved on a conquest carrier");
    if (/CT-\d\d|CTS-[RWS]-\d\d|traced|depot reach chain/i.test(html)) throw new Error("Slice 1 leaked a conquest surface into the shipped readout");
    if (!/Rail &amp; Supply Network/.test(html)) throw new Error("the shipped readout heading is gone");
    return { identical: true, bytes: html.length };
  }));

  if (result.pageerrors.length || result.realErrors.length) { result.ok = false; result.errors.push("browser errors present"); }
} catch (e) {
  result.ok = false;
  result.errors.push(String(e && e.stack || e));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill("SIGTERM");
}

result.summary = { passed: result.steps.filter(s => s.ok).length, total: result.steps.length };
writeFileSync(ART, JSON.stringify(result, null, 2) + "\n");
console.log(`probe-conquest-supply: ${result.summary.passed}/${result.summary.total} steps ok, ${result.failed.length} fail; pageerrors=${result.pageerrors.length}; realErrors=${result.realErrors.length}`);
if (!result.ok) { for (const f of result.failed) console.error("FAIL", f); process.exit(1); }
console.log("ALL OK");
