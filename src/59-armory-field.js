/* ===========================================================================
   A4 · 59-armory-field.js — wire The Armory to the battlefield.

   Aaron's directive (backlog A4): "the weapons bought in C.armory.loadout become
   what the player's brigades carry + fire — connect data/weapons.json quality to
   the base WEAPONS table / genForce unit weapon assignment. Probe that Spencers
   bought -> higher unit firepower in battle." (Frozen-engine override, §8.2.)

   How it works (investigated against build/base.html):
     · A battle unit carries u.weapon = a STRING KEY into the engine's WEAPONS
       table (line 322). resolveFire (line 1037) computes power *= WEAPONS[u.weapon].pow.
       So a unit's firepower is decided ENTIRELY by which WEAPONS key it holds.
     · genForce (line 685) builds each side's units via mkUnit, which picks a random,
       era-appropriate weapon (infWeapon). We OVERRIDE genForce (verbatim base body +
       a post-pass) so that, for the PLAYER side in a campaign, a fraction of the
       fresh infantry are RE-ARMED with the weapons the player actually bought
       (C.armory.loadout), mapped from the strategic armory ids to engine WEAPONS keys.
     · The armory catalog ids (data/weapons.json: smoothbore/lorenz/springfield/…)
       differ from the engine keys (smooth/rifled/spring/…), so _AF_ENGINE_KEY binds
       them — quality-monotonically, so a better bought weapon is never a worse field
       weapon. (Data may override per-weapon via an optional `engineKey` field.)

   Result: buy Spencers -> a slice of your line carries "spencer" (pow 2.05 vs the
   smoothbore's 1.00) -> measurably heavier fire on the day. The unbought remainder
   keeps its standard-issue arm; veterans keep their earned weapon; the enemy is
   untouched (they don't draw on your arsenal).

   New fns: _afData / _afEngineKey / _afWireUnits. Override: genForce (manifest).
   Bare-name globals (WEAPONS, G, unitsFor, mkUnit, attachLeader, deployForce,
   clamp); _af* helpers; no campaign state added; guarded for non-campaign battles.
   =========================================================================== */

function _afData() {
  return (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.weapons) ? GAME_DATA.weapons : null;
}

/* Bind strategic armory ids -> engine WEAPONS keys, quality-monotonically
   (a higher-quality purchase always maps to >= field power). */
var _AF_ENGINE_KEY = {
  smoothbore: "smooth",   // q22 -> pow 1.00
  lorenz:     "rifled",   // q48 -> pow 1.25
  richmond:   "rifled",   // q57 -> pow 1.25 (CS Springfield-pattern rifled musket)
  enfield:    "enfield",  // q61 -> pow 1.42
  springfield:"spring",   // q62 -> pow 1.45 (engine key "spring")
  colt:       "sharps",   // q70 -> pow 1.70 (revolving rifle ~ breechloader rate)
  sharps:     "sharps",   // q80 -> pow 1.70
  spencer:    "spencer",  // q92 -> pow 2.05
  henry:      "henry"     // q94 -> pow 2.20
};
function _afEngineKey(id) {
  if (id == null) return null;
  var D = _afData();   // optional data override (future-proof): a weapon may carry its own engineKey
  if (D && D.weapons && D.weapons.length) {
    for (var i = 0; i < D.weapons.length; i++) { if (D.weapons[i] && D.weapons[i].id === id && D.weapons[i].engineKey) return D.weapons[i].engineKey; }
  }
  return _AF_ENGINE_KEY[id] || null;
}

/* Re-arm a fraction of the PLAYER's fresh infantry with the bought weapons.
   Mutates units[].weapon. Returns the count re-armed. Safe + no-op off-campaign. */
