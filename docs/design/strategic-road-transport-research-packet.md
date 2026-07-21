# Strategic Road and Wagon Transport Research Packet

**Milestone:** D507 road source pass  
**Date:** 2026-07-21  
**Research boundary:** documents and historical evidence only  
**Access date for web sources:** 2026-07-21

## 1. Scope, question, and non-goals

This packet asks one bounded question: which period road or wagon corridors can be
defended, claim by claim, between or within the 36 `CT-01`..`CT-36` operational
catchments shipped by D503/D504? It records named roads, exact or deliberately
bounded endpoints, dated army or military-supply use, crossings and interchanges,
surface and weather limits, and explicit absences. A candidate is not a playable
edge. `Verified` requires two independent non-tertiary source families supporting
the particular load-bearing claim; one-family or endpoint-incomplete claims remain
`Inferred`; conflicts remain `Disputed`.

The packet does **not** authorize or design road data, normalization, runtime, UI,
movement, adjacency, state, saves, costs, capacity, congestion, attrition, repair,
bonuses, supply/economy effects, reinforcement, rewards, AI, terrain values,
campaign-start behavior, battle coupling, or tactical effects. Modern highway
alignment, schematic contact, and generic statements that a road existed supply no
claim. Operation-specific passage never becomes routine permanent service.

## 2. Ownership reconciliation

| Existing owner | Boundary preserved here |
|---|---|
| D159 and `src/61-logistics-rail.js` | Retain aggregate logistics formulas, rail readiness, and bridge inputs. No value or formula is copied. |
| D497 rail packet and D506 transport substrate | Retain rail nodes, services, dates, interchanges, non-links, and immutable read-only ownership. Road candidates cite those IDs only to name a physical transfer point. |
| D499 water packet, blockade, and naval owners | Retain river/sea passage, blockade economics, fleet action, ports, and landings. A ferry, ford, wharf, or port does not complete a road. |
| Western Theater and existing economy/manpower owners | Retain depots, supply summaries, readiness, procurement, and reinforcement effects. Wagon evidence supplies no gameplay quantity. |
| D74, `bridgeArmy`, and shared result owners | Retain all battle inputs, resolver authority, casualties, score, winner, surrender, and output. |
| Chronicle/divergence | Retains canonical-history versus `Your Timeline` presentation. This packet writes no receipts. |
| War Career | Remains ladder-only and consequence-only; no named participation follows from a road movement. |
| Tactical terrain and Custom Builder | Retain battlefield roads, crossings, site geometry, and local scenario state. Strategic candidates confer no tactical feature or builder topology. |

The road packet owns only the research classification below. Physical availability,
player-authored ownership/control, service condition, and any future order receipt
remain separate concepts.

## 3. Source register

The register contains **22 source records**. Pages from one institution are not
automatically independent and institutional siblings count as one family unless a
separate underlying primary record carries the claim; each edge row states which
distinct families carry its load-bearing claim.

