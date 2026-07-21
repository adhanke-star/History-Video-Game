# Strategic Rail Conquest Research Packet

**Status:** COMPLETE · docs/research only

**Date:** 2026-07-21

**Governing decision:** D496

**Final verdict:** `READY_FOR_CONQUEST_LAW`

## 1. Purpose

This packet supplies dated historical evidence for a future territory-scale conquest map. It asks which railroad corridors connected which candidate nodes between 1861 and 1865; where termini, missing links, gauge or physical breaks, river/port transfers, capture, destruction, repair, and rerouting changed usable connectivity; and which operational cases can test a later design law.

It does not replace D159. It does not select territories, adjacency, movement costs, capacities, repair times, ownership rules, or combat effects. A named node or edge below is a research candidate, not a promised gameplay object.

## 2. Scope

- **Geography:** the Confederate states, border states, Washington/Richmond feeder networks, immediately adjacent Northern feeder corridors, Mississippi Valley, Gulf and Atlantic interchange points, and the sparse/disconnected Trans-Mississippi network relevant to an eventual eastern/Trans-Mississippi 30-45-territory board.
- **Dates:** 1861-1865. Opening-war presence, mid-war military control/use, and late-war disruption or isolation are separated where the evidence permits.
- **Evidence grain:** territory-scale nodes and named inter-node corridors. Station-by-station geometry is deliberately deferred.
- **Modes:** railroad, plus a port, navigable-river, road/depot, or ferry interface only when it explains a railroad endpoint or break.
- **Claim status:** `Verified` requires at least two independent non-tertiary source families. `Inferred` means one credible family, an unresolved interchange, or cartography that establishes a line but not its full wartime operability. `Disputed` records an explicit conflict.

## 3. Explicit exclusions

- No final territory list or boundary.
- No runtime graph, joined rail/water schema, data file, probe, suite row, or save field.
- No movement points, turns, train capacities, throughput numbers, bonuses, penalties, combat modifiers, or ownership mechanics.
- No tactical railroad effect and no historical outcome gate.
- No claim that a line drawn on a schematic map was physically continuous, uniformly gauged, open, or militarily usable for the entire war.
- No re-authorship of D159's aggregate mileage, equipment, rolling-stock, repair, gauge, fragmentation, decay, bridge formula, battle-route friction, or Chattanooga/Longstreet benchmark values.
- No naval-combat research. Ports and rivers appear only as interchange evidence; strategic water transport remains a separate packet question.

## 4. Existing-surface crosswalk and the non-duplicative gap

| Existing surface | What it already answers | What it does not answer |
|---|---|---|
| D159 and `data/logistics-rail.json` | Aggregate US/CS rail profiles; theater and fixed-battle route friction; rolling-stock, gauge, repair, USMRR/Haupt teaching; two concentration benchmarks. | Territory-scale nodes, named edges, temporal control, cuts, bypasses, or map adjacency. |
| `src/61-logistics-rail.js` | A War Effort readout and opt-in capped bridge input derived from existing strategic state. | No map topology, edge owner, dated availability, or repair graph. |
| `tools/probe-logistics-rail.mjs` | Eight teeth: source-backed profiles, exact-zero default, caps, adjacent-system inputs, rail decay, save sanitation, UI, and D74 isolation. | No historical topology validation. |
| `HISTORICAL-DATA-ECONOMY.md` rail dossier | Aggregate asymmetry, institutional capacity, network decay, and benchmark chronology. | No referentially consistent node/edge register. |
| Battle-build naval/river packet | Tactical land-battle buildability and the river-war teaching boundary. | Strategic water or railroad network reach. |
| ARC 7 conquest law (§5 of the unlocked-but-judged design) | Requires transport-real rail/river/road/sea movement and cuttable arteries. | Leaves the territory graph, time model, and transport interface undecided. |

**Gap:** dated conquest-topology evidence. The tables below organize that evidence without converting it into gameplay law.

## 5. Research method and source-independence rules

1. Start with three independent period network views: an 1861 commercial running-order map, a 1863 Confederate-imprint southern map, and an 1864 southern railway/county map.
2. Treat each map as evidence for what it actually depicts, not survey-grade geometry or uninterrupted service.
3. Corroborate military use, control change, damage, repair, or interchange with a different family: official records/archives, NPS institutional history, state historical scholarship, or specialist monographs.
4. Count underlying creators, not hosting pages. Two Library of Congress pages reproducing one map are one family. Two modern pages repeating one report are one family.
5. Use exact dates only where a source supplies them. Otherwise use bounded intervals such as `opening 1861`, `by June 1862`, or `late 1864`.
6. Preserve company names at the date of the claim. Later successor names are locator aids only and do not rewrite wartime identity.
7. Record missing physical connection, ferry/wharf transfer, gauge uncertainty, or incomplete construction as a break—not as an edge silently joined by the researcher.
8. Keep precise quantities as evidence. None becomes a gameplay value in this packet.

## 6. Source register

