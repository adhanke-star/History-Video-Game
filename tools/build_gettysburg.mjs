// Authoring tool: lay Gettysburg's real ground onto a GW×GH hex abstraction and
// emit validated AUTHORED_MAPS grid rows. Feature existence + relative position are
// from the documented battlefield (the "fishhook": Culp's Hill barb NE, Cemetery
// Hill bend N, Cemetery Ridge running S to Little/Big Round Top; Seminary Ridge the
// CS line to the W; town N; Peach Orchard/Wheatfield/Devil's Den in the SW between
// the lines; the open mile of Pickett's Charge in the center). Exact hex = authored.
const GW = 22, GH = 20;
const g = Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const set = (c, r, ch) => { if (r >= 0 && r < GH && c >= 0 && c < GW) g[r][c] = ch; };
const vline = (c, r0, r1, ch) => { for (let r = r0; r <= r1; r++) set(c, r, ch); };
const region = (c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, ch); };

// 1) open farmland between the lines (fields)
region(6, 11, 3, 12, ',');        // the open ground incl. Pickett's Charge mile
// 2) woods
region(2, 3, 1, 3, 'w');          // McPherson / Herbst Woods (Day 1, NW)
region(2, 3, 6, 13, 'w');         // woods along the CS (Seminary Ridge) line
set(8,13,'w'); set(8,14,'w'); set(9,14,'w');   // Rose Woods (by the Wheatfield)
set(10,15,'w'); set(11,15,'w'); set(10,16,'w'); set(11,16,'w'); // Devil's Den (rocky)
set(17,3,'w'); set(17,4,'w'); set(17,5,'w'); set(16,6,'w'); set(17,6,'w'); // Culp's Hill woods
set(15,18,'w'); set(15,19,'w'); set(12,19,'w'); // Big Round Top woods
// 3) streams
vline(1, 4, 10, '~');             // Willoughby Run (W)
vline(19, 4, 15, '~'); vline(20, 6, 13, '~'); set(19,9,'f'); // Rock Creek (E) + a ford
// 4) ridges (high ground)
vline(4, 3, 16, 'R'); vline(5, 3, 16, 'R');   // Seminary Ridge — the CS line (W)
vline(12, 6, 14, 'R'); vline(13, 6, 8, 'R');  // Cemetery Ridge — the US center
// 5) hills
set(12,4,'h'); set(13,4,'h'); set(12,5,'h'); set(13,5,'h');   // Cemetery Hill (the bend)
set(15,3,'h'); set(16,3,'h'); set(15,4,'h'); set(16,4,'h'); set(15,5,'h'); // Culp's Hill (barb)
set(13,15,'R'); set(13,16,'R'); set(14,15,'h'); set(14,16,'h'); // Little Round Top
set(13,18,'h'); set(14,18,'h'); set(13,19,'h'); set(14,19,'h'); // Big Round Top
// 6) town (N, at the bend)
region(10, 13, 0, 1, 't'); region(10, 12, 2, 2, 't');
// 7) Emmitsburg Road — NE→SW between the lines (exact routing Inferred)
const road = [[11,3],[10,4],[10,5],[9,6],[9,7],[8,8],[8,9],[7,10],[7,11],[6,12],[6,13],[7,14],[7,15],[8,16]];
road.forEach(([c,r]) => set(c, r, '='));
// 8) the Peach Orchard + Wheatfield (fields, SW between the lines)
set(8,11,','); set(8,12,','); set(9,12,',');   // Peach Orchard
set(9,13,','); set(10,13,','); set(10,12,',');  // The Wheatfield
// 9) Spangler's Spring (marshy, SE of Culp's Hill)
set(18,7,'s'); set(18,8,'s');

// ── deploy zones (atk = CS) ───────────────────────────────────────────────
// CS holds Seminary Ridge (W) + Longstreet's SW wedge into the Peach Orchard/Wheatfield;
// US holds the fishhook (Cemetery Hill/Ridge, Culp's Hill, the Round Tops). The open
// center (Pickett's Charge ground) is neutral no-man's-land at start.
const d = Array.from({ length: GH }, () => Array.from({ length: GW }, () => '.'));
const dset = (c, r, ch) => { if (r >= 0 && r < GH && c >= 0 && c < GW) d[r][c] = ch; };
const dregion = (c0, c1, r0, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) dset(c, r, ch); };
dregion(0, 6, 3, 16, 'C');     // CS along/behind Seminary Ridge (W)
dregion(6, 9, 12, 16, 'C');    // Longstreet's assault wing into the SW (Peach Orchard/Wheatfield)
dregion(11, 21, 2, 6, 'U');    // US: Cemetery Hill + Culp's Hill + the bend (N)
dregion(11, 18, 6, 14, 'U');   // US: Cemetery Ridge (center)
dregion(11, 18, 14, 19, 'U');  // US: the Round Tops (S anchor)
dregion(19, 21, 4, 16, 'U');   // US rear (E of the ridge)

// validate + emit
function emit(label, arr) {
  const rows = arr.map(r => r.join(''));
  let ok = rows.length === GH;
  rows.forEach((s, i) => { if (s.length !== GW) { ok = false; console.error(`${label} row ${i} len ${s.length} != ${GW}`); } });
  console.log(`${label}: ${ok ? 'OK' : 'INVALID'} ${GW}x${GH}`);
  console.log(`    ${label === 'grid' ? 'grid' : 'deploy'}: [`);
  console.log(rows.map(s => '      "' + s + '"').join(',\n'));
  console.log('    ],');
  return ok;
}
const ok1 = emit('grid', g);
const ok2 = emit('deploy', d);
console.log(ok1 && ok2 ? 'ALL OK' : 'INVALID');