| ID | Author / institution; title and date | Type / family | Claim coverage and limit | Stable reference |
|---|---|---|---|---|
| RDS-01 | V. P. Corbett, *Map of the Seat of War Showing the Battles of July 18th, 21st & Oct. 21st 1861* (1861), Library of Congress | Primary commercial wartime map / Corbett | Washington-Alexandria-Manassas roads, towns, railroads, and 1861 military context; not service continuity. | https://www.loc.gov/item/99439216/ |
| RDS-02 | National Park Service, Manassas NBP, “The Stone House” | Federal institutional history / NPS Manassas | Wartime beds and names of the Warrenton/Fauquier and Alexandria Turnpike and Sudley Road; commerce/travel role. | https://www.nps.gov/mana/learn/historyculture/the-stone-house.htm |
| RDS-03 | National Park Service, “A New Economy of War” | Federal institutional history / NPS thematic | Warrenton Turnpike through Manassas, Alexandria-market origin, and July 1861 military concentration. | https://home.nps.gov/articles/a-new-economy-of-war.htm |
| RDS-04 | Jedediah Hotchkiss, *Map of the Shenandoah Valley* (1862), Library of Congress | Primary Confederate military cartography / Hotchkiss | Roads and offensive/defensive points from the Potomac through Winchester and Strasburg to the upper Valley; not a service schedule. | https://www.loc.gov/item/99446754/ |
| RDS-05 | National Park Service, “A Vital Valley Route” | Federal institutional history / NPS Cedar Creek | Great Wagon Road/Valley Turnpike identity, Winchester-Harrisonburg macadamization and Staunton extension, rough-road contrast. | https://www.nps.gov/places/early-history-and-settlement-room-a-vital-valley-route.htm |
| RDS-06 | National Park Service, “Historic Turnpike Crossing” | Federal institutional history / NPS Cedar Creek property | Both armies’ use of Valley Pike; Cedar Creek bridge repeatedly burned/rebuilt; 19 Oct. 1864 crossing. | https://www.nps.gov/places/historic-turnpike-crossing.htm |
| RDS-07 | National Park Service, “War Comes to the Valley” | Federal institutional campaign chronology / NPS Cedar Creek | Dated Potomac crossings at Williamsport, Shepherdstown/Boteler’s Ford and Valley movements; crossings are not interchangeable. | https://www.nps.gov/articles/000/civil-war-shenandoah-valley.htm |
| RDS-08 | National Park Service, Petersburg NB, “Weldon Railroad: The 19th-21st” | Federal institutional battle history / NPS Petersburg | After Aug. 1864, supplies off-loaded south of the cut and hauled about thirty miles up Boydton Plank Road to Petersburg. | https://www.nps.gov/pete/learn/historyculture/weldon-railroad-the-19th-to-the-21st.htm |
| RDS-09 | U.S. Army Center of Military History, *The Petersburg and Appomattox Campaigns, 1864-1865* | Federal professional-military history / Army CMH | Boydton Plank Road as a campaign objective and dated road operations; does not name the exact Confederate off-load station. | https://history.army.mil/Portals/143/Images/Publications/Publication%20By%20Title%20Images/P%20Pdf/cmhPub_75-16.pdf |
| RDS-10 | U.S. War Department Corps of Engineers, *Map Showing Route of Marches ... Atlanta ... Goldsboro* (1865), Library of Congress | Primary official campaign cartography / War Department | Separate corps/cavalry routes from Atlanta through Savannah and the Carolinas to Goldsboro; proves operations, not one road. | https://www.loc.gov/item/99447077/ |
| RDS-11 | National Park Service, Fort Sumter/Fort Moultrie NHP, “William T. Sherman” | Federal institutional biography / NPS Fort Sumter | Atlanta-Savannah and Savannah-Carolinas campaign endpoints and dates; broad only. | https://home.nps.gov/fosu/learn/historyculture/william-t-sherman.htm |
| RDS-12 | National Park Service, “The Battle of Bentonville: Caring for Casualties” | Federal institutional teaching history / NPS Bentonville | Sherman’s North Carolina march and Goldsboro objective; does not map Goldsboro into a D503 anchor. | https://www.nps.gov/articles/the-battle-of-bentonville-caring-for-casualties-of-the-civil-war-teaching-with-historic-places.htm |
| RDS-13 | U.S. Army Quartermaster Museum, “Supplying Hell: The Campaign for Atlanta” | Federal Army logistics history / Quartermaster Museum | Louisville-Nashville-Chattanooga rail/river depot chain and local wagon delivery from field depots; no through-road claim. | https://qmmuseum.army.mil/research/history-heritage/history/civil-war/Supplying-Hell_The-Campaign-for-Atlanta.html |
| RDS-14 | U.S. Army Center of Military History, “Civil War Campaigns” | Federal professional-military synthesis / Army CMH campaign summaries | Bruinsburg landing; dated overland advance via Raymond and Jackson, then west to Vicksburg. | https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/Civil-War/ |
| RDS-15 | U.S. Coast Survey, *Map Illustrating the Operations of U.S. Forces Against Vicksburg* (1863), Library of Congress | Primary federal campaign cartography / Coast Survey | Tracks of Grant, Blair, and Porter and the Vicksburg-campaign victory sites. | https://www.loc.gov/item/2007633939/ |
| RDS-16 | National Park Service, Natchez Trace Parkway, “Battle of Raymond” | Federal institutional site history / NPS Natchez Trace | Port Gibson-toward-Jackson route diverted through Raymond in May 1863; operation-specific. | https://www.nps.gov/places/battle-of-raymond.htm |
| RDS-17 | National Park Service, Vicksburg NMP, “Battle of Champion Hill” | Federal institutional battle history / NPS Vicksburg | Jackson, Middle, Raymond, Ratliff, and Champion Hill roads; bridge/weather and May 16 westward movement limits. | https://home.nps.gov/vick/learn/historyculture/championhill.htm |
| RDS-18 | Army University Press, *Staff Ride Handbook for the Red River Campaign, 7 March-19 May 1864* | Federal professional-military study / Army University Press | Alexandria-Natchitoches-Mansfield-Pleasant Hill road movement, road congestion, seasonal rain/mud, and failure to reach Shreveport. | https://www.armyupress.army.mil/Portals/7/Research%20and%20Books/2023/SRHB_Red_River_WEB_READY.pdf |
| RDS-19 | Richard M. Venable, *Map of the Red River Campaign, March 10-May 22, 1864* (1864), Library of Congress | Primary Confederate military cartography / Venable | Red River valley, Mansfield/Pleasant Hill battle sites and routes; no accomplished Shreveport endpoint. | https://www.loc.gov/item/2008626486/ |
| RDS-20 | National Park Service, CWSAC, “Marks’ Mills” | Federal institutional battle register / NPS CWSAC | Camden-Pine Bluff supply-wagon movement and capture in April 1864; one operation, not a standing edge. | https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=ar015 |
| RDS-21 | Texas State Library and Archives Commission, “1864: No Way Out” | State archival exhibition / TSLAC | Marshall as a Trans-Mississippi supply center and 1864 road/bridge pressure; no exact Marshall-Shreveport route. | https://www.tsl.texas.gov/exhibits/civilwar/1864_1.html |
| RDS-22 | National Park Service, Civil War Defenses of Washington, “The Fortification System” | Federal institutional history quoting Barnard’s 1871 report / Barnard-NPS | Thirty-two-mile local military-road system around Washington and its design for troops, batteries, and trains; not a Manassas trunk. | https://www.nps.gov/cwdw/learn/historyculture/the-fortification-system.htm |