| ID | Author / institution | Title and date | Type / independent family | Coverage and claims supported | URL or durable reference | Access / verification note | Confidence |
|---|---|---|---|---|---|---|---|
| SR-01 | James T. Lloyd / Library of Congress | *Lloyd's American Railroad Map* (1861) | Primary commercial cartography | Opening-war lines east of the Mississippi; explicitly marks railroads “in running order.” | https://www.loc.gov/item/gm70005368/ | LOC catalog and image available; schematic at continental scale. | High for depicted connection; low for exact alignment. |
| SR-02 | W. Alvin Lloyd / Library of Virginia, hosted by LOC | *Southern Rail-Road Map* (1863) | Primary Confederate-imprint cartography | Mid-war southern lines, Texas inset, ports and regional gaps. | https://www.loc.gov/resource/glva01.lva00025/ | Image and catalog verified; does not by itself prove service or control. | High for depicted network. |
| SR-03 | Edward Mendenhall / Library of Congress | *Railway and County Map of the Southern States* (1864) | Primary commercial cartography | Late-war eastern Deep South lines, stations, landings, rivers and roads. | https://www.loc.gov/item/gm70005001/ | LOC image/catalog verified; excludes Virginia and Texas. | High for depicted network. |
| SR-04 | David A. Pfeiffer / National Archives | “Working Magic with Cornstalks and Beanpoles” (2011), grounded in RG 92 USMRR records and McCallum's 1866 report | Federal archival/institutional | USMRR possession and use, Alexandria baseline, O&A and Manassas Gap use, repair organization, eastern/western operating records. | https://www.archives.gov/publications/prologue/2011/summer/usmrr.html | Article identifies record entries, reports, timetables, and conductor reports. | High. |
| SR-05 | National Park Service, Petersburg NB | “Railroads in the Siege” (updated 2024) | Federal institutional history | Petersburg hub, City Point port link, Richmond-Petersburg physical break/direct connection, Weldon and South Side changes. | https://www.nps.gov/pete/learn/historyculture/railroads-in-the-siege.htm | Page inspected; company identities and dated changes explicit. | High. |
| SR-06 | National Park Service, Appomattox Court House NHP | “The Appomattox Campaign” | Federal institutional history | Three-of-four Petersburg lines cut by autumn 1864; South Side isolation; Richmond & Danville retreat plan; April 1865 collapse. | https://www.nps.gov/apco/appomattox-campaign.htm | Page inspected; operational chronology explicit. | High. |
| SR-07 | National Park Service, Shiloh NMP | “The Crossroads at Corinth” | Federal institutional history | Memphis & Charleston and Mobile & Ohio junction, concentration, May 1862 evacuation, Union control interval. | https://www.nps.gov/articles/000/rail-crossover.htm | Page inspected; railroad roles and June 1862-Jan. 1864 control explicit. | High. |
| SR-08 | National Park Service | “Chattanooga, Tennessee: Train Town” | Federal institutional history | Chattanooga as W&A terminus, Tennessee River port, and junction; mountain/river constraints. | https://www.nps.gov/articles/chattanooga-tennessee-train-town-teaching-with-historic-places.htm | Page inspected; strategic-junction claim explicit. | High. |
| SR-09 | National Park Service, NRHP Atlanta documentation | Atlanta Campaign historical context | Federal institutional / cited secondary synthesis | Four Atlanta railroads and their destinations; W&A, Georgia RR, Macon & Western, Atlanta & West Point. | https://npgallery.nps.gov/pdfhost/docs/NRHP/Text/66000063.pdf | Searchable NPS PDF inspected; rail-junction passage explicit. | High. |
| SR-10 | National Park Service, Vicksburg NMP | *Cultural Landscape Report: Vicksburg* | Federal institutional / cited archival synthesis | Vicksburg-Mississippi River interchange and Vicksburg & Meridian/Southern Railroad to Jackson. | https://parkplanning.nps.gov/showFile.cfm?projectID=19204&sfid=62108 | Searchable NPS report inspected; rail-river relationship explicit. | High. |
| SR-11 | National Park Service, Harpers Ferry NHP | “Harpers Ferry and the Civil War Chronology” | Federal institutional history | B&O/C&O interchange, repeated control change, industrial/river/rail significance. | https://www.nps.gov/hafe/learn/historyculture/hf-civil-war.htm | Page inspected; eight control changes and 80% Union control stated. | High. |
| SR-12 | Robert Knox Sneden / Library of Virginia, hosted by LOC | *Map of Warrenton Junction…showing destruction…October 1863* | Primary military eyewitness cartography | O&A damage during the Bristoe Campaign. | https://www.loc.gov/item/gvhs01.vhs00024/ | Catalog summary and image verified. | High for event/location. |
| SR-13 | Library of Congress, Brady-Handy collection | *Tracks of the Orange & Alexandria Railroad, destroyed…between Bristow Station and the Rappahannock* | Primary photograph | Independent visual evidence of O&A destruction. | https://www.loc.gov/pictures/item/2018666343/ | Catalog and digital image verified. | High. |
| SR-14 | Robert M. McDowell / Library of Congress | *Maps Illustrating Gen'l Sherman's March to the Sea and through the Carolinas and Virginia* (1864-65) | Primary campaign cartography | Dated Atlanta-Savannah-Carolinas movements and destroyed/captured network context. | https://www.loc.gov/item/2008626930/ | Multi-sheet LOC item; campaign dates and routes explicit. | High for campaign movement; line damage needs corroboration. |
| SR-15 | Texas State Historical Association | “Civil War” | State institutional scholarship | Texas's 468 miles/ten railroads, Houston-centered lines, wartime military use, maintenance limits, removals. | https://www.tshaonline.org/handbook/entries/civil-war | Article inspected; route and wartime-use claims explicit. | High. |
| SR-16 | Texas State Historical Association | “Railroads” | State institutional scholarship | Texas company identities, late-war relaying toward Shreveport, Houston bridge connection, network deterioration. | https://www.tshaonline.org/handbook/entries/railroads | Article inspected; distinguishes completed, removed, and postwar lines. | High. |
| SR-17 | Texas State Historical Association | “Texas and New Orleans Railroad” | State institutional scholarship / court-record note | Houston-Orange operation intervals and conflict over alleged wartime track removal. | https://www.tshaonline.org/handbook/entries/texas-and-new-orleans-railroad | Article inspected; preserves the secondary-source/1870 inspection conflict. | High; disputed removal claim. |
| SR-18 | Robert C. Black III | *The Railroads of the Confederacy* (UNC Press, 1952; 2018 reissue) | Specialist secondary monograph | Confederate company network, gauges, disconnections, cannibalization, and collapse. | ISBN 9781469650008; https://books.google.com/books/about/The_Railroads_of_the_Confederacy.html?id=BippDwAAQBAJ | Bibliographic record verified; this packet uses it as a synthesis check, not a substitute for mapped rows. | High. |
| SR-19 | George Edgar Turner | *Victory Rode the Rails* (1953) | Specialist secondary monograph | Strategic concentration, supply, cut, repair, and network-change cases. | Indianapolis: Bobbs-Merrill, 1953 | Durable bibliography; identified by NARA as a principal history. | High. |
| SR-20 | Thomas Weber | *The Northern Railroads in the Civil War, 1861-1865* (1952) | Specialist secondary monograph | Northern feeder system and USMRR organization/repair. | New York: King's Crown Press, 1952 | Durable bibliography; identified by NARA as a principal history. | High. |
| SR-21 | John E. Clark Jr. | *Railroads in the Civil War: The Impact of Management on Victory and Defeat* (LSU Press, 2001) | Specialist secondary monograph | Management, concentration, and Chattanooga comparison. | ISBN 9780807127264 | Durable bibliography; NARA recommends it particularly for the XI/XII Corps movement. | High. |
| SR-22 | University of Nebraska-Lincoln, Center for Digital Research in the Humanities | 1861 Historical GIS railroad shapefiles (2017 release) | Academic geospatial dataset | Machine-readable 1861 network cross-check; not a wartime control layer. | https://www.loc.gov/item/2020446881/ | LOC dataset record verified; derivative research data, not a primary source. | Medium-high. |
| SR-23 | National Park Service | “Industry and Economy during the Civil War” | Federal institutional history | Atlanta/Savannah capture and destruction of rail/infrastructure in 1864. | https://www.nps.gov/articles/industry-and-economy-during-the-civil-war.htm | Page inspected; qualitative damage only. | High. |
| SR-24 | National Park Service, Chickamauga-Chattanooga NRHP context | Chickamauga-Chattanooga Civil War-Related Sites | Federal institutional / historic-resource study | Nashville & Chattanooga as Union supply line; W&A and East Tennessee & Georgia crossings; bridge destruction/rebuilding context. | https://npgallery.nps.gov/GetAsset/559adb0c-047d-4a08-80be-149120435caa | Searchable NPS document inspected. | High. |
| SR-25 | National Park Service, Petersburg NB | *Petersburg Cultural Landscape Report* | Federal institutional / cited scholarship | Five antebellum railroads, City Point/James interchange, South Side route to Lynchburg. | https://www.nps.gov/parkhistory/online_books/pete/clr.pdf | Searchable report inspected. | High. |
| SR-26 | Library of Congress / Confederate Engineer Bureau | *Military Map of South-Eastern Virginia* (1864) | Primary wartime cartography | Richmond-Petersburg railroads and fortifications during the siege. | https://www.loc.gov/item/2006627690/ | LOC catalog/image verified. | High for depicted lines. |

