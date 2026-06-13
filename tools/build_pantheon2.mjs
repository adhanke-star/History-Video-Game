// Authoring tool — batch 2 of the pantheon authored maps (Fable, 2026-06-13).
// Lays the REAL ground of six battlefields onto 22x20 hex abstractions and emits
// validated, ready-to-splice AUTHORED_MAPS entries (grid + deploy + objs + features
// + ground). Feature EXISTENCE and RELATIVE position are Verified against the
// documented battlefield (per-battle web research, see RUN-LOG); exact hex within
// the abstraction is authored placement. Battles: bullrun1, bullrun2,
// chancellorsville, vicksburg, chickamauga, franklin.
//
//   node tools/build_pantheon2.mjs            # emit all six
//   node tools/build_pantheon2.mjs vicksburg  # emit one
//
// Row 0 = NORTH, col 0 = WEST. Legend chars match the engine TERRAIN keys.

const GW = 22, GH = 20;
const LEGEND = { ".":"clear", ",":"field", "w":"woods", "h":"hills", "R":"ridge",
                 "~":"river", "f":"ford", "t":"town", "=":"road", "F":"fort", "s":"swamp" };

// ---- grid helpers ----------------------------------------------------------
const blank = () => Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const inb = (c, r) => r >= 0 && r < GH && c >= 0 && c < GW;
const set = (g, c, r, ch) => { if (inb(c, r)) g[r][c] = ch; };
const vline = (g, c, r0, r1, ch) => { for (let r = r0; r <= r1; r++) set(g, c, r, ch); };
const hline = (g, r, c0, c1, ch) => { for (let c = c0; c <= c1; c++) set(g, c, r, ch); };
const region = (g, c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(g, c, r, ch); };
const path = (g, pts, ch) => pts.forEach(([c, r]) => set(g, c, r, ch));
const dregion = region, dset = set; // deploy grid uses the same mutators with 'U'/'C'

// ===========================================================================
// 1) FIRST BULL RUN (First Manassas) — 21 Jul 1861 — attacker US
//    Bull Run on the E; Union flanks NW at Sudley Ford, drives SE onto Henry Hill.
// ===========================================================================
function bullrun1() {
  const g = blank();
  // open farmland baseline
  region(g, 0, 21, 0, 19, ',');
  // Bull Run — flows SW->NE, held along the E/SE edge, drifting inward going N
  const run = [[16,19],[16,18],[17,17],[17,16],[18,15],[18,14],[18,13],[19,12],[19,11],
               [19,10],[19,9],[18,8],[19,7],[19,6],[20,5],[20,4],[20,3],[21,2],[21,1],[21,0]];
  path(g, run, '~');
  set(g, 18, 8, 'f');                 // Stone Bridge (Warrenton Tpk crosses Bull Run)
  // upper Bull Run arm + Sudley Ford (far NW crossing)
  path(g, [[3,0],[4,0],[5,1],[6,1],[7,2]], '~');
  set(g, 5, 1, 'f');                  // Sudley Ford
  // Matthews Hill (N-center) + Buck Hill / Dogan Ridge (Inferred)
  region(g, 7, 10, 4, 6, 'h');        // Matthews Hill
  set(g, 12, 3, 'h');                 // Buck Hill
  set(g, 12, 6, 'R'); set(g, 13, 6, 'R'); // Dogan Ridge
  // Warrenton Turnpike — W-E across the center to the Stone Bridge
  hline(g, 8, 0, 18, '=');
  // Manassas-Sudley Road — NW down to the Stone House, then S along Henry Hill
  path(g, [[5,2],[6,3],[7,4],[8,5],[9,6],[9,7]], '=');
  vline(g, 9, 9, 15, '=');
  set(g, 10, 8, 't');                 // Stone House crossroads
  // Young's Branch — wet valley between Matthews Hill (N) and Henry Hill (S)
  set(g, 7, 9, '~'); set(g, 11, 9, '~'); set(g, 13, 9, '~');
  // Henry House Hill — the key high ground (S-center)
  region(g, 8, 11, 12, 15, 'h');
  // Henry Hill covering timber (Inferred) on the E/S shoulder
  set(g, 11, 15, 'w'); set(g, 10, 16, 'w'); set(g, 12, 13, 'w');
  // Chinn Ridge — open western flank SW of Henry Hill
  region(g, 4, 5, 14, 16, 'R');
  // woods dressing
  set(g, 3, 5, 'w'); set(g, 2, 12, 'w'); set(g, 15, 12, 'w'); set(g, 14, 5, 'w');

  const objs = [
    { c:9,  r:13, val:3, label:"Henry House Hill" },
    { c:10, r:8,  val:2, label:"Stone House" },
    { c:8,  r:5,  val:2, label:"Matthews Hill" },
    { c:5,  r:15, val:1, label:"Chinn Ridge" },
  ];
  const features = [
    { c:9,  r:13, label:"Henry House Hill",    conf:"Verified" },
    { c:8,  r:5,  label:"Matthews Hill",       conf:"Verified" },
    { c:10, r:8,  label:"The Stone House",     conf:"Verified" },
    { c:18, r:8,  label:"Stone Bridge",        conf:"Verified" },
    { c:5,  r:1,  label:"Sudley Ford",         conf:"Verified" },
    { c:18, r:13, label:"Bull Run",            conf:"Verified" },
    { c:11, r:9,  label:"Young's Branch",      conf:"Verified" },
    { c:5,  r:15, label:"Chinn Ridge",         conf:"Verified" },
    { c:12, r:12, label:"Robinson House",      conf:"Verified" },
    { c:6,  r:8,  label:"Warrenton Turnpike",  conf:"Verified" },
    { c:13, r:6,  label:"Dogan Ridge",         conf:"Inferred" },
  ];
  const d = blank().map(row => row.map(() => '.'));
  dregion(d, 0, 16, 0, 7, 'U');       // Union: the north — Sudley approach + Matthews Hill
  dregion(d, 0, 6,  8, 11, 'U');      // Union right reaching SW
  dregion(d, 3, 13, 11, 19, 'C');     // Confederate: Henry Hill complex + south + Chinn Ridge
  dregion(d, 15, 18, 6, 10, 'C');     // Confederate left on Bull Run / Stone Bridge
  const ground =
    "FIRST BULL RUN (First Manassas), 21 July 1861 — the war's first great battle, fought by " +
    "green armies who both expected it to be the last. Bull Run runs southwest to northeast across " +
    "the eastern edge, a sluggish creek the Confederates lined to bar the road to Richmond, anchoring " +
    "their left at the Stone Bridge where the Warrenton Turnpike crosses. McDowell's answer was a wide " +
    "march around that flank, crossing far upstream at Sudley Ford in the northwest and driving south. " +
    "The first collision came on Matthews Hill, north of the turnpike, where Evans's lone brigade bought " +
    "time before being swept off; from there the ground drops into the Young's Branch valley, past the " +
    "Stone House at the turnpike-and-Sudley-Road crossroads, then climbs again to the broad plateau of " +
    "Henry House Hill. On that crest Jackson posted his Virginians and stood \"like a stone wall,\" facing " +
    "north into the Union advance, while late Confederate brigades arriving on Chinn Ridge to the west " +
    "rolled up the exposed Union right. Hold Henry Hill and the attack breaks on the slope; take and keep " +
    "it and the road to Manassas Junction lies open.\n\nThe Ground: feature existence and relative position " +
    "are Verified against the historical record; exact hex placement within this 22×20 field is authored " +
    "abstraction. Dogan Ridge's precise routing is marked Inferred.";
  return { id:"bullrun1", g, d, objs, features, ground };
}