## 4. Candidate road-node register

The register contains **26 nodes**. `D503 mapping` is evidentiary bookkeeping, not a
new spatial boundary. `Unassigned` means the named endpoint cannot be attached to a
D503 anchor without a later law decision.

| Node | Period endpoint / type | D503 mapping | Dated role and limitation | Sources |
|---|---|---|---|---|
| RD-N01 | Washington, D.C.; capital, depot, road origin | CT-01; RN-02/WN-24 | Union throughout; local encircling military roads do not themselves reach Manassas. | RDS-01, RDS-22 |
| RD-N02 | Alexandria, Virginia; town, port/rail/road interchange | CT-03; RN-03 | Union-held from May 1861; eastern end of the turnpike approach. | RDS-01, RDS-02, RDS-03 |
| RD-N03 | Centreville, Virginia; turnpike junction/locality | CT-03 | July 1861 and Aug. 1862 approach; no independent strategic owner. | RDS-01, RDS-03 |
| RD-N04 | Manassas Junction/Stone House crossroads; rail-road junction | CT-03; RN-04 | Turnpike/Sudley military use in 1861-62. | RDS-01, RDS-02, RDS-03 |
| RD-N05 | Harpers Ferry; depot, rail/canal/river/road crossing area | CT-02; RN-05 | Crossing and supply functions changed with control; no single permanent Potomac road crossing. | RDS-04, RDS-07 |
| RD-N06 | Winchester; Valley Pike town/depot | CT-04 | Repeated army movement 1862-64. | RDS-04, RDS-05, RDS-07 |
| RD-N07 | Strasburg/Middletown-Cedar Creek corridor; pike/bridge | CT-04; RN-34 | Macadam pike; Cedar Creek bridge repeatedly destroyed and rebuilt. | RDS-04, RDS-06 |
| RD-N08 | Weldon-line off-load zone south of the Union cut; rail-road transfer zone | CT-09; RN-10 only as regional anchor | Aug. 1864-Apr. 1865 bypass origin; exact station/yard is unresolved. | RDS-08, RDS-09 |
| RD-N09 | Petersburg; city, rail/road/depot hub | CT-06; RN-07 | Destination of Boydton Plank Road wagon haul during the siege. | RDS-08, RDS-09 |
| RD-N10 | Atlanta; city/rail/road origin | CT-14; RN-15 | Sherman’s armies departed in Nov. 1864 on multiple routes. | RDS-10, RDS-11 |
| RD-N11 | Savannah; city/rail/port/road hinge | CT-12; RN-18/WN-29 | Dec. 1864 endpoint and Jan. 1865 origin; modes remain separate. | RDS-10, RDS-11 |
| RD-N12 | Columbia, South Carolina; campaign waypoint/river crossing area | Unassigned | Feb. 1865 waypoint; not a D503 anchor and cannot create CT-11/13 adjacency. | RDS-10, RDS-11 |
| RD-N13 | Goldsboro, North Carolina; campaign objective/rail-road hinge | Unassigned | Mar. 1865 endpoint; not RN-10 Weldon and not presently assigned to CT-09. | RDS-10, RDS-12 |
| RD-N14 | Bruinsburg, Mississippi; landing/road origin | CT-25; WN-15 | 30 Apr.-1 May 1863 landing; not a generic ferry. | RDS-14, RDS-15 |
| RD-N15 | Port Gibson, Mississippi; road/campaign waypoint | CT-25 | May 1863 operation waypoint; local endpoint only. | RDS-14, RDS-15, RDS-16 |
| RD-N16 | Raymond, Mississippi; road junction/campaign waypoint | CT-26 | 12 May 1863 approach and battle. | RDS-14, RDS-15, RDS-16 |
| RD-N17 | Jackson, Mississippi; capital/rail-road depot | CT-26; RN-25 | Captured 14 May 1863; western return began afterward. | RDS-14, RDS-15, RDS-17 |
| RD-N18 | Champion Hill/Edwards crossroads and Bakers Creek bridge; road/bridge complex | CT-25 | 16-17 May 1863; road choice and bridge state were operation-critical. | RDS-14, RDS-15, RDS-17 |
| RD-N19 | Vicksburg; city/rail/river/road hub | CT-25; RN-24/WN-12 | May-July 1863 siege endpoint; passage, landing, and road approach remain distinct. | RDS-14, RDS-15, RDS-17 |
| RD-N20 | Little Rock; capital/road-river-rail hub | CT-32; RN-28/WN-17 | Camden Expedition origin region; no complete Little Rock-Shreveport road is proved. | RDS-20 |
| RD-N21 | Camden, Arkansas; occupation base/road depot | CT-32 | April 1864 supply crisis; endpoint of Pine Bluff wagon trains. | RDS-20 |
| RD-N22 | Pine Bluff; river/road supply origin | CT-32 | April 1864 resupply destination; only operation-specific evidence. | RDS-20 |
| RD-N23 | Alexandria, Louisiana; river/road depot | CT-33; WN-18/WN-40 | Red River campaign road origin after river movement. | RDS-18, RDS-19 |
| RD-N24 | Mansfield-Pleasant Hill corridor; crossroads/battle localities | Unassigned | 8-9 Apr. 1864 high-water-mark on the Shreveport approach; no D503 anchor assignment. | RDS-18, RDS-19 |
| RD-N25 | Shreveport; river/road depot and Trans-Mississippi headquarters | CT-34; RN-29/WN-19 | Intended Red River campaign objective; the 1864 Union operation did not reach it. | RDS-18, RDS-19 |
| RD-N26 | Marshall, Texas; road/rail supply center | CT-35; RN-30 | Wartime supply-center and road/bridge pressure are supported; exact Shreveport passage is not. | RDS-21 |