## 7. Candidate-node register

`Modes` lists historically present interfaces, not promised game actions. Dates describe the evidence window, not uninterrupted availability.

| Node ID | Historical name / locator | Candidate role | Modes | Applicable dates | Control / change note | Provenance | Sources |
|---|---|---|---|---|---|---|---|
| RN-01 | Baltimore, Maryland | Northern feeder and B&O origin | rail, port | 1861-65 | Union-held feeder; Baltimore disturbances affected the Washington connection in 1861, but no closure interval is asserted here. | Verified | SR-01, SR-20 |
| RN-02 | Washington, D.C. | Federal capital and military-rail origin | rail, river/port, road/depot | 1861-65 | Union throughout; military connection south ran through Alexandria. | Verified | SR-01, SR-04 |
| RN-03 | Alexandria, Virginia | USMRR eastern base and O&A/Washington interchange | rail, river/port, depot | May 1861-65 | Union-held from May 1861; NARA identifies the initial seven-mile Washington-Alexandria military line. | Verified | SR-01, SR-04 |
| RN-04 | Manassas Junction, Virginia | O&A / Manassas Gap junction | rail, road | 1861-64 | Repeatedly contested; line use and destruction varied with campaigns. | Verified | SR-01, SR-04, SR-12 |
| RN-05 | Harpers Ferry, Virginia/West Virginia | B&O, C&O Canal, Potomac/Shenandoah interchange | rail, canal, river, road | 1861-65 | Changed hands eight times; NPS estimates Union control for roughly 80% of the war. | Verified | SR-01, SR-11 |
| RN-06 | Richmond, Virginia | Confederate capital and multi-line hub | rail, James River/port, road/depot | 1861-Apr. 1865 | Confederate until evacuation April 1865; feeder lines progressively isolated. | Verified | SR-01, SR-06, SR-26 |
| RN-07 | Petersburg, Virginia | Five-line hub south of Richmond | rail, Appomattox River, road/depot | 1861-Apr. 1865 | Confederate hub until April 1865; three of four military feeders cut by autumn 1864, last line cut in 1865. | Verified | SR-05, SR-06, SR-25 |
| RN-08 | City Point, Virginia | Deepwater James River to railhead interchange | rail, deepwater port, depot | 1861-65; US base from June 1864 | Confederates destroyed much track; USMRR rebuilt it as Grant's siege supply base. | Verified | SR-05, SR-25 |
| RN-09 | Lynchburg, Virginia | South Side terminus/interchange and late-war supply origin | rail, canal/river, road/depot | 1861-65 | Confederate supply source; rations moved toward Appomattox in April 1865. | Verified | SR-05, SR-06 |
| RN-10 | Weldon, North Carolina | Petersburg-Wilmington transfer point | rail, road | 1861-65 | Confederate corridor node; usability northward degraded after Union seizure of the Weldon line south of Petersburg in Aug. 1864. | Verified | SR-03, SR-05 |
| RN-11 | Wilmington, North Carolina | Atlantic port and rail feeder to Virginia | rail, ocean port | 1861-Feb. 1865 | Confederate port/rail node until Fort Fisher and Wilmington fell; this packet does not model blockade status. | Verified | SR-03, SR-05, SR-18 |
| RN-12 | Louisville, Kentucky | Border-state Northern feeder to Nashville | rail, Ohio River/port, depot | 1861-65 | Union feeder; exact wartime transfer constraints remain for ARC 7. | Verified | SR-01, SR-20 |
| RN-13 | Nashville, Tennessee | L&N/Nashville & Chattanooga hub and Cumberland port | rail, river/port, depot | 1861-65; Union from Feb. 1862 | Control change transformed it into the principal Union western base. | Verified | SR-01, SR-04, SR-24 |
| RN-14 | Chattanooga, Tennessee | W&A terminus, junction, and Tennessee River port | rail, river/port, road/depot | 1861-65; Union from Sept. 1863 | Strategic junction; Union control opened the Atlanta axis. | Verified | SR-02, SR-08, SR-24 |
| RN-15 | Atlanta, Georgia | Four-line manufacturing and rail hub | rail, road/depot | 1861-Sept. 1864; Union thereafter | Confederate until evacuation Sept. 1, 1864; rail links cut during siege and infrastructure destroyed before/after capture. | Verified | SR-02, SR-03, SR-09, SR-23 |
| RN-16 | Augusta, Georgia | Georgia RR terminus and eastern interchange | rail, Savannah River, depot | 1861-65 | Confederate; line-to-line continuity toward Charleston/Carolinas requires station/gauge-level verification. | Verified | SR-02, SR-03, SR-09 |
| RN-17 | Macon, Georgia | Macon & Western / Central of Georgia junction | rail, road/depot | 1861-65 | Confederate; became a rerouting node after Atlanta fell, but exact late-war through-service is not established here. | Verified | SR-02, SR-03, SR-14 |
| RN-18 | Savannah, Georgia | Central of Georgia terminus and Atlantic port | rail, ocean/river port | 1861-Dec. 1864; Union thereafter | Confederate port until captured Dec. 1864; rail/infrastructure damaged during Sherman's campaign. | Verified | SR-02, SR-03, SR-14, SR-23 |
| RN-19 | West Point, Georgia | Atlanta-Montgomery company interchange | rail, Chattahoochee crossing | 1861-65 | Confederate; exact transfer/gauge procedure is unresolved. | Inferred | SR-02, SR-03 |
| RN-20 | Montgomery, Alabama | Alabama capital and east-west/southward rail node | rail, river/port, depot | 1861-Apr. 1865 | Confederate until Wilson's 1865 campaign; exact continuous links toward Mobile remain unresolved. | Verified | SR-02, SR-03, SR-18 |
| RN-21 | Mobile, Alabama | Gulf port and Mobile & Ohio terminus | rail, ocean/river port | 1861-Apr. 1865 | Confederate port/rail node until 1865; blockade and bay passage are separate water-packet questions. | Verified | SR-02, SR-03, SR-18 |
| RN-22 | Corinth, Mississippi | Memphis & Charleston / Mobile & Ohio crossing | rail, road/depot | 1861-Jan. 1864 as active military junction | Confederate concentration point; Union from June 1862 to Jan. 1864, denying full Confederate use. | Verified | SR-01, SR-02, SR-07 |
| RN-23 | Memphis, Tennessee | Mississippi River and Memphis & Charleston terminus | rail, river/port, depot | 1861-65; Union from June 1862 | River and rail control changed in June 1862; through-use east depended on Corinth. | Verified | SR-01, SR-02, SR-07 |
| RN-24 | Vicksburg, Mississippi | Mississippi River / Southern Railroad interchange | rail, river/port, depot | 1861-July 1863; Union thereafter | Confederate until July 4, 1863; loss severed a principal river-rail interchange. | Verified | SR-02, SR-03, SR-10 |
| RN-25 | Jackson, Mississippi | Southern RR and north-south line junction | rail, road/depot | 1861-65 | Repeatedly occupied/damaged in 1863; exact reopening intervals require OR/timetable work. | Inferred | SR-02, SR-03, SR-10 |
| RN-26 | Meridian, Mississippi | Southern RR / Mobile & Ohio junction | rail, depot | 1861-65 | Confederate junction; damaged in 1864, but this packet does not assert an exact closure interval. | Verified | SR-02, SR-03, SR-18 |
| RN-27 | New Orleans, Louisiana | Gulf/Mississippi port and rail origin | rail, river/ocean port, depot | 1861-Apr. 1862; Union thereafter | Union capture ended Confederate use as a Gulf gateway; internal rail segments north remained a separate question. | Verified | SR-02, SR-03, SR-18 |
| RN-28 | Little Rock, Arkansas | Arkansas railhead and river/road interchange | rail segments, river, road/depot | 1861-Sept. 1863; Union thereafter | Sparse, incomplete connections; no continuous Little Rock-Memphis rail edge is asserted. | Inferred | SR-02, SR-03, SR-18 |
| RN-29 | Shreveport, Louisiana | Trans-Mississippi headquarters and Red River interchange | short rail approach, river, road/depot | 1861-65 | Confederate administrative/logistics node; eastward rail continuity was incomplete and depended on water/road transfer. | Inferred | SR-02, SR-16, SR-18 |
| RN-30 | Marshall, Texas | East Texas railhead and late-war Shreveport approach | rail, road, Caddo Lake transfer | 1861-65 | Confederate; late-war relaying improved an approach toward Louisiana without creating a national through line. | Verified | SR-02, SR-16 |
| RN-31 | Houston, Texas | Principal Texas junction and military distribution node | rail, bayou/road/depot | 1861-65 | Confederate; local junction connectivity improved late in the war while the state remained disconnected from the eastern network. | Verified | SR-02, SR-15, SR-16 |
| RN-32 | Galveston, Texas | Gulf port linked to Houston | rail, ocean port | 1861-65; control contested 1862-63 | Rail supported Magruder's Jan. 1863 recapture; sea access and blockade remain separate. | Verified | SR-02, SR-15 |
| RN-33 | Orange/Beaumont, Texas | Eastern end of Texas & New Orleans service | rail, river/road transfer | scheduled 1862-mid-1863; irregular to early 1864 | No completed wartime rail bridge into Louisiana; track-removal claim east of the Neches is disputed. | Disputed | SR-02, SR-17 |
| RN-34 | Strasburg, Virginia | Manassas Gap rail terminus and Valley road transfer | rail, road | 1861-64 | Military use of the line reached Strasburg; no direct rail continuation to Harpers Ferry is asserted. | Verified | SR-01, SR-04 |
| RN-35 | Danville, Virginia | Richmond & Danville terminus and late-war retreat/supply objective | rail, road/depot | 1861-Apr. 1865 | Confederate; Lee planned to move toward Danville after evacuating Richmond/Petersburg. | Verified | SR-01, SR-06 |

