// Authoring tool: Fredericksburg (13 Dec 1862) onto a 22×20 hex abstraction.
// Burnside's army crossed the Rappahannock (E) on pontoon bridges into the town, then
// charged WEST across an open plain into Longstreet's line on Marye's Heights — men
// stacked behind a stone wall along a sunken road mowed down wave after wave. To the
// south, Jackson held the wooded rise of Prospect Hill, where Meade briefly broke
// through. A one-sided slaughter: the plain is the killing ground.
const GW = 22, GH = 20;
const g = Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const set = (c, r, ch) => { if (r >= 0 && r < GH && c >= 0 && c < GW) g[r][c] = ch; };
const vline = (c, r0, r1, ch) => { for (let r = r0; r <= r1; r++) set(c, r, ch); };
const region = (c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, ch); };

// 1) the open killing-ground plain (fields) between town and the heights
region(6, 11, 3, 12, ',');
region(8, 15, 12, 14, ',');     // fields south of town
// 2) woods — behind Marye's Heights (W) and on Prospect Hill (S)
region(0, 1, 3, 14, 'w');
region(5, 10, 16, 19, 'w');
region(16, 18, 13, 19, 'w');
// 3) Marye's Heights — the ridge + fort earthworks (W)
vline(2, 3, 14, 'R'); vline(3, 4, 13, 'R');
set(2, 7, 'F'); set(3, 7, 'F'); set(2, 8, 'F'); set(3, 8, 'F'); // earthworks on the crest
// 4) the Sunken Road / Stone Wall at the base of the heights (N-S)
vline(5, 4, 13, '=');
// 5) the town of Fredericksburg (W bank, center-E)
region(12, 15, 6, 11, 't');
// 6) the Rappahannock (E) + pontoon crossings
region(19, 21, 0, 19, '~');
region(16, 18, 0, 3, '~');      // the river's NE bend
set(17, 7, 'f'); set(18, 8, 'f'); set(17, 9, 'f'); // pontoon bridges into the town
// 7) Hazel Run (across the south plain) + Deep Run (S) + Telegraph Road (CS lateral)
for (let c = 4; c <= 11; c++) set(c, 13, '~');  // Hazel Run
for (let c = 11; c <= 15; c++) set(c, 15, '~'); // Deep Run
vline(4, 14, 18, '=');           // Telegraph Road behind the heights
// 8) Prospect Hill — Jackson's wooded rise (S flank)
region(6, 9, 16, 18, 'h');

const rows = g.map(r => r.join(''));
let ok = rows.length === GH;
rows.forEach((s, i) => { if (s.length !== GW) { ok = false; console.error(`grid row ${i} len ${s.length} != ${GW}`); } });
console.log(`grid: ${ok ? 'OK' : 'INVALID'} ${GW}x${GH}`);
console.log('    grid: [');
console.log(rows.map(s => '      "' + s + '"').join(',\n'));
console.log('    ],');

// deploy: US (attacker) crosses from the E into the town + plain; CS holds the heights (W) + Prospect Hill (S)
const d = Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const dset = (c, r, ch) => { if (r >= 0 && r < GH && c >= 0 && c < GW) d[r][c] = ch; };
const dregion = (c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) dset(c, r, ch); };
dregion(0, 6, 3, 14, 'C');     // CS on Marye's Heights + the Sunken Road (W)
dregion(4, 10, 15, 19, 'C');   // CS on Prospect Hill (S)
dregion(10, 18, 3, 14, 'U');   // US in the town + the E half of the plain
dregion(11, 18, 15, 18, 'U');  // US SE
dregion(16, 18, 0, 6, 'U');    // US bridgehead by the river (NE)

const drows = d.map(r => r.join(''));
let ok2 = drows.length === GH;
drows.forEach((s, i) => { if (s.length !== GW) { ok2 = false; console.error(`deploy row ${i} len ${s.length} != ${GW}`); } });
console.log(`deploy: ${ok2 ? 'OK' : 'INVALID'} ${GW}x${GH}`);
console.log('    deploy: [');
console.log(drows.map(s => '      "' + s + '"').join(',\n'));
console.log('    ],');
console.log(ok && ok2 ? 'ALL OK' : 'INVALID');