## 5. Candidate road-edge and service-evidence register

The register contains **11 candidates: 7 Verified, 4 Inferred, 0 Disputed**. These
are research rows, not authorized services. `Eligibility` states only what a later
read-only substrate could consider after curing the stated gap.

| ID | Exact endpoints; CT refs | Period identity; direction; dated use | Evidence scope | Surface, crossing, season, obstruction, and interchange limits | Provenance / independent families | Eligibility |
|---|---|---|---|---|---|---|
| RD-E01 | RD-N02 Alexandria—RD-N04 Manassas; CT-03 internal (Washington context CT-01 remains outside the edge) | Fauquier and Alexandria/Warrenton Turnpike via Centreville; physical bidirectionality, military use July 1861 and Aug. 1862 | Full named turnpike segment within CT-03; not a CT-01→CT-03 service | Macadam turnpike near Manassas; Bull Run/Sudley crossings and local battle control vary; road-rail at RN-03/RN-04 | **Verified**: Corbett map RDS-01 + NPS Manassas RDS-02/RDS-03 | Candidate physical segment only |
| RD-E02 | RD-N06 Winchester—RD-N07 Strasburg/Cedar Creek; CT-04 internal | Valley Turnpike/Valley Pike; bidirectional physical road; army use May-June 1862 and Oct. 1864 | Full named local pike segment | Macadamized; Cedar Creek bridge repeatedly burned/rebuilt; road speed in one campaign is not capacity | **Verified**: Hotchkiss RDS-04 + NPS Cedar Creek RDS-05/RDS-06 | Candidate physical segment only |
| RD-E03 | RD-N05 Harpers Ferry/Potomac area—RD-N06 Winchester; CT-02→CT-04 | Harpers Ferry/Winchester approaches using campaign-specific Potomac crossings; directions varied, 1862-64 | Operation-specific approaches, not one stable named corridor | Williamsport, Shepherdstown/Boteler’s Ford and Harpers Ferry are distinct crossings; exact ferry/ford and route changed | **Inferred**: RDS-04 + RDS-07 support geography/movements but not one endpoint-stable edge | Not eligible without route-by-route OR/map extraction |
| RD-E04 | RD-N08 unresolved Weldon off-load zone—RD-N09 Petersburg; CT-09→CT-06 | Boydton Plank Road wagon bypass; northbound supply haul after Aug. 1864, about thirty miles | Operation-specific military-supply passage | Plank road; exact off-load station and feeder road into Boydton are unresolved; control was contested; rail-road interchange is not routine | **Inferred** despite NPS RDS-08 + Army CMH RDS-09 because the southern endpoint is not exact | Not eligible until off-load endpoint resolves |
| RD-E05 | RD-N10 Atlanta—RD-N11 Savannah; CT-14→CT-12 (no intermediate CT assignment claimed) | Sherman’s March to the Sea corps routes; one-way operation Nov.-Dec. 1864 | Full operation-specific army passage, multiple parallel routes | Not one road; corps split, lived off the land, crossed rivers and damaged infrastructure; no routine reverse service | **Verified**: official War Department map RDS-10 + NPS RDS-11 | Operation evidence only; never a reusable edge |
| RD-E06 | RD-N11 Savannah—RD-N13 Goldsboro via RD-N12 Columbia; CT-12 plus unassigned endpoints | Sherman’s Carolinas march; one-way operation Jan.-Mar. 1865 | Full operation-specific passage, but endpoint-to-CT mapping incomplete | Multiple corps routes and river crossings; this row does not establish road-by-road surface or weather limits; Columbia and Goldsboro are not D503 anchors | **Verified**: RDS-10 + RDS-11/RDS-12 | Ineligible until endpoint law assigns or rejects nodes |
| RD-E07 | RD-N14 Bruinsburg—RD-N17 Jackson via RD-N15/RD-N16; CT-25→CT-26 | Grant’s eastward Vicksburg-campaign advance; one-way, 30 Apr.-14 May 1863 | Full operation-specific passage assembled from dated campaign legs | Landing is separate; roads diverged from the old Natchez Trace toward Raymond; no standing ferry or service | **Verified**: Army CMH RDS-14 + Coast Survey RDS-15 + NPS RDS-16 | Operation evidence only |
| RD-E08 | RD-N17 Jackson—RD-N19 Vicksburg via RD-N18; CT-26→CT-25 | Jackson/Champion Hill/Raymond/Jackson-road westward campaign passage; one-way, 15-17 May 1863 | Full operation-specific return axis | Multiple parallel roads; Bakers Creek bridge/road condition and a prior cloudburst changed the route; rail remains separate | **Verified**: RDS-14 + RDS-15 + RDS-17 | Operation evidence only |
| RD-E09 | RD-N20 Little Rock region—RD-N21 Camden—RD-N22 Pine Bluff; CT-32 internal | Camden Expedition and Pine Bluff resupply wagon movements; directions varied, Apr. 1864 | Operation-specific local segments | Supply trains depended on roads, bridges, forage, escort and security; captured wagons prove movement, not permanent availability | **Inferred**: one underlying NPS/CWSAC family RDS-20 for the exact wagon claim | Not eligible without a second independent family and exact route |
| RD-E10 | RD-N23 Alexandria—RD-N24 Mansfield/Pleasant Hill; CT-33 to unassigned endpoint | Red River Campaign army/wagon approach; northwest then southeast retreat, Mar.-Apr. 1864 | Full operation-specific passage to the battle corridor, not Shreveport | Road columns, rain/mud, congestion, river separation, and defeat bounded the operation; no Shreveport completion | **Verified**: Army University Press RDS-18 + Venable map RDS-19 | Operation evidence only; terminal CT unresolved |
| RD-E11 | RD-N26 Marshall—RD-N25 Shreveport; CT-35→CT-34 | Defensible route identity not yet established; wartime supply relationship only | Speculative connection | Road/bridge work and supply-center status do not identify exact road, ferry, dated wagon passage, or direction | **Inferred**: TSLAC RDS-21 only; RDS-18/RDS-19 stop east of this claim | Ineligible; retain as explicit gap |