## 8. Candidate-edge register

`Availability` is qualitative historical evidence only. It is not a capacity tier.

| Edge ID | Endpoint IDs | Wartime railroad / corridor | Dates / operating interval | Mode and interchange | Gauge / physical break | Control / change evidence and qualitative availability | Provenance | Sources | Unresolved caution |
|---|---|---|---|---|---|---|---|---|---|
| RE-01 | RN-01—RN-05 | Baltimore & Ohio: Baltimore-Harpers Ferry | opening 1861-65, subject to wartime interruption | rail; canal/river at Harpers Ferry | Potomac bridge vulnerable | Repeated Harpers Ferry control changes and bridge destruction made this a contested feeder, not a permanently open edge. | Verified | SR-01, SR-11 | Exact closure/reopening dates need B&O timetable/OR extraction. |
| RE-02 | RN-02—RN-03 | Washington & Alexandria military connection | Union-controlled from 1861; USMRR baseline by Feb. 1862 | rail to Alexandria river/depot | Potomac crossing and Washington terminal transfer | NARA identifies the seven-mile line as the only railroad initially in federal military control. | Verified | SR-01, SR-04 | Exact 1861 bridge/boat transfer arrangement remains. |
| RE-03 | RN-03—RN-04 | Orange & Alexandria: Alexandria-Manassas | 1861-64; service repeatedly disrupted | rail | bridge/track destruction points | Used by USMRR; Confederate destruction between Bristow and Rappahannock documented in Oct. 1863. | Verified | SR-01, SR-04, SR-12, SR-13 | Build a dated damage ledger before any binary open/closed law. |
| RE-04 | RN-04—RN-34 | Manassas Gap Railroad: Manassas-Front Royal-Strasburg | 1861-64 | rail to Valley road transfer | Rail ended at Strasburg; **no direct rail edge to Harpers Ferry** | NARA confirms military use of the Manassas Gap line to Front Royal/Strasburg. | Verified | SR-01, SR-04 | ARC 7 must not silently join Strasburg to Harpers Ferry by rail. |
| RE-05 | RN-06—RN-07 | Richmond & Petersburg Railroad | 1861-Apr. 1865 | rail | Lines originally ended across the Appomattox from other Petersburg rails; direct connection built Aug. 1861 | Confederate trunk until evacuation; physical-break correction is source-explicit. | Verified | SR-01, SR-05, SR-26 | Station/bridge vulnerability during evacuation needs primary detail. |
| RE-06 | RN-07—RN-08 | City Point Railroad / USMRR siege line | Confederate line damaged before June 1864; USMRR rebuilt and operated June 1864-Apr. 1865 | rail to deepwater James port | Deepwater-to-rail transshipment at City Point | High-availability Union siege artery after rebuilding; no direct ocean-to-Petersburg assumption before transfer. | Verified | SR-05, SR-25 | Construction-stage dates and branches need McCallum/USMRR maps. |
| RE-07 | RN-07—RN-10 | Petersburg Railroad / “Weldon Railroad” north segment | 1861-Aug. 1864 direct; degraded thereafter | rail | no break asserted; cut south of Petersburg shifted freight to wagon bypass | Union seizure hindered but did not wholly end supply; wagon haul bypass persisted. | Verified | SR-05, SR-06 | Exact railhead and wagon-bypass length must be sourced before modeling. |
| RE-08 | RN-10—RN-11 | Wilmington & Weldon Railroad | 1861-Feb. 1865 | rail to Wilmington port | company interchange at Weldon/Petersburg chain | Confederate port-to-Virginia feeder; value rose as other ports closed. | Verified | SR-03, SR-05, SR-18 | Through-car/gauge assumptions are not established. |
| RE-09 | RN-07—RN-09 | South Side Railroad: Petersburg-Lynchburg | 1861-Apr. 1865; sole Petersburg rail feeder by late Mar. 1865 | rail | High Bridge/Appomattox crossings | Last rail transportation into Confederate lines; severance forced evacuation. | Verified | SR-05, SR-06, SR-25 | “Sole” applies at the cited late-campaign moment, not the entire siege. |
| RE-10 | RN-06—RN-35 | Richmond & Danville Railroad | 1861-Apr. 1865 | rail to Danville road/depot connections | No direct Richmond-Danville-to-South Side join is assumed | Lee planned retreat along this line after evacuation. | Verified | SR-01, SR-02, SR-06 | Amelia/Danville ration-routing failure requires its own event ledger. |
| RE-11 | RN-12—RN-13 | Louisville & Nashville Railroad | 1861-65 | rail to Ohio/Cumberland river depots | border-state security and terminal transfers | Northern feeder to the captured Nashville base. | Verified | SR-01, SR-20 | Exact military operating intervals and sabotage events remain. |
| RE-12 | RN-13—RN-14 | Nashville & Chattanooga Railroad | Confederate opening use; Union supply line after Chattanooga campaign through 1865 | rail to Cumberland/Tennessee depots | bridge and mountain approaches vulnerable | NPS identifies it as the primary Union supply line from Nashville after 1863. | Verified | SR-01, SR-03, SR-24 | The “Cracker Line” was not itself a railroad edge; do not conflate. |
| RE-13 | RN-14—RN-15 | Western & Atlantic Railroad | 1861-65; Union-controlled progressively southward in 1864 | rail | mountain corridor; bridges/tunnels | Axis of Atlanta Campaign; both armies depended on it; Hood struck it after Atlanta fell. | Verified | SR-02, SR-03, SR-08, SR-09 | Damage and repair were episodic; no fixed decay percentage. |
| RE-14 | RN-15—RN-16 | Georgia Railroad: Atlanta-Augusta | 1861-64; Atlanta endpoint lost Sept. 1864 | rail toward Charleston/Carolinas connections | Augusta interchange not proven seamless | One of four Atlanta spokes; linked the Atlantic seaboard system eastward. | Verified | SR-02, SR-03, SR-09 | Exact Augusta transfer/gauge procedure needs company records. |
| RE-15 | RN-15—RN-17 | Macon & Western Railroad | 1861-Sept. 1864 direct into Atlanta; cut south of city during siege | rail | East Point divergence with Atlanta & West Point | Last Atlanta supply line cut at Jonesborough, forcing evacuation; operational case already researched in battle-build packet. | Verified | SR-02, SR-03, SR-09, SR-14 | Reuse the battle packet; do not duplicate casualty/outcome claims. |
| RE-16 | RN-17—RN-18 | Central of Georgia: Macon-Savannah | 1861-late 1864; disrupted during March to the Sea | rail to Savannah port | bridges/track damaged; exact reopening outside scope | Dated campaign maps plus NPS destruction/capture history establish late-war loss. | Verified | SR-02, SR-03, SR-14, SR-23 | Damage extent is qualitative here. |
| RE-17 | RN-15—RN-19 | Atlanta & West Point Railroad | 1861-Sept. 1864 at Atlanta end | rail | company interchange at West Point | Atlanta's western spoke toward Alabama. | Verified | SR-02, SR-03, SR-09 | Through-service to Montgomery not established by this row. |
| RE-18 | RN-19—RN-20 | Montgomery & West Point Railroad | 1861-Apr. 1865 | rail; Chattahoochee crossing | transfer at West Point; gauge/through-car status unresolved | Map-supported Alabama-Georgia link. | Inferred | SR-02, SR-03 | Needs annual reports/timetables before ARC 7 treats RE-17+18 as one route. |
| RE-19 | RN-22—RN-23 | Memphis & Charleston: Corinth-Memphis | 1861-May 1862 Confederate; Union denial after Corinth/Memphis fell | rail to Mississippi port | no physical break asserted | Western leg of the only Mississippi-to-Atlantic southern rail corridor, but control loss broke Confederate through-use. | Verified | SR-01, SR-02, SR-07 | Exact Union operating interval west of Corinth remains. |
| RE-20 | RN-22—RN-14 | Memphis & Charleston: Corinth-Chattanooga | 1861-May 1862 Confederate through corridor; fragmented afterward | rail to Chattanooga junction/river | transfers at Chattanooga | Eastern leg used for Confederate movement and concentration; Corinth loss interrupted through control. | Verified | SR-01, SR-02, SR-07, SR-08 | Later segment-by-segment control needs a dated ledger. |
| RE-21 | RN-22—RN-21 | Mobile & Ohio: Corinth-Mobile | 1861-65 in segments; Corinth unavailable to Confederacy after May 1862 | rail to Gulf port | junction at Corinth | Enabled early-1862 concentration at Corinth; loss of the junction prevented full Confederate north-south use. | Verified | SR-01, SR-02, SR-07 | Segment operation south of Corinth is not equivalent to through availability. |
| RE-22 | RN-24—RN-25 | Southern Railroad of Mississippi / Vicksburg & Meridian: Vicksburg-Jackson | 1861-May/July 1863; Union disruption during Vicksburg campaign | rail to Mississippi River port | river-to-rail transshipment at Vicksburg | NPS identifies the only east-west rail line between New Orleans and Memphis; river/rail combination made Vicksburg strategic. | Verified | SR-02, SR-03, SR-10 | Exact repair/reopening after 1863 remains. |
| RE-23 | RN-25—RN-26 | Southern Railroad: Jackson-Meridian | 1861-65, interrupted by 1863-64 campaigns | rail | no gauge claim | Maps establish the corridor; military damage is supported qualitatively, not as an exact closure interval. | Inferred | SR-02, SR-03, SR-18 | Needs OR/company records for dated operability. |
| RE-24 | RN-26—RN-21 | Mobile & Ohio: Meridian-Mobile | 1861-65 in segments | rail to Gulf port | Meridian and Mobile terminal transfers | Maps and specialist synthesis establish the spine. | Verified | SR-02, SR-03, SR-18 | Exact late-war service north of Mobile remains. |
| RE-25 | RN-27—RN-25 | New Orleans, Jackson & Great Northern / Mississippi Central chain | Confederate opening use; southern endpoint lost Apr. 1862; segments continued | rail | company junction and possible gauge/terminal transfer at Jackson-area connections | Period maps show a north-south chain; Union New Orleans control ended Confederate use of the port endpoint. | Inferred | SR-02, SR-03, SR-18 | Do not render this as uninterrupted New Orleans-Corinth through service without timetables. |
| RE-26 | RN-31—RN-32 | Galveston, Houston & Henderson | 1861-65; used in Jan. 1863 Galveston operation | rail to Gulf port | island/mainland and harbor transfer | Confederate military use is explicit; control around Galveston changed. | Verified | SR-02, SR-15 | Exact bridge/ferry arrangement needs primary detail. |
| RE-27 | RN-31—RN-33 | Texas & New Orleans: Houston-Beaumont/Orange | scheduled 1862-mid-1863; irregular to early 1864 | rail to river/road transfer; **no Louisiana through rail** | incomplete eastward connection; Neches/Sabine crossing problem | Wartime service interval is explicit. Alleged removal east of the Neches conflicts with an 1870 property inspection. | Disputed | SR-02, SR-15, SR-17 | Preserve both accounts; never encode the removal as settled fact. |
| RE-28 | RN-30—RN-29 | Marshall-Caddo Lake-Shreveport approach | late-war improvised connection, not a continuous opening-war railroad | short rail, lake/river, road transfer | rails relaid toward the Louisiana line; water/road gap remained | Texas lines were cannibalized to improve the Trans-Mississippi approach. | Inferred | SR-02, SR-16, SR-18 | Needs dated engineering/company records; no through train is asserted. |
| RE-29 | RN-28—RN-23 | Memphis & Little Rock corridor | incomplete wartime railroad in separated segments | rail segments plus river/road transfer | major physical gaps | Candidate **break**, not a normal edge: period mapping and specialist history do not justify continuous rail movement. | Inferred | SR-02, SR-03, SR-18 | ARC 7 should represent absence/disconnection, not adjacency by wishful line-drawing. |