function _afWireUnits(units, side, C, year) {
  if (!units || !units.length || !C || !C.armory || !C.armory.loadout) return 0;
  if (side !== ((C.side === "CS") ? "CS" : "US")) return 0;   // player side only — the enemy doesn't draw on your arsenal
  if (typeof WEAPONS === "undefined") return 0;
  var lo = C.armory.loadout, by = (typeof year === "number" && isFinite(year)) ? year : null;
  // fresh (non-veteran, non-leader) infantry are the ones issued procured arms
  var inf = [];
  for (var i = 0; i < units.length; i++) { var u = units[i]; if (u && u.type === "inf" && !u.vetId && !u.leader) inf.push(u); }
  if (!inf.length) return 0;
  // plan: each bought weapon claims floor(inf * its fraction) muskets, mapped to an engine key
  var plan = [];
  for (var id in lo) if (lo.hasOwnProperty(id)) {
    var frac = Number(lo[id]); if (!isFinite(frac) || frac <= 0) continue;
    var ek = _afEngineKey(id); if (!ek || !WEAPONS[ek]) continue;
    if (by != null && WEAPONS[ek].era && WEAPONS[ek].era > by) continue;   // honor the engine's own era gate — don't field arms it wouldn't issue this year (fair vs the era-locked AI)
    var fr = Math.min(1, frac); if (fr > 0.9995) fr = 1;                   // absorb 0.1*10 float drift so a "100%-armed" line arms every brigade
    var cnt = Math.floor(inf.length * fr + 1e-9);
    for (var k = 0; k < cnt; k++) plan.push(ek);
  }
  var assigned = 0;
  for (var j = 0; j < inf.length && j < plan.length; j++) { inf[j].weapon = plan[j]; assigned++; }   // remainder keeps its standard-issue arm
  return assigned;
}

/* ---- genForce OVERRIDE (frozen-engine §8.2): the VERBATIM base body
   (build/base.html 685-716) + a player-armory re-arm pass before the return. ---- */
function genForce(bd, side, isAttacker, M, campaignCore){
  const men = side==="US"? bd.us : bd.cs;
  let n=unitsFor(men);
  const naval=M.naval;
  const units=[];
  if(naval){
    // warships for attacker; defender gets forts + some ships
    const ships = isAttacker? n : Math.max(2,Math.round(n*0.5));
    for(let i=0;i<ships;i++) units.push(mkUnit(side,"nav",bd));
    if(!isAttacker){ const forts=Math.max(1,Math.round(n*0.4)); for(let i=0;i<forts;i++) units.push(mkUnit(side,"fort",bd)); }
  } else {
    let inf=Math.round(n*0.66), art=Math.max(1,Math.round(n*0.18)), cav=Math.max(0,n-inf-art);
    if(n>=6 && cav===0) cav=1;
    // campaign carry: reuse veteran roster units for the player core
    let made=0;
    if(campaignCore && campaignCore.length){
      for(const rc of campaignCore){ if(made>=inf+art+cav) break;
        const u=mkUnit(side, rc.type, bd); u.weapon=rc.weapon||u.weapon; u.xp=rc.xp||0; u.vetId=rc.id; u.vetName=rc.name;
        u.morale=clamp(u.morale + (u.xp*3),0,98); units.push(u); made++; }
    }
    for(let i=units.length;i<inf;i++) units.push(mkUnit(side,"inf",bd));
    for(let i=0;i<art;i++) units.push(mkUnit(side,"art",bd));
    for(let i=0;i<cav;i++) units.push(mkUnit(side,"cav",bd));
  }
  // leaders: army commander + 1 subordinate
  const cmd=mkUnit(side,"inf",bd); attachLeader(cmd,side,bd,true); units.push(cmd);
  const sub=mkUnit(side,"inf",bd); attachLeader(sub,side,bd,false); units.push(sub);

  // A4: re-arm the player's fresh infantry with the weapons bought in The Armory — but ONLY in a genuine
  // campaign battle. campaignCore is non-null only for the PLAYER force when startBattleRuntime ran with
  // fromCampaign=true (build/base.html 777-779: the enemy force AND both Free-Battle forces get null), so
  // it is the exact discriminator — Classic/Free Battle stays independent of campaign save state and the
  // AI is never armed from the player's arsenal.
  try { if (campaignCore && campaignCore.length && typeof _afWireUnits === "function") _afWireUnits(units, side, (typeof G !== "undefined" && G.campaign) ? G.campaign : null, bd && bd.year); } catch(e){}

  // deploy: attacker bottom band, defender top band (+ objectives/forts)
  deployForce(units, side, isAttacker, M);
  return units;
}