## 6. Explicit non-link register

The register contains **11 non-links**. Each is binding on this packet even where a
candidate row records narrower physical passage.

| ID | Endpoints / territories | Explicit non-link or prohibited inference | Evidence |
|---|---|---|---|
| RD-NL01 | RD-N01—RD-N04; CT-01→CT-03 | Washington’s local military-road system and Alexandria-Manassas turnpike evidence do not establish one continuous Washington-Manassas road service or an automatic Potomac crossing. | RD-E01; RDS-01, RDS-22 |
| RD-NL02 | RD-N05—RD-N07; CT-02→CT-04 | Valley Pike evidence does not complete a Harpers Ferry-Strasburg edge; Potomac crossings and Winchester approaches require separate rows. | RD-E02, RD-E03 |
| RD-NL03 | RD-N05 crossing area; CT-02 | Williamsport, Shepherdstown/Boteler’s Ford, and Harpers Ferry are not interchangeable endpoints and no single timeless crossing is authorized. | RDS-07 |
| RD-NL04 | RD-N08—RD-N09; CT-09→CT-06 | The 1864 Boydton wagon bypass is not a war-long, routine, bidirectional road service; an unresolved rail off-load zone cannot become RN-10 by convenience. | RD-E04 |
| RD-NL05 | RD-N10—RD-N11—RD-N13; CT-14/12 and unassigned | Sherman’s divided corps marches do not create one permanent Atlanta-Savannah-Goldsboro road, a reverse service, or adjacency through Columbia. | RD-E05, RD-E06 |
| RD-NL06 | RN-12 Louisville—RN-13 Nashville—RN-14 Chattanooga; CT-18→CT-20→CT-21 | The sourced western supply chain is rail/river to depots with local wagon delivery; it does not establish a parallel through-road service. | RDS-13; existing CTS-R-11, CTS-R-12, CTI-03, and CTI-04 |
| RD-NL07 | RD-N14—RD-N19; CT-25/26 | Grant’s 1863 operation does not create a permanent Bruinsburg-Jackson-Vicksburg service, bidirectionality, or a generic Mississippi road graph. | RD-E07, RD-E08 |
| RD-NL08 | RD-N20—RD-N22; CT-32 | Camden/Pine Bluff wagon movements do not establish Little Rock-to-Shreveport or Little Rock-to-Arkansas Post road service. | RD-E09; existing CTNL-08 and CTNL-18 boundaries |
| RD-NL09 | RD-N23—RD-N24—Shreveport; CT-33→CT-34 | The Red River army reached Mansfield/Pleasant Hill and retreated; it did not complete the intended large-force road/river movement to Shreveport. | RD-E10; RDS-18, RDS-19 |
| RD-NL10 | Marshall—Shreveport; CT-35→CT-34 | Supply-center proximity, road taxes, or the existing mixed rail/lake/road context do not prove an exact Marshall-Shreveport road service or interchange. | RD-E11; existing CTNL-05 |
| RD-NL11 | CT-29 Missouri River-St. Louis and CT-30 Missouri Ozarks | This bounded pass establishes no exact CT-29 or CT-30 road row. Battle-library anchors and modern interstate intuition remain prohibited. | D503; existing CTNL-17 and CTNL-18 |