## 9. Cut, repair, reroute, and concentration case studies

| Case ID | Dates | Case and topology lesson | Evidence result | Provenance | Sources |
|---|---|---|---|---|---|
| RC-01 | Sept. 1863 | **Chattanooga/Longstreet reuse check.** D159 already owns both inter-theater transfer benchmarks. This packet reuses them only to validate that junctions, transfers, gauge/terminal breaks, and management matter; it adds no values or formulas. | A future law needs a route/interchange representation, not another aggregate speed bonus. | Verified — D159 reuse | D159; SR-04, SR-21 |
| RC-02 | Oct. 1863 | **Orange & Alexandria cut.** Sneden's Warrenton Junction map and an independent LOC photograph document destroyed track between Bristow and the Rappahannock. | A named edge can change state within a campaign and must carry dated damage evidence. | Verified | SR-12, SR-13 |
| RC-03 | May 1862 | **Potomac Creek repair/reopening.** Haupt's organization rebuilt the bridge rapidly; NARA ties such work to the USMRR records and repair system. | Repair is actor-, organization-, material-, and location-dependent; it is not a universal turn count. | Verified | SR-04, SR-20 |
| RC-04 | June 1864-Apr. 1865 | **City Point rebuild and rail-river-port interchange.** Confederates damaged the short port railroad; USMRR rebuilt it from the James deepwater base to supply the Petersburg siege. | Interchange requires a port/wharf railhead and a dated operating authority; water and rail remain distinct modes. | Verified | SR-05, SR-25 |
| RC-05 | Apr.-May 1862 | **Corinth concentration and denial.** Mobile & Ohio concentrated Confederate troops; Memphis & Charleston linked Mississippi Valley to the Atlantic; Confederate evacuation and later Union occupation denied full through-use. | A junction's owner can matter more than line presence; loss can fragment two axes simultaneously. | Verified | SR-01, SR-07 |
| RC-06 | May-July 1863 | **Vicksburg rail-river severance.** The Southern Railroad linked the Mississippi River at Vicksburg to Jackson/Meridian; Union capture changed both river and rail reach. | Rail-water junctions need separate control records for node, river passage, and edge. | Verified | SR-02, SR-10 |
| RC-07 | May-Dec. 1864 | **Atlanta Campaign and March to the Sea.** The W&A sustained Sherman's advance; Atlanta's other spokes were cut; subsequent operations destroyed rail/infrastructure toward Savannah. | Rerouting and destruction need dated corridor records; campaign maps must not become exact damage geometry. | Verified | SR-09, SR-14, SR-23 |
| RC-08 | Aug. 1864-Apr. 1865 | **Petersburg isolation and network collapse.** Weldon traffic persisted through a wagon bypass after rail seizure; by autumn three feeders were cut; South Side's severance forced evacuation; Appomattox supply trains were then captured. | “Cut” can mean degraded rather than zero until bypasses and alternate lines also fail. | Verified | SR-05, SR-06 |
| RC-09 | 1863-64 | **Texas cannibalization and disputed removal.** Rails were relocated to improve the Marshall-Shreveport approach and for fortifications, while the T&NO Orange-removal claim conflicts with a later inspection. | Trans-Mississippi topology needs explicit `incomplete`, `relocated`, and `disputed` states rather than a binary national network. | Disputed | SR-15, SR-16, SR-17 |