// ===========================================================================
// 2) SECOND BULL RUN (Second Manassas) — 28-30 Aug 1862 — attacker CS
//    Jackson holds the Unfinished Railroad N of the pike; Longstreet rolls in from
//    the SW across Chinn Ridge / Bald Hill toward Henry Hill (Union rally, SE).
// ===========================================================================
function bullrun2() {
  const g = blank();
  region(g, 0, 21, 0, 19, ',');
  // Bull Run along the N and E edge (NW-SE); Stone Bridge ford E on the turnpike
  path(g, [[3,0],[5,0],[7,1],[9,1],[11,1],[13,1],[15,0]], '~');
  set(g, 4, 1, 'f');                  // Sudley Springs / Ford (NW, off Jackson's left)
  path(g, [[19,8],[20,9],[20,10],[19,11],[20,12],[20,13],[21,14],[21,15],[21,16]], '~');
  // Warrenton Turnpike — central W-E axis
  hline(g, 10, 0, 19, '=');
  set(g, 19, 10, 'f');                // Stone Bridge over Bull Run (E)
  // Unfinished Railroad grade — SW->NE breastwork just N of the pike (Jackson's line)
  const cut = [[2,9],[3,8],[4,8],[5,7],[6,7],[7,6],[8,6],[9,5],[10,5],[11,5],[12,4],[13,4],[14,4],[15,3],[16,3]];
  path(g, cut, 'R');
  // Stony Ridge — wooded high ground behind (N of) the cut
  region(g, 4, 16, 1, 3, 'w');
  set(g, 6, 2, 'R'); set(g, 9, 2, 'R'); set(g, 12, 2, 'R'); set(g, 15, 2, 'R');
  // Groveton (center-W on the pike) + Stone House (center-E at pike x Sudley Rd)
  set(g, 6, 10, 't');                 // Groveton
  set(g, 14, 9, 't');                 // Stone House
  // Sudley Road — N-S, crossing the pike at the Stone House
  vline(g, 14, 2, 16, '=');
  // Gainesville approach (W) + Manassas Gap RR anchoring Longstreet's right (SW)
  set(g, 1, 10, 't');                 // Gainesville (W entry)
  path(g, [[1,17],[3,17],[5,16],[7,16]], '=');   // Manassas Gap RR (Inferred)
  // Dogan Ridge — Union artillery platform S of the cut (center)
  region(g, 7, 9, 12, 13, 'R');
  // Brawner Farm (NW, S of Stony Ridge near Groveton) — Aug 28 fight
  set(g, 5, 8, ','); set(g, 6, 8, ',');
  // Chinn Ridge + Bald Hill — the screen between Longstreet and Henry Hill (S)
  region(g, 9, 11, 14, 16, 'R');
  set(g, 11, 16, 'h'); set(g, 12, 16, 'h'); // Bald Hill
  // Henry House Hill — Union rally covering the Stone Bridge escape (SE)
  region(g, 14, 17, 13, 17, 'h');
  // Young's Branch — low ground looping E-W through the center, S of the pike
  set(g, 10, 12, '~'); set(g, 12, 12, '~'); set(g, 16, 12, '~');
  // woods dressing
  set(g, 2, 6, 'w'); set(g, 18, 5, 'w'); set(g, 18, 16, 'w');

  const objs = [
    { c:16, r:15, val:3, label:"Henry House Hill" },
    { c:9,  r:6,  val:3, label:"The Railroad Cut" },
    { c:10, r:15, val:2, label:"Chinn Ridge" },
    { c:14, r:9,  val:1, label:"Stone House" },
  ];
  const features = [
    { c:16, r:15, label:"Henry House Hill",    conf:"Verified" },
    { c:9,  r:6,  label:"Unfinished Railroad",  conf:"Verified" },
    { c:6,  r:6,  label:"The Deep Cut",         conf:"Verified" },
    { c:9,  r:2,  label:"Stony Ridge",          conf:"Verified" },
    { c:10, r:15, label:"Chinn Ridge",          conf:"Verified" },
    { c:12, r:16, label:"Bald Hill",            conf:"Inferred" },
    { c:8,  r:12, label:"Dogan Ridge",          conf:"Verified" },
    { c:6,  r:10, label:"Groveton",             conf:"Verified" },
    { c:14, r:9,  label:"The Stone House",      conf:"Verified" },
    { c:4,  r:1,  label:"Sudley Springs",       conf:"Verified" },
    { c:5,  r:8,  label:"Brawner Farm",         conf:"Verified" },
    { c:5,  r:16, label:"Manassas Gap R.R.",    conf:"Inferred" },
  ];
  const d = blank().map(row => row.map(() => '.'));
  dregion(d, 0, 19, 0, 8, 'C');       // CS: Jackson along the railroad / Stony Ridge (N)
  dregion(d, 0, 8,  11, 18, 'C');     // CS: Longstreet's wing massed SW
  dregion(d, 9, 21, 11, 18, 'U');     // US: Dogan Ridge center to Henry Hill (SE)
  dregion(d, 9, 21, 9, 10, 'U');      // US center on the turnpike
  const ground =
    "SECOND BULL RUN (Second Manassas), 28-30 August 1862 — fought on a stage of two man-made lines and " +
    "one decisive hill. The Warrenton Turnpike runs west to east across the center; just north of it an " +
    "Unfinished Railroad grade cuts southwest to northeast, and behind that wooded Stony Ridge rises. Jackson " +
    "packed his corps into the grade's cuts and fills, a mile-and-a-half breastwork screened by timber, and for " +
    "two days Pope hurled assaults northward from Dogan Ridge straight into that bank and bled white against it. " +
    "The trap closed on 30 August: Longstreet's wing, massed unseen south of the pike from Brawner Farm down to " +
    "the Manassas Gap Railroad, rolled eastward across open pasture and crushed the Union left. Chinn Ridge and " +
    "Bald Hill stood in the way, and their defenders died to buy the minutes Pope needed to crown Henry House Hill, " +
    "the height covering the Stone House crossroads and the Stone Bridge over Bull Run — his only escape. Hold " +
    "Henry Hill and the army lives to recross the creek; lose it and Longstreet bags the whole Army of Virginia " +
    "against the water.\n\nThe Ground: feature existence and relative position are Verified against the historical " +
    "record; exact hex placement within this 22×20 field is authored abstraction. Bald Hill and the Manassas " +
    "Gap Railroad's precise routing are marked Inferred.";
  return { id:"bullrun2", g, d, objs, features, ground };
}