## 7. Road/rail/water/ferry/depot interchange register

The register contains **8 interchange candidates**. Existing `RN`, `WN`, `CTS`,
`CTI`, and `CTNL` references resolve in the D497/D499 packets or the read-only D506
substrate; none is modified here.

| ID | Road evidence | Existing endpoint/modes | Dated handling boundary | Provenance / status |
|---|---|---|---|---|
| RD-I01 | RD-E01 at RD-N02 Alexandria | RN-03 rail; port/road context | 1861-65; Potomac crossing/terminal transfer remains separate | Verified candidate; RDS-01/RDS-03 |
| RD-I02 | RD-E01 at RD-N04 Manassas | RN-04 O&A/Manassas Gap rail junction | 1861-62 road-rail military convergence; no capacity or through-car claim | Verified candidate; RDS-01/RDS-02 |
| RD-I03 | RD-E02 at RD-N07 Strasburg | RN-34 rail-to-road terminus | 1861-64; confirms road transfer but not rail continuation to Harpers Ferry | Verified candidate; RDS-04/RDS-06; CTNL-01 remains binding |
| RD-I04 | RD-E04 at RD-N08/RD-N09 | CTS-R-07 Weldon segment; RN-07 Petersburg | After Aug. 1864; exact southern off-load point is unresolved | Inferred/ineligible until endpoint resolution |
| RD-I05 | RD-E05 at RD-N10 Atlanta | RN-15 and CTS-R-13, CTS-R-14, CTS-R-15, and CTS-R-17 rail spokes | Nov. 1864 departure after rail condition/control changed; roads do not inherit rail service | Verified operation context only |
| RD-I06 | RD-E05/RD-E06 at RD-N11 Savannah | RN-18, WN-29, CTS-R-16, CTS-S-01 | Dec. 1864-Jan. 1865; road arrival, rail condition, port control, and sea transfer are separate states | Verified operation context only |
| RD-I07 | RD-E07 and RD-E08 at RD-N17 Jackson | RN-25 and CTS-R-22 and CTS-R-23 rail context | May 1863; road occupation/damage does not declare rail operability | Verified operation context only |
| RD-I08 | RD-E07 and RD-E08 at RD-N19 and RD-N14 | RN-24, WN-12, WN-15, CTS-W-10, and CTI-02 | 30 Apr.-17 May 1863; landing, battery passage, road march, rail transfer, and city control remain separate | Verified operation context only |