## 10. Opening-, mid-, and late-war change summary

### Opening war: 1861-early 1862

- Period maps show a dense eastern network and several powerful north-south/east-west southern spines, but also company boundaries, terminal transfers, and severe Trans-Mississippi discontinuity.
- Washington's military railroad footprint began with the short Alexandria connection; Confederate use of junctions such as Manassas and Corinth enabled early concentration.
- Richmond-Petersburg's direct physical connection was not a timeless fact: NPS dates the connecting construction to August 1861.
- New Orleans, Nashville, Memphis, and Corinth were still Confederate endpoints/junctions at the opening, while Harpers Ferry and northern Virginia edges changed hands or suffered damage.

### Mid war: mid-1862-1863

- Union capture of Nashville, Memphis, Corinth, New Orleans, Vicksburg, and Chattanooga progressively converted or denied key junctions.
- USMRR operation and repair turned captured corridors around Alexandria and later Nashville/Chattanooga into renewable supply arteries; this is institutional history, not an automatic repair rule.
- O&A destruction in 1863 proves that a mapped line needs an event history. Vicksburg and Corinth show that node control can interrupt multi-modal or cross-axis reach without every rail being physically removed.
- Chattanooga/Longstreet remains D159's benchmark. Its only topology lesson here is that transfers and management cannot be reduced to geographic distance.