// ===========================================================================
// 3) CHANCELLORSVILLE — 1-3 May 1863 — attacker US (but Jackson's flank attack is the drama)
//    Wilderness woods; the crossroads at center; XI Corps strung W on the Turnpike;
//    Jackson attacks E down the Turnpike into the unanchored Union right.
// ===========================================================================
function chancellorsville() {
  const g = blank();
  // The Wilderness — dense woods blanket most of the field
  region(g, 0, 21, 0, 19, 'w');
  // Rappahannock (N/NE edge, NW-SE) + Rapidan (NW) — the rivers behind the Union rear
  path(g, [[2,0],[4,0],[6,1],[8,1],[10,2],[12,2],[14,3],[16,3],[18,4],[20,5]], '~');
  path(g, [[0,3],[1,2],[2,1],[3,1]], '~');     // Rapidan (NW)
  set(g, 12, 2, 'f');                 // U.S. Ford (Hooker's lifeline, N)
  set(g, 15, 3, 'f');                 // Ely's Ford
  set(g, 18, 4, 'f');                 // Banks' Ford (NE)
  set(g, 1, 2, 'f');                  // Germanna Ford (NW, Inferred)
  // Orange Turnpike — E-W through the crossroads (row 9)
  hline(g, 9, 0, 21, '=');
  // Orange Plank Road — NE-SW joining the crossroads
  path(g, [[16,13],[15,12],[14,11],[13,10],[12,9]], '=');
  path(g, [[11,9],[10,10],[9,11],[8,12],[7,13],[6,14]], '=');   // SW arm to Catharine Furnace
  // Chancellorsville crossroads clearing (center)
  region(g, 10, 12, 8, 10, '.');
  set(g, 11, 9, '.');
  // The XI Corps clearings strung W along the Turnpike
  set(g, 3, 9, ',');                  // Talley's farm (far W, the flank "in the air")
  set(g, 5, 9, ',');                  // Wilderness Church
  set(g, 7, 9, ',');                  // Dowdall's Tavern
  // Hazel Grove (commanding open height SW) + Fairview (between it and the crossroads)
  region(g, 7, 9, 11, 12, 'h');       // Hazel Grove
  set(g, 9, 11, 'R'); set(g, 10, 11, 'R'); // Fairview
  // Catharine Furnace — clearing SW on Jackson's march route
  set(g, 6, 15, ','); set(g, 7, 15, ',');
  // Salem Church — far E on the Plank Road (Sedgwick halted here)
  set(g, 20, 10, 't');
  // Brock Road (N-S, W) + Furnace Road (S from crossroads) — Jackson's march route
  vline(g, 2, 6, 16, '=');
  // a couple of small Wilderness clearings
  set(g, 14, 6, ','); set(g, 16, 14, ',');

  const objs = [
    { c:11, r:9,  val:3, label:"Chancellorsville" },
    { c:8,  r:12, val:3, label:"Hazel Grove" },
    { c:9,  r:11, val:2, label:"Fairview" },
    { c:5,  r:9,  val:2, label:"XI Corps Flank" },
  ];
  const features = [
    { c:11, r:9,  label:"Chancellorsville",    conf:"Verified" },
    { c:8,  r:12, label:"Hazel Grove",         conf:"Verified" },
    { c:10, r:11, label:"Fairview",            conf:"Verified" },
    { c:3,  r:9,  label:"Talley's Farm",       conf:"Verified" },
    { c:5,  r:9,  label:"Wilderness Church",   conf:"Verified" },
    { c:7,  r:9,  label:"Dowdall's Tavern",    conf:"Verified" },
    { c:6,  r:15, label:"Catharine Furnace",   conf:"Verified" },
    { c:20, r:10, label:"Salem Church",        conf:"Verified" },
    { c:12, r:2,  label:"U.S. Ford",           conf:"Verified" },
    { c:9,  r:5,  label:"The Wilderness",      conf:"Verified" },
    { c:14, r:9,  label:"Orange Turnpike",     conf:"Verified" },
    { c:2,  r:11, label:"Brock Road",          conf:"Inferred" },
  ];
  const d = blank().map(row => row.map(() => '.'));
  dregion(d, 6, 18, 3, 14, 'U');      // US: the horseshoe centered on the crossroads, rear to NE
  dregion(d, 2, 6,  8, 10, 'U');      // US: XI Corps strung W along the Turnpike (the exposed arm)
  dregion(d, 16, 21, 6, 16, 'C');     // CS: Lee pressing from the E/SE
  dregion(d, 0, 3,  7, 12, 'C');      // CS: Jackson's flanking corps on the far W edge
  const ground =
    "CHANCELLORSVILLE, 1-3 May 1863 — Lee's masterpiece, won against twice his numbers. The ground is the " +
    "Wilderness: a tangled second-growth thicket south of the Rapidan that swallowed columns and broke every " +
    "formation that entered it. At the center stood the lone Chancellor mansion, where the Orange Turnpike crossed " +
    "the Orange Plank Road — the only true road hub for miles — and Hooker built his horseshoe around it with his " +
    "back to U.S. Ford on the Rappahannock. The fatal weakness lay on the western arm, where Howard's XI Corps lay " +
    "strung along the Turnpike facing south, its right flank \"in the air\" near Talley's farm and Wilderness Church, " +
    "screened only by woods. On 2 May Jackson slipped twelve miles around that flank by the Furnace and Brock roads " +
    "and burst eastward down the Turnpike at dusk, rolling the corps up like a carpet. The next morning Confederate " +
    "guns seized abandoned Hazel Grove, the one commanding open height, and cross-fired Fairview into ruin. Hold the " +
    "crossroads and the Hazel Grove-Fairview heights and the army lives; lose the western flank or that high ground " +
    "and the whole line caves toward the river.\n\nThe Ground: feature existence and relative position are Verified " +
    "against the historical record; exact hex placement within this 22×20 field is authored abstraction. The Brock " +
    "Road trace is marked Inferred.";
  return { id:"chancellorsville", g, d, objs, features, ground };
}