## 8. Theater coverage

| D503 teaching theater | CTs | Result of this pass |
|---|---|---|
| Chesapeake Approaches | CT-01-04, CT-08 | Strong local turnpike and Valley Pike segments; Potomac/Valley composition remains incomplete; CT-08 has no strategic-road row. |
| Virginia Heartland | CT-05-07 | The Petersburg bypass is important but its southern off-load endpoint is unresolved; no Richmond-Lynchburg road service is established. |
| Atlantic Coast | CT-09-13 | Sherman’s late-war marches prove operations, not service; Goldsboro/Columbia are unassigned and no Charleston/Port Royal road edge is proved. |
| Georgia-Alabama Interior | CT-14-17 | Atlanta-Savannah is operation-specific; no routine Atlanta-Macon-Savannah, Augusta, Montgomery, or Mobile road graph is established. |
| Ohio-Tennessee | CT-18-24 | The evidence confirms rail/river depots plus local wagon delivery, not a Louisville-Nashville-Chattanooga through road. No CT-19/22/23/24 road rows meet the floor. |
| Mississippi Spine | CT-25-28 | Vicksburg-campaign roads support two dated operation rows; no permanent road service to Meridian or New Orleans follows. |
| Trans-Mississippi | CT-29-36 | Alexandria-Mansfield and Camden/Pine Bluff operations are bounded; Shreveport completion, Marshall connection, Missouri rows, and Houston/Galveston road links remain unsupported. |