### Late war: 1864-1865

- Atlanta's four-spoke hub fell after its supply links were cut; the W&A changed from Confederate lifeline to Union invasion artery, then itself became a target.
- Sherman's campaigns damaged rail between Atlanta, Savannah, and the Carolinas, but period campaign maps are not exact track-damage inventories.
- Petersburg demonstrates progressive isolation: a seized edge could continue through wagon bypass, then become functionally decisive only after alternatives failed.
- The Trans-Mississippi did not become a seamless substitute network. Texas service deteriorated, rails were relocated, and eastern connections remained incomplete.

## 11. Trans-Mississippi coverage and limitations

The Trans-Mississippi is defined here as a sparse, disconnected transport region, not a low-capacity copy of Virginia or Georgia.

- Texas had ten railroads totaling 468 miles in 1861, concentrated around Houston and coastal/eastern short lines (SR-15). The state was not rail-connected to the eastern Confederacy.
- Houston-Galveston and Houston-Orange are supported wartime local edges. Orange did not supply a continuous rail route through Louisiana.
- Marshall-Shreveport is a late-war improvised approach involving relaid rails and water/road transfer, not a through main line.
- Little Rock-Memphis is retained as an explicit break candidate. Drawing two partial systems on a map must not create a usable edge.
- The Mississippi River itself was a strategic separator and transport route; its passage/control belongs to the water packet. Rail rows stop at their documented transfer points.
- Arkansas, Indian Territory, Missouri south of the main Union feeder system, and Louisiana west of the Mississippi remain source-thin at station/operating-interval grain. ARC 7 may use only the negative fact of disconnection until better evidence exists.

## 12. Border-state and Northern-feeder coverage

- **Baltimore-B&O-Harpers Ferry:** industrial/rail/canal feeder with repeated contested control at the river junction.
- **Washington-Alexandria:** the initial federal military-rail bridgehead and gateway to O&A/Manassas Gap lines.
- **Louisville-Nashville:** the principal Ohio Valley feeder into the Union western base. This packet establishes the corridor, not its capacity.
- **Harpers Ferry:** a border junction whose repeated control changes warn against assigning a single war-long owner.
- **Cairo/St. Louis caution:** both were major Union river/rail supply origins, but the present evidence pass did not build verified territory-scale rail edges from them. They are named source gaps, not silently omitted proof that they were unimportant.
- Northern density north/east of Baltimore and Louisville is outside the candidate-board focus. A future law may abstract it as off-board feeder authority only after deciding how off-board supply enters.

## 13. Rail-to-ARC-7 input requirements

### Evidence categories ARC 7 will need

1. Stable node and edge research IDs separate from gameplay IDs.
2. Historical name plus date-aware company identity.
3. Endpoint referential integrity and explicit non-links.
4. Operating/control intervals rather than one timeless owner.
5. Event records for capture, cut, destruction, repair, reroute, bypass, and abandonment.
6. Break type: terminal, gauge, bridge, ferry/wharf, unfinished construction, company transfer, or evidence gap.
7. Mode and interchange type: rail-rail, rail-river, rail-ocean port, rail-road/depot.
8. Provenance and source IDs at the fact level.
9. A distinction between physical presence, operating service, military control, and usable military reach.
10. Qualitative availability only where sources support it; no conversion formula in the evidence layer.

### Facts this packet can supply

- A first referential node/edge candidate register covering the eastern, western, Gulf/Atlantic, border-feeder, and Trans-Mississippi systems.
- Three dated network snapshots (1861, 1863, 1864) with explicit map limitations.
- Nine operational cases spanning concentration, cut, repair, port interchange, bypass, destruction, and late collapse.
- Specific corrections: Richmond-Petersburg's Aug. 1861 physical connection; Weldon's degraded-not-zero post-cut status; incomplete Trans-Mississippi links; disputed T&NO track removal.