// ===========================================================================
// 4) SIEGE OF VICKSBURG — May-Jul 1863 — attacker US
//    City on the Mississippi (W); a fort arc bellies E along the loess ridges;
//    Union rings it from the E and climbs the ravines toward the road-gate redans.
// ===========================================================================
function vicksburg() {
  const g = blank();
  region(g, 0, 21, 0, 19, ',');
  // Mississippi River along the entire W edge
  vline(g, 0, 0, 19, '~'); vline(g, 1, 0, 19, '~');
  // Vicksburg city on the bluffs (W edge)
  region(g, 2, 3, 8, 12, 't');
  set(g, 2, 9, 't'); set(g, 3, 9, 't');
  // Vicksburg bluffs (high ground W, between city and works)
  vline(g, 4, 6, 14, 'R');
  // Yazoo / Mint Spring / Glass bayous (N drainages)
  set(g, 3, 2, '~'); set(g, 4, 2, '~'); set(g, 5, 4, '~');
  // The Confederate fortification arc — N-to-S, bellying E along the loess ridges
  const arc = [[4,3],[5,4],[6,5],[7,6],[8,7],[8,8],[9,9],[8,10],[8,11],[7,12],[7,13],[6,14],[5,15],[4,16],[4,17]];
  path(g, arc, 'F');
  // named forts (on the arc)
  set(g, 4, 3, 'F');   // Fort Hill (NW, on the river bluff)
  set(g, 6, 5, 'F');   // Stockade Redan (Graveyard Rd)
  set(g, 8, 8, 'F');   // 3rd Louisiana Redan (Jackson Rd)
  set(g, 9, 9, 'F');   // Great Redoubt
  set(g, 8, 11, 'F');  // 2nd Texas Lunette (Baldwin's Ferry Rd)
  set(g, 7, 13, 'F');  // Railroad Redoubt (Southern RR gap, SE)
  set(g, 5, 15, 'F');  // Square Fort / Fort Garrott (Hall's Ferry Rd)
  set(g, 4, 17, 'F');  // South Fort (SW, re-anchors on the river)
  // Loess ridges + ravines E of the works (the broken approach ground)
  region(g, 10, 13, 4, 16, 'h');
  set(g, 11, 8, 'R'); set(g, 12, 8, 'R');   // Battery DeGolyer ridge (center)
  set(g, 10, 8, 't');                       // Shirley House (center, E of 3rd La Redan)
  // The radial roads that funnel the assaults (E -> the gates)
  path(g, [[20,4],[18,4],[16,5],[14,5],[12,5],[10,5],[8,5]], '=');   // Graveyard Road (N)
  path(g, [[21,8],[19,8],[17,8],[15,8],[13,8],[11,8],[9,8]], '=');   // Jackson Road (center)
  path(g, [[21,11],[19,11],[17,11],[15,11],[13,11],[11,11],[9,11]], '='); // Baldwin's Ferry Rd
  path(g, [[21,13],[19,13],[17,13],[15,13],[13,13],[11,13],[9,13]], '='); // Southern Railroad (SE)
  path(g, [[20,16],[18,16],[16,15],[14,15],[12,15]], '=');          // Hall's Ferry Rd (S, Inferred)

  const objs = [
    { c:6,  r:5,  val:3, label:"Stockade Redan" },
    { c:8,  r:8,  val:3, label:"3rd Louisiana Redan" },
    { c:7,  r:13, val:2, label:"Railroad Redoubt" },
    { c:4,  r:3,  val:2, label:"Fort Hill" },
  ];
  const features = [
    { c:4,  r:3,  label:"Fort Hill",            conf:"Verified" },
    { c:6,  r:5,  label:"Stockade Redan",       conf:"Verified" },
    { c:8,  r:8,  label:"3rd Louisiana Redan",  conf:"Verified" },
    { c:9,  r:9,  label:"Great Redoubt",        conf:"Verified" },
    { c:8,  r:11, label:"2nd Texas Lunette",    conf:"Verified" },
    { c:7,  r:13, label:"Railroad Redoubt",     conf:"Verified" },
    { c:5,  r:15, label:"Fort Garrott",         conf:"Verified" },
    { c:4,  r:17, label:"South Fort",           conf:"Verified" },
    { c:10, r:8,  label:"Shirley House",        conf:"Verified" },
    { c:11, r:8,  label:"Battery DeGolyer",     conf:"Verified" },
    { c:1,  r:13, label:"Mississippi River",    conf:"Verified" },
    { c:2,  r:10, label:"Vicksburg",            conf:"Verified" },
    { c:12, r:10, label:"The Loess Ridges",     conf:"Verified" },
  ];
  const d = blank().map(row => row.map(() => '.'));
  dregion(d, 2, 9, 2, 18, 'C');       // CS: the works arc + the city (W)
  dregion(d, 13, 21, 2, 18, 'U');     // US: the besieging ring, facing W (E two-thirds)
  dregion(d, 10, 12, 3, 6, 'U');      // US right (Sherman, N) closing on the approach
  const ground =
    "THE SIEGE OF VICKSBURG, May-July 1863 — \"the Gibraltar of the Confederacy,\" whose fall split the South " +
    "along the Mississippi. The city sat on loess bluffs two hundred feet above the river, its batteries closing " +
    "the great waterway. Behind it the wind-laid yellow clay had eroded into a maze of steep ravines and narrow " +
    "ridges, and along those crests Pemberton's engineers strung a continuous six-and-a-half-mile arc of earthworks, " +
    "both flanks resting on the river. Where the radial roads climbed in, the works thickened into forts: Stockade " +
    "Redan astride Graveyard Road in the north; the 3rd Louisiana Redan and Great Redoubt guarding Jackson Road past " +
    "the Shirley House; the 2nd Texas Lunette on Baldwin's Ferry Road; the Railroad Redoubt at the rail gap; Fort " +
    "Garrott to the south. Every Union approach meant climbing an open, fire-swept slope out of a ravine, which is " +
    "why the assaults of 19 and 22 May bled out short of the parapets and Grant turned to the spade. The ridge gates " +
    "are everything: hold the redans and the line holds; carry one and the loess maze behind it opens the road into " +
    "Vicksburg and the river beyond.\n\nThe Ground: feature existence and relative position are Verified against the " +
    "historical record; exact hex placement within this 22×20 field is authored abstraction. The Hall's Ferry Road " +
    "routing is marked Inferred.";
  return { id:"vicksburg", g, d, objs, features, ground };
}

