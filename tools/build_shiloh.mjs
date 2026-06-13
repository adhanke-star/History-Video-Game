// Authoring tool: Shiloh (6–7 Apr 1862) onto a 22×20 hex abstraction.
// The ground: Grant's army camped on the wooded plateau west of Pittsburg Landing
// on the Tennessee River (E), flanked by Owl Creek (NW) and Lick Creek (SE). Johnston's
// Confederates struck at dawn from the SW (the Corinth road), driving the camps back
// toward the river; the center held for hours at the Hornet's Nest / Sunken Road by the
// Peach Orchard and Bloody Pond. Heavily wooded with scattered camp clearings.
const GW = 22, GH = 20;
const g = Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const set = (c, r, ch) => { if (r >= 0 && r < GH && c >= 0 && c < GW) g[r][c] = ch; };
const region = (c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, ch); };

// 1) the forest (Shiloh was dense woods) — broad bands, clearings carved after
region(0, 9, 11, 19, 'w');     // SW forest (the CS approach ground)
region(8, 16, 6, 13, 'w');     // central woods incl. the Hornet's Nest thicket
region(13, 19, 4, 16, 'w');    // east-central woods
region(2, 9, 2, 5, 'w');       // north woods patches
// 2) camp clearings + fields (the Union camps & named fields)
region(8, 14, 2, 6, ',');      // main Union camps near the landing (N)
set(9,9,','); set(10,9,','); set(9,10,','); set(10,10,',');  // Duncan Field (W of Hornet's Nest)
set(13,13,','); set(14,13,','); set(13,12,',');               // Sarah Bell's field / Peach Orchard edge
set(5,7,','); set(6,7,','); set(6,8,',');                     // Rea Field (NW camp clearing)
set(14,12,','); set(15,12,',');                               // the Peach Orchard
// 3) waters — Tennessee River (E), Owl Creek (N/NW), Lick Creek (SE)
region(20, 21, 0, 19, '~');    // Tennessee River — the Union's back (E)
set(19,2,'f'); set(19,3,'f');  // Pittsburg Landing
region(0, 8, 0, 0, '~'); set(0,1,'~'); set(1,1,'~'); set(0,2,'~'); set(1,2,'~'); set(0,3,'~'); // Owl/Snake Creek (NW)
region(13, 19, 18, 19, '~'); set(17,17,'~'); set(18,17,'~'); set(19,16,'~'); // Lick Creek (SE)
set(14,11,'s');                // Bloody Pond
// 4) roads — the Corinth Road (CS axis, SW→NE) + the Sunken Road at the Hornet's Nest
[[2,18],[3,17],[4,16],[5,15],[6,14],[7,13],[8,12],[9,11],[10,10],[11,9],[12,8],[13,7],[14,6],[15,5],[16,4]].forEach(([c,r]) => set(c, r, '='));
set(13,8,'='); set(13,9,'='); set(13,10,'='); set(13,11,'='); // the Sunken Road (N-S, by the Hornet's Nest)
// 5) Shiloh Church (the CS namesake/axis, SW)
set(3,15,'t'); set(4,15,'t');

const rows = g.map(r => r.join(''));
let ok = rows.length === GH;
rows.forEach((s, i) => { if (s.length !== GW) { ok = false; console.error(`grid row ${i} len ${s.length} != ${GW}`); } });
console.log(`grid: ${ok ? 'OK' : 'INVALID'} ${GW}x${GH}`);
console.log('    grid: [');
console.log(rows.map(s => '      "' + s + '"').join(',\n'));
console.log('    ],');

// deploy: CS attacks from the SW; US holds the camps + center back to the landing (NE)
const d = Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const dset = (c, r, ch) => { if (r >= 0 && r < GH && c >= 0 && c < GW) d[r][c] = ch; };
const dregion = (c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) dset(c, r, ch); };
dregion(0, 9, 12, 19, 'C');    // CS assault mass (SW, off the Corinth road)
dregion(0, 6, 8, 19, 'C');     // CS left coming up the W flank
dregion(8, 19, 0, 7, 'U');     // US camps near the landing (N/NE)
dregion(9, 16, 7, 12, 'U');    // US center line — the Hornet's Nest / Sunken Road stand
dregion(16, 19, 7, 15, 'U');   // US right-rear toward the river

const drows = d.map(r => r.join(''));
let ok2 = drows.length === GH;
drows.forEach((s, i) => { if (s.length !== GW) { ok2 = false; console.error(`deploy row ${i} len ${s.length} != ${GW}`); } });
console.log(`deploy: ${ok2 ? 'OK' : 'INVALID'} ${GW}x${GH}`);
console.log('    deploy: [');
console.log(drows.map(s => '      "' + s + '"').join(',\n'));
console.log('    ],');
console.log(ok && ok2 ? 'ALL OK' : 'INVALID');