Coverage is therefore broad enough to test the research law but not complete enough
to produce a referentially closed strategic road substrate.

## 9. Known gaps and unresolved claims

Nine material gaps remain:

1. An exact Potomac-crossing-to-Winchester route register by date and direction.
2. The named Weldon off-load station/yard and its exact feeder into Boydton Plank Road.
3. D503 adjudication for Columbia and Goldsboro, or a reason to omit them entirely.
4. Road-by-road weather, bridge, and ferry intervals for Sherman’s Georgia/Carolinas operations.
5. Any source-backed through-road claim parallel to the Louisville-Nashville-Chattanooga rail/river chain.
6. A road register from Vicksburg/Jackson toward Meridian and New Orleans outside the May 1863 operation.
7. A second independent family and exact route for Little Rock-Camden-Pine Bluff wagon movement.
8. Exact road, crossings, dated wagons, and direction for Marshall-Shreveport; proof of Shreveport completion from Alexandria.
9. Exact period military-road rows for CT-29/30 and any defensible road connection involving CT-36.

No gap may be filled by present-day highway alignment, inferred catchment geometry,
or composition of existing rail/water nodes.

## 10. Consumer eligibility and prohibited inferences

A later read-only consumer could display this packet as research only. It may not
normalize `RD-E*` rows into services. Even `Verified` means the stated historical
claim is corroborated; it does not mean routine availability, a balanced movement
edge, player control, intact bridges, bidirectionality, capacity, or a complete CT
connection. Rows marked operation-specific remain canonical-history evidence only.

Prohibited inferences include: joining local segments; converting a march into a
scheduled service; treating a wagon bypass as permanent; making all Potomac
crossings equivalent; mapping an unassigned town to the nearest CT; inheriting rail
or river status; inventing surface quality; deriving capacity from troop/wagon
counts; or making Mayhem cure missing geography. Historical evidence remains
canonical; any future control, operation, condition, or `Your Timeline` receipt must
belong to a separately contracted owner.

## 11. Validation concept for a possible later read-only substrate

No runtime or probe code is authorized now. If a later contract follows renewed
research, its filesystem-first validation should require:

1. exact closed IDs and signatures for sources, nodes, candidates, non-links, and interchanges;
2. every CT/RN/WN/CTS/CTI/CTNL/source reference to resolve, with unassigned endpoints rejected rather than guessed;
3. two independent families for every `Verified` load-bearing claim and one-family rows pinned `Inferred`;
4. explicit direction, date, scope, crossing/bridge/depot limits, and operation-specific status;
5. no composition of segments, modern-road terms, gameplay fields, state/save/UI writes, or owner duplication;
6. deep immutable read-only normalization that fails closed as a whole on unresolved core references;
7. exact absence teeth for the eleven non-links and byte-equivalent D506 behavior when road data is absent;
8. a negative bind that promotes RD-E04 or RD-E11 and reds only endpoint/source-floor integrity; and
9. a negative bind that maps RD-N13 to CT-09 or joins Potomac crossings and reds only prohibited-inference integrity.

That concept is deliberately non-executable. A future implementation needs a new
complete acceptance contract and standalone DRIVE transfer.

## 12. Final verdict

**NEEDS_MORE_RESEARCH**

The source pass establishes seven corroborated historical movement/road claims and
four honest inferred candidates, but it does not establish a complete, exact,
territory-resolved road-service register. The decisive blockers are the Petersburg
off-load endpoint, unassigned Carolinas endpoints, operation-specific rather than
routine Georgia/Mississippi/Red River passages, one-family Arkansas evidence, the
unproved Marshall-Shreveport connection, and absent Missouri/Texas rows. Shipping a
read-only road substrate now would force forbidden endpoint or service inferences.