// ===========================================================================
// 5) CHICKAMAUGA — 19-20 Sep 1863 — attacker CS
//    LaFayette Road the N-S spine; CS crosses the creek (E) and attacks W;
//    Longstreet breaks through at Brotherton; Thomas holds Snodgrass Hill (NW).
// ===========================================================================
function chickamauga() {
  const g = blank();
  // dense woods blanket most of the field
  region(g, 0, 21, 0, 19, 'w');
  // West Chickamauga Creek — N-S along the E edge (the CS crossed it westward)
  vline(g, 20, 0, 19, '~'); vline(g, 19, 2, 17, '~');
  set(g, 18, 3, 'f');                 // Reed's Bridge (NE)
  set(g, 18, 8, 'f');                 // Alexander's Bridge (E-center)
  // LaFayette Road — the contested N-S spine
  vline(g, 11, 0, 19, '=');
  // Glenn-Kelly Road (W of LaFayette) + Dry Valley Road (rear, NW) + Reed's Bridge Rd (E-W, N)
  vline(g, 8, 4, 15, '=');
  path(g, [[5,2],[4,3],[3,4],[2,5]], '=');     // Dry Valley Rd toward McFarland's Gap
  hline(g, 3, 11, 18, '=');                     // Reed's Bridge Road
  // the cleared fields (the killing grounds) along/near the road
  region(g, 12, 14, 3, 5, ',');       // Kelly Field (N, E of road)
  region(g, 12, 13, 6, 7, ',');       // Poe Field (center-N)
  region(g, 12, 14, 9, 11, ',');      // Brotherton Field/cabin (center, the breakthrough)
  region(g, 7, 10, 8, 10, ',');       // Dyer Field (center-W, SE of Snodgrass)
  region(g, 10, 12, 13, 15, ',');     // Viniard Field (S, astride the road)
  // Snodgrass Hill + Horseshoe Ridge — Thomas's last stand (NW, highest ground)
  region(g, 4, 6, 3, 5, 'h');         // Snodgrass Hill
  set(g, 3, 5, 'R'); set(g, 4, 6, 'R'); set(g, 5, 6, 'R'); set(g, 6, 6, 'R'); // Horseshoe Ridge
  set(g, 5, 4, '.');                  // Snodgrass cabin clearing
  // Widow Glenn's — Rosecrans's HQ on high open ground SW
  set(g, 7, 13, '.'); set(g, 8, 13, 'h');
  // McFarland's Gap — the retreat pass (NW edge, Inferred)
  set(g, 2, 2, 'h'); set(g, 3, 2, 'h');

  const objs = [
    { c:5,  r:4,  val:3, label:"Snodgrass Hill" },
    { c:13, r:10, val:3, label:"Brotherton Cabin" },
    { c:13, r:4,  val:2, label:"Kelly Field" },
    { c:11, r:14, val:1, label:"Viniard Field" },
  ];
  const features = [
    { c:5,  r:4,  label:"Snodgrass Hill",       conf:"Verified" },
    { c:5,  r:6,  label:"Horseshoe Ridge",      conf:"Verified" },
    { c:13, r:10, label:"Brotherton Cabin",     conf:"Verified" },
    { c:8,  r:9,  label:"Dyer Field",           conf:"Verified" },
    { c:13, r:4,  label:"Kelly Field",          conf:"Verified" },
    { c:12, r:6,  label:"Poe Field",            conf:"Verified" },
    { c:11, r:14, label:"Viniard Field",        conf:"Verified" },
    { c:11, r:11, label:"LaFayette Road",       conf:"Verified" },
    { c:19, r:10, label:"W. Chickamauga Creek", conf:"Verified" },
    { c:18, r:3,  label:"Reed's Bridge",        conf:"Verified" },
    { c:18, r:8,  label:"Alexander's Bridge",   conf:"Verified" },
    { c:7,  r:13, label:"Widow Glenn's",        conf:"Verified" },
    { c:2,  r:2,  label:"McFarland's Gap",      conf:"Inferred" },
  ];
  const d = blank().map(row => row.map(() => '.'));
  dregion(d, 13, 21, 0, 19, 'C');     // CS: E of LaFayette Road, having crossed the creek
  dregion(d, 0, 10, 0, 19, 'U');      // US: along/just W of the road, Snodgrass NW
  const ground =
    "CHICKAMAUGA, 19-20 September 1863 — the bloodiest two days in the Western theater, fought in heavy " +
    "second-growth woods between West Chickamauga Creek and the LaFayette Road. The creek runs north-south along " +
    "the eastern edge; Bragg's Army of Tennessee crossed it westward at Reed's and Alexander's Bridges, then formed " +
    "in the timber to attack. LaFayette Road, the artery to Chattanooga, was the prize: Rosecrans's Federals held " +
    "along and just west of it, facing east. The woods were so dense the fighting collapsed to point-blank range, " +
    "and the few cleared fields — Kelly in the north, Poe and Brotherton in the center, Viniard and Dyer to the " +
    "south — became the killing grounds. The battle turned at the Brotherton cabin on 20 September, where a mistaken " +
    "order pulled a division out of line just as Longstreet's massed column drove west; the Confederates burst across " +
    "the road into Dyer Field and split the army in two. Thomas rallied the survivors on Snodgrass Hill and the " +
    "curving Horseshoe Ridge — the highest ground on the field — and held until dark, earning the name \"Rock of " +
    "Chickamauga\" and covering the retreat through McFarland's Gap. Hold the road and the line stands; break it and " +
    "only Snodgrass Hill stands between the army and ruin.\n\nThe Ground: feature existence and relative position are " +
    "Verified against the historical record; exact hex placement within this 22×20 field is authored abstraction. " +
    "McFarland's Gap's precise routing is marked Inferred.";
  return { id:"chickamauga", g, d, objs, features, ground };
}