### Architecture choices deliberately left open

- Final territory count/boundaries and which research nodes collapse into one territory.
- Whether edges are time-sliced snapshots, event-sourced records, or campaign-state intervals.
- Whether control belongs to nodes, edges, service rights, or some combination.
- How roads, rivers, coastwise shipping, depots, and off-board feeders share an interface.
- How Historical constrains plausibility and how Mayhem permits divergence.
- Any repair, throughput, movement, concentration, or supply algorithm.
- Player visibility, AI planning, save representation, and single-file compression.

## 14. Rail/naval interface boundary

Rail and strategic water transport may share only these evidence categories:

- dated endpoint IDs;
- mode and interchange type;
- control/change interval;
- physical or institutional break;
- provenance and source IDs;
- qualitative availability, when directly supported;
- operational case references.

They do **not** yet share a runtime schema. A rail edge cannot imply navigable water, a river node cannot imply rail transfer, and blockade status cannot silently become railroad ownership. ARC 7 law must adjudicate the common interface only after the strategic water scope is resolved.

## 15. D74 and source-integrity risks

- **Output-wall risk:** using a historical cut to force a battle winner, casualty ratio, surrender, or combat modifier. Forbidden.
- **Scalar-collapse risk:** converting a documented line, bridge, or repair into a universal capacity/speed/turn value. Forbidden in research.
- **Map literalism:** period maps can be schematic, aspirational, outdated, or silent on gauge and service. A drawn line is not enough for precise operating topology.
- **Successor-name drift:** later Atlantic Coast Line, Southern, Norfolk & Western, or other system names must not be backdated.
- **Control/presence conflation:** occupying a city, holding a track segment, running trains, and receiving military supply are different claims.
- **Cut/zero conflation:** Weldon demonstrates that seizure can shift freight to a wagon bypass without instantly producing zero reach.
- **Repair romanticism:** Haupt/USMRR capacity was institutional and resource-dependent; it is not a “Union repairs instantly” rule.
- **Lost Cause materialism:** Confederate network weakness came from political economy, slavery-backed capital's limited convertibility, fragmented companies, industrial constraints, blockade, policy, and military destruction—not noble scarcity or fate.
- **Forced inevitability:** Union material superiority shapes inputs but cannot decide outcomes by itself.
- **Trans-Mississippi erasure:** sparse/disconnected evidence must remain visible rather than filled with invented links.

## 16. Validation recommendations

A future documentation-only guard may check:

- the required section headings;
- a source-register minimum and unique `SR-*` IDs;
- unique `RN-*`, `RE-*`, and `RC-*` IDs;
- edge endpoint referential integrity;
- allowed provenance tokens (`Verified`, `Inferred`, `Disputed`, and explicit D159 reuse);
- nonempty source lists and source-ID resolution;
- valid ordered dates/interval text where machine-readable dates later exist;
- a nonempty unresolved-caution cell for every edge;
- an explicit remaining-traps section;
- exactly one verdict token;
- absence of forbidden gameplay fields such as movement points, turn costs, capacities, bonuses, penalties, combat multipliers, forced owners, or outcome gates.

The guard must not force historical outcomes, create territory boundaries, bless schematic geometry, or define a runtime schema. No probe is authorized by D496 or this packet.

## 17. Remaining traps and source gaps

1. **Primary operating records:** extract company timetables/annual reports and McCallum/USMRR conductor reports for exact service intervals on the O&A, Nashville-Chattanooga, W&A, and Petersburg lines.
2. **Gauge/terminal ledger:** verify company gauge and physical terminal transfers at Augusta, West Point, Jackson, Montgomery, Richmond, Petersburg, and Wilmington; do not inherit modern through-route assumptions.
3. **B&O interruption chronology:** compile bridge destruction/reopening and military operating dates around Harpers Ferry.
4. **Carolinas:** build a stronger Wilmington-Columbia-Charlotte-Richmond feeder register before selecting conquest edges across the Carolinas.
5. **Alabama:** verify Montgomery-Mobile and Selma-Montgomery connections and Wilson's 1865 destruction at company/bridge grain.
6. **Mississippi:** date Jackson/Meridian repairs and service after the Vicksburg and Meridian campaigns.
7. **Trans-Mississippi:** obtain Arkansas/Louisiana railroad annual reports, Confederate Trans-Mississippi quartermaster records, and exact Caddo/Red River transfer points.
8. **Texas conflict:** preserve the T&NO Orange track-removal dispute until the cited 1870 inspection/court record is read directly.
9. **Northern feeders:** decide whether Cairo, St. Louis, Cincinnati, Harrisburg, and Philadelphia are off-board sources or candidate nodes only after the territory-board scope is chosen.
10. **Cartographic georeferencing:** use SR-22 or a fresh historical-GIS pass only to propose geometry; every operational edge still needs dated documentary evidence.
11. **Company identity:** no later merger/successor name may replace a wartime company without a dated identity table.
12. **D159 duplication:** exact benchmark numbers, theater friction, bridge caps, and rail-decay values stay in D159 and must not migrate into conquest law as “new research.”

## 18. Final verdict

`READY_FOR_CONQUEST_LAW`

The evidence supports a non-final candidate topology and, more importantly, the categories a law draft must preserve: dated endpoints, explicit breaks, company identity, mode/interchange, control versus operation, event history, bypass, and provenance. Core eastern/western corridors and the required operational cases meet the two-independent-family floor. The packet also identifies honest weak spots rather than filling them: Carolinas/Alabama transfer grain, several exact service intervals, and most Trans-Mississippi through-route questions.

This verdict does **not** mean “ready for runtime.” ARC 7 must first adjudicate territory granularity, the shared rail/water/road evidence interface, temporal state, Historical/Mayhem plausibility, cut/repair semantics, D159 compatibility, War Career isolation, saves, and offline constraints.

## 19. Precise next bounded task

Perform the separate docs-only strategic naval/river/blockade scope adjudication. Reconcile the battle-build naval/river packet, shipped blockade/trade/diplomacy behavior, D159's `N` theater teaching, strategic ports/rivers/amphibious-transfer evidence, and D455 §5-§7. Decide whether a bounded `docs/design/strategic-water-transport-research-packet.md` is needed. Record the adjudication in `DECISIONS.md`; do not author the water packet in the same commit and do not change runtime, data, probes, assets, saves, or generated output.