// ===========================================================================
// 6) FRANKLIN — 30 Nov 1864 — attacker CS
//    Town cupped in the Harpeth bend (N); Union earthwork arc on the S edge;
//    Hood charges N up the Columbia Pike across two miles of open plain.
// ===========================================================================
function franklin() {
  const g = blank();
  region(g, 0, 21, 0, 19, ',');       // the open plain — the killing ground
  // Franklin town, cupped in the Harpeth bend (N edge)
  region(g, 8, 13, 0, 2, 't');
  // Harpeth River — loops around the N and E of town (SE->NW)
  hline(g, 0, 6, 15, '~');
  path(g, [[15,0],[16,1],[16,2],[17,3],[17,4],[18,5],[18,6],[19,7],[19,8]], '~');
  set(g, 14, 1, 'f');                 // a crossing behind the town
  // Fort Granger — across the river NE, guns enfilading the attacker's right
  set(g, 16, 2, 'F'); set(g, 17, 2, 'F');
  // Union main earthwork line — convex arc bulging S across the S edge of town
  const line = [[5,6],[6,6],[7,7],[8,7],[9,8],[10,8],[11,8],[12,7],[13,7],[14,6],[15,6]];
  path(g, line, 'F');
  // Retrenchment (inner line) sealing the Columbia Pike gap
  set(g, 9, 5, 'F'); set(g, 10, 5, 'F');
  // Carter House (just behind the line, W of the pike) + cotton gin (on the line, E of pike)
  set(g, 9, 6, 't');                  // Carter House
  set(g, 11, 7, 't');                 // Carter cotton gin
  // Carnton plantation (SE, behind the Union left)
  set(g, 16, 11, 't');
  // Columbia Pike — S->N through the dead center (the CS assault axis)
  vline(g, 10, 0, 19, '=');
  // Carter's Creek Pike (SW-NE, W) + Lewisburg Pike (SE-NW, E) + the railroad (just E of pike)
  path(g, [[2,18],[3,16],[4,14],[5,12],[6,10],[7,8]], '=');   // Carter's Creek Pike
  path(g, [[18,16],[17,14],[16,12],[15,10],[14,8]], '=');     // Lewisburg Pike
  vline(g, 12, 3, 19, '=');                                    // Nashville & Decatur RR
  // Winstead Hill — Hood's command post / start line (S edge)
  region(g, 9, 12, 17, 19, 'h');
  // Wagner's advanced line — forward salient on the pike (center-S)
  set(g, 10, 12, ','); set(g, 9, 12, ','); set(g, 11, 12, ',');
  // Osage-orange abatis — thorn hedge fronting the eastern works (SE)
  set(g, 13, 9, 'w'); set(g, 14, 9, 'w'); set(g, 13, 10, 'w');

  const objs = [
    { c:9,  r:6,  val:3, label:"The Carter House" },
    { c:11, r:7,  val:3, label:"The Cotton Gin" },
    { c:7,  r:7,  val:2, label:"Carter's Creek Salient" },
    { c:16, r:2,  val:1, label:"Fort Granger" },
  ];
  const features = [
    { c:9,  r:6,  label:"The Carter House",     conf:"Verified" },
    { c:11, r:7,  label:"The Cotton Gin",       conf:"Verified" },
    { c:10, r:5,  label:"The Retrenchment",     conf:"Verified" },
    { c:10, r:18, label:"Winstead Hill",        conf:"Verified" },
    { c:16, r:2,  label:"Fort Granger",         conf:"Verified" },
    { c:16, r:11, label:"Carnton Plantation",   conf:"Verified" },
    { c:13, r:9,  label:"Osage-Orange Abatis",  conf:"Verified" },
    { c:10, r:12, label:"Wagner's Line",        conf:"Verified" },
    { c:10, r:10, label:"Columbia Pike",        conf:"Verified" },
    { c:10, r:1,  label:"Franklin",             conf:"Verified" },
    { c:8,  r:0,  label:"Harpeth River",        conf:"Verified" },
    { c:3,  r:16, label:"Carter's Creek Pike",  conf:"Inferred" },
  ];
  const d = blank().map(row => row.map(() => '.'));
  dregion(d, 0, 21, 11, 19, 'C');     // CS: massed on Winstead Hill, charging N up the plain
  dregion(d, 4, 16, 3, 9, 'U');       // US: the earthwork arc S of town
  dregion(d, 8, 13, 0, 2, 'U');       // US: the town and inner line
  const ground =
    "FRANKLIN, 30 November 1864 — \"the Pickett's Charge of the West,\" where the ground dictated the slaughter. " +
    "The town sat in a tight bend of the Harpeth River, which curled around its north and east like a moat, so " +
    "Schofield's Federals had only the southern face to defend. They threw up a convex arc of earthworks — a ditch, " +
    "a rail-and-dirt parapet, an inner retrenchment — anchored on the river at both ends, crossing Carter's Creek " +
    "Pike on the west, the Columbia Pike at the center, and bending back past the Lewisburg Pike on the east. The " +
    "Carter House and the cotton gin straddled the Columbia Pike at the exact center, and that pike became the axis " +
    "of attack. Hood massed his Army of Tennessee on Winstead Hill, two miles south, then sent six divisions north " +
    "across an almost flat, cover-less plain under massed artillery, the rifled guns of Fort Granger firing enfilade " +
    "across the river into the crowded Confederate right. The river squeezed the eastern assault into a narrowing " +
    "pocket; the Osage-orange abatis tangled the rest. The Columbia Pike center — the Carter House and gin — is the " +
    "hinge: break it and Franklin falls; hold it and the open plain becomes the attacker's grave, as it became Hood's, " +
    "with six Confederate generals dead.\n\nThe Ground: feature existence and relative position are Verified against " +
    "the historical record; exact hex placement within this 22×20 field is authored abstraction. The Carter's Creek " +
    "Pike routing is marked Inferred.";
  return { id:"franklin", g, d, objs, features, ground };
}

// ---- emit ------------------------------------------------------------------
function rowsOf(g) { return g.map(r => r.join('')); }
function validate(id, rows, label) {
  let ok = rows.length === GH;
  rows.forEach((s, i) => { if (s.length !== GW) { ok = false; console.error(`!! ${id} ${label} row ${i} len ${s.length} != ${GW}`); } });
  return ok;
}
function emit(b) {
  const grid = rowsOf(b.g), dep = rowsOf(b.d);
  const ok = validate(b.id, grid, 'grid') & validate(b.id, dep, 'deploy');
  const q = s => JSON.stringify(s);
  let out = `  ${b.id}: {\n    GW: ${GW}, GH: ${GH},\n`;
  out += `    legend: { ".":"clear", ",":"field", "w":"woods", "h":"hills", "R":"ridge",\n`;
  out += `              "~":"river", "f":"ford", "t":"town", "=":"road", "F":"fort", "s":"swamp" },\n`;
  out += `    grid: [\n` + grid.map(s => `      ${q(s)}`).join(',\n') + `\n    ],\n`;
  out += `    objs: [\n` + b.objs.map(o => `      { c:${o.c}, r:${o.r}, val:${o.val}, label:${q(o.label)} }`).join(',\n') + `\n    ],\n`;
  out += `    features: [\n` + b.features.map(f => `      { c:${f.c}, r:${f.r}, label:${q(f.label)}, conf:${q(f.conf)} }`).join(',\n') + `\n    ],\n`;
  out += `    deploy: [\n` + dep.map(s => `      ${q(s)}`).join(',\n') + `\n    ],\n`;
  out += `    ground:\n      ${q(b.ground)}\n  },`;
  console.log(out);
  console.error(`${b.id}: ${ok ? 'OK' : 'INVALID'} ${GW}x${GH}  (objs ${b.objs.length}, features ${b.features.length})`);
  return ok;
}

const ALL = { bullrun1, bullrun2, chancellorsville, vicksburg, chickamauga, franklin };
const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(ALL);
let allOk = true;
for (const id of ids) {
  if (!ALL[id]) { console.error(`unknown battle: ${id}`); allOk = false; continue; }
  allOk = emit(ALL[id]()) && allOk;
}
console.error(allOk ? 'ALL OK' : 'VALIDATION FAILED');
process.exit(allOk ? 0 : 1);
