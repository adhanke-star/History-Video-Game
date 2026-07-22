# Strategic Road and Wagon Transport Research Packet

**Milestone:** D507 initial road source pass; D508 nine-gap evidence pass
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

The register contains **42 source records**. Pages from one institution are not
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
| RDS-13 | U.S. Army Center of Military History, *The Atlanta Campaign* | Federal professional-military history / Army CMH | Louisville-Nashville-Chattanooga rail supply chain and wagon delivery from forward depots; no parallel through-road proof. | https://history.army.mil/portals/143/Images/Publications/catalog/75-13.pdf |
| RDS-14 | U.S. Army Center of Military History, “Civil War Campaigns” | Federal professional-military synthesis / Army CMH campaign summaries | Bruinsburg landing; dated overland advance via Raymond and Jackson, then west to Vicksburg. | https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/Civil-War/ |
| RDS-15 | U.S. Coast Survey, *Map Illustrating the Operations of U.S. Forces Against Vicksburg* (1863), Library of Congress | Primary federal campaign cartography / Coast Survey | Tracks of Grant, Blair, and Porter and the Vicksburg-campaign victory sites. | https://www.loc.gov/item/2007633939/ |
| RDS-16 | National Park Service, Natchez Trace Parkway, “Battle of Raymond” | Federal institutional site history / NPS Natchez Trace | Port Gibson-toward-Jackson route diverted through Raymond in May 1863; operation-specific. | https://www.nps.gov/places/battle-of-raymond.htm |
| RDS-17 | National Park Service, Vicksburg NMP, “Battle of Champion Hill” | Federal institutional battle history / NPS Vicksburg | Jackson, Middle, Raymond, Ratliff, and Champion Hill roads; bridge/weather and May 16 westward movement limits. | https://home.nps.gov/vick/learn/historyculture/championhill.htm |
| RDS-18 | Army University Press, *Staff Ride Handbook for the Red River Campaign, 7 March-19 May 1864* | Federal professional-military study / Army University Press | Alexandria-Natchitoches-Mansfield-Pleasant Hill road movement, road congestion, seasonal rain/mud, and failure to reach Shreveport. | https://www.armyupress.army.mil/Portals/7/Research%20and%20Books/2023/SRHB_Red_River_WEB_READY.pdf |
| RDS-19 | Richard M. Venable, *Map of the Red River Campaign, March 10-May 22, 1864* (1864), Library of Congress | Primary Confederate military cartography / Venable | Red River valley, Mansfield/Pleasant Hill battle sites and routes; no accomplished Shreveport endpoint. | https://www.loc.gov/item/2008626486/ |
| RDS-20 | National Park Service, CWSAC, “Marks’ Mills” | Federal institutional battle register / NPS CWSAC | Camden-Pine Bluff supply-wagon movement and capture in April 1864; one operation, not a standing edge. | https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=ar015 |
| RDS-21 | Texas State Library and Archives Commission, “1864: No Way Out” | State archival exhibition / TSLAC | Marshall as a Trans-Mississippi supply center and 1864 road/bridge pressure; no exact Marshall-Shreveport route. | https://www.tsl.texas.gov/exhibits/civilwar/1864_1.html |
| RDS-22 | National Park Service, Civil War Defenses of Washington, “The Fortification System” | Federal institutional history quoting Barnard’s 1871 report / Barnard-NPS | Thirty-two-mile local military-road system around Washington and its design for troops, batteries, and trains; not a Manassas trunk. | https://www.nps.gov/cwdw/learn/historyculture/the-fortification-system.htm |
| RDS-23 | Nathaniel P. Banks to Edwin M. Stanton, 25 May 1862, Abraham Lincoln Papers, Library of Congress | Primary official field report / Banks-LoC | Winchester-to-Martinsburg retreat, twenty-two-mile direction, trains in advance, and intended Potomac crossing; does not name a bridge or ferry. | https://www.loc.gov/resource/mal.1618000/ |
| RDS-24 | Virginia Department of Historic Resources, *Winchester National Cemetery* National Register nomination | State historic-preservation synthesis / Virginia DHR | Banks’s retreat through Winchester along Martinsburg Pike and crossing at Williamsport, 25-26 May 1862. | https://www.dhr.virginia.gov/VLR_to_transfer/PDFNoms/138-0035_Winchester_National_Cemetery_1996_Final_Nomination.pdf |
| RDS-25 | Virginia Department of Historic Resources, *Petersburg National Military Park* National Register nomination | State/federal historic-preservation synthesis / Virginia DHR | Stony Creek Station off-load, wagon transfer through Dinwiddie Court House, and Boydton Plank Road into Petersburg after Aug. 1864. | https://www.dhr.virginia.gov/VLR_to_transfer/PDFNoms/123-0071_Petersburg_National_Military_Park_1996_Draft_Nomination.pdf |
| RDS-26 | Encyclopedia Virginia, “Weldon Railroad, Battle of the” | Virginia Humanities scholarly reference / Encyclopedia Virginia | Stony Creek Station, Dinwiddie Court House, Boydton Plank Road, and the post-Aug. 1864 supply detour. | https://encyclopediavirginia.org/entries/weldon-railroad-battle-of-the/ |
| RDS-27 | Cornelius C. Platter, Civil War diary, 1864-65, Digital Library of Georgia | Primary soldier diary / Platter-DLG | Buford Bridge burned; South Edisto ferry; Orangeburg Road; rain and heavy-road delay on 5 Mar. 1865; one soldier’s route only. | https://dlg.usg.edu/record/dlg_zlpd_ccp001 |
| RDS-28 | National Park Service, “Rivers’ Bridge” battle detail and teaching map | Federal institutional history using Official Records atlas / NPS Rivers Bridge | 2-3 Feb. 1865 Salkehatchie crossing, blocked causeway, swamp bridge-building, wading, and road cut through swamp. | https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=sc011 |
| RDS-29 | James Colehour, wartime diary transcription, Stones River National Battlefield | Primary soldier memoir/diary transcription / Colehour-NPS | 28 Jan.-3 Feb. 1865 movement from Savannah to Sisters Ferry, swamp travel, felled trees, burned bridges, and crossing date; one participant family. | https://www.nps.gov/stri/learn/historyculture/upload/Colehour_James_Diary_Transcription_508.pdf |
| RDS-30 | Derek W. Frisby, *Campaigns in Mississippi and Tennessee, February-December 1864*, U.S. Army Center of Military History | Federal professional-military history / Army CMH | Vicksburg-Jackson-Meridian advance and return, 3 Feb.-3 Mar. 1864, with mapped dates and operational limits. | https://history.army.mil/portals/143/Images/Publications/catalog/75-15.pdf |
| RDS-31 | National Park Service, Vicksburg NMP, “Meridian Campaign Sesquicentennial Commemoration” and CWSAC Meridian battle detail | Federal institutional history / NPS Vicksburg-CWSAC | Vicksburg-launched Meridian operation and Feb. 1864 endpoints; not a permanent road or New Orleans connection. | https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=MS012 |
| RDS-32 | Encyclopedia of Arkansas, “Camden Expedition” | State-university scholarly reference / Encyclopedia of Arkansas | Little Rock departure; Benton, Arkadelphia, Prairie d’Ane and Washington-Camden Road approach; Camden occupation and Jenkins’ Ferry return. | https://encyclopediaofarkansas.net/entries/camden-expedition-1131/ |
| RDS-33 | U.S. War Department, *Official Records*, Series I, vol. 34, pt. 1, hosted by University of North Texas | Primary official reports / OR-UNT | Several-hundred-wagon Camden-to-Pine Bluff supply movement and Marks’ Mills capture on 25 Apr. 1864. | https://texashistory.unt.edu/ark:/67531/metapth146033/m1/810/ |
| RDS-34 | Encyclopedia of Arkansas, “Action at Marks’ Mills” | State-university scholarly reference / Encyclopedia of Arkansas | Camden-Pine Bluff Road/Warren Road junction, direction, date, and wagon-train purpose. | https://encyclopediaofarkansas.net/entries/action-at-marks-mills-1135/ |
| RDS-35 | Louisiana Division of Historic Preservation, *Historic Context for Transportation in Louisiana* | State historic-preservation synthesis / Louisiana DHP | Shreveport-Natchitoches/Old Stage/Mansfield-Fort Jesup road identities and Confederate movement/supply context; no Marshall route. | https://www.crt.la.gov/Assets/OCD/hp/nationalregister/historic_contexts/Transportation_in_Louisiana.pdf |
| RDS-36 | U.S. Army Fort Knox, “Prehistory and History of the Fort Knox Area” | Federal installation cultural-resource history / U.S. Army Fort Knox | Louisville-West Point-Elizabethtown turnpike construction, incomplete prewar extent, and Civil War military use; supports only the Louisville-Nashville half. | https://home.army.mil/knox/about/Garrison/directorate-public-works/environmental-management-division/cultural-resources-management/prehistory-and-history-fort-knox-area |
| RDS-37 | Library of Congress, “Places in Civil War History: Tennessee Secession and Fortress Monroe” | Federal map-curatorial essay / LoC Maps | Identifies the 1861 “Great National Military Road” from Nicholasville to Chattanooga as proposed, not proof of a completed Nashville-Chattanooga trunk. | https://blogs.loc.gov/maps/2017/05/places-in-civil-war-history-tennessee-secession-and-fortress-monroe/ |
| RDS-38 | National Park Service, Wilson’s Creek NB, “Wire Road” and “The Ray House” | Federal institutional history / NPS Wilson’s Creek | Springfield-Fayetteville/Fort Smith Wire or Military Road, 1861-65 troop/supply use, and conflicting descriptions of its northern reach. | https://www.nps.gov/places/wire-road.htm |
| RDS-39 | James T. Lloyd, *Lloyd’s Official Map of Missouri* (1861), Library of Congress | Primary commercial wartime map / Lloyd-LoC | Missouri roads, towns, operating/projected railroads and rivers; cartographic cross-check, not service continuity. | https://www.loc.gov/item/99448362/ |
| RDS-40 | U.S. Army Center of Military History, *The Civil War in the Trans-Mississippi Theater, 1861-1865* | Federal professional-military history / Army CMH | Rolla supply base, Lebanon-Springfield advance, and southwest-Missouri operational direction in early 1862; no single named St. Louis-Springfield road. | https://www.govinfo.gov/content/pkg/GOVPUB-D114-PURL-gpo63579/pdf/GOVPUB-D114-PURL-gpo63579.pdf |
| RDS-41 | Texas State Library and Archives Commission, “The American Civil War on the Texas Coast” | State archival exhibition / TSLAC | Houston/Galveston military and refugee context; does not identify an exact Houston-Galveston wagon-road service. | https://www.tsl.texas.gov/lobbyexhibits/civil-war-coast |
| RDS-42 | Lt. Frederick Sommer, *Map of the Route Taken During the Camden Expedition* (1864), National Archives image hosted by Encyclopedia of Arkansas | Primary Union engineer cartography / Sommer-NARA | Little Rock-Camden route and return, March-May 1864; separate underlying primary family from RDS-32. | https://encyclopediaofarkansas.net/media/gen-frederick-steele-army-map-1864-6975/ |

## 4. Candidate road-node register

The register contains **33 nodes**. `D503 mapping` is evidentiary bookkeeping, not a
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
| RD-N08 | Stony Creek Station, Virginia; Weldon-line rail-road off-load point | Unassigned | After the Aug. 1864 cut, supplies left trains here, passed through Dinwiddie Court House, and entered Petersburg by Boydton Plank Road; it is not RN-10 Weldon or a CT-09 anchor. | RDS-08, RDS-09, RDS-25, RDS-26 |
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
| RD-N27 | Martinsburg, Virginia/West Virginia; pike town and depot | Unassigned | Banks passed north from Winchester on 25 May 1862; the town is not an assigned D503 anchor. | RDS-23, RDS-24 |
| RD-N28 | Williamsport, Maryland; Potomac crossing | Unassigned | Banks’s column crossed northward on 25-26 May 1862; this exact crossing cannot be substituted for Harpers Ferry, Shepherdstown, or Boteler’s Ford. | RDS-23, RDS-24 |
| RD-N29 | Meridian, Mississippi; rail-road objective and junction | CT-27; RN-26 | Sherman reached it from Vicksburg/Jackson in Feb. 1864 and returned in late Feb.-early Mar.; the operation was destructive, not routine service. | RDS-30, RDS-31 |
| RD-N30 | St. Louis/Jefferson Barracks; Missouri depot and northern Wire-Road context | CT-29 | Federal depot/telegraph origin; sources conflict over whether the named Wire Road itself began here, Jefferson City, or only south of Springfield. | RDS-38, RDS-39 |
| RD-N31 | Rolla, Missouri; railhead and wagon-supply base | CT-30 | Union southwest-Missouri supply base in 1861-65; the exact named road to Springfield remains unresolved. | RDS-39, RDS-40 |
| RD-N32 | Springfield/Wilson’s Creek, Missouri; road junction and military base | CT-30; BATTLE-WILSONS-CREEK | Wire/Military Road troop and supply use is exact south of Springfield; northern naming remains inconsistent. | RDS-38, RDS-40 |
| RD-N33 | Fayetteville-Fort Smith approach, Arkansas; Wire/Military Road limit | Unassigned | Southern road limit for documented Missouri-Arkansas military use; it creates no CT-30-to-CT-32 connection. | RDS-38 |

## 5. Candidate road-edge and service-evidence register

The register contains **15 candidates: 13 Verified, 2 Inferred, 0 Disputed**. These
are research rows, not authorized services. `Eligibility` states only what a later
read-only substrate could consider after curing the stated gap.

| ID | Exact endpoints; CT refs | Period identity; direction; dated use | Evidence scope | Surface, crossing, season, obstruction, and interchange limits | Provenance / independent families | Eligibility |
|---|---|---|---|---|---|---|
| RD-E01 | RD-N02 Alexandria—RD-N04 Manassas; CT-03 internal (Washington context CT-01 remains outside the edge) | Fauquier and Alexandria/Warrenton Turnpike via Centreville; physical bidirectionality, military use July 1861 and Aug. 1862 | Full named turnpike segment within CT-03; not a CT-01→CT-03 service | Macadam turnpike near Manassas; Bull Run/Sudley crossings and local battle control vary; road-rail at RN-03/RN-04 | **Verified**: Corbett map RDS-01 + NPS Manassas RDS-02/RDS-03 | Candidate physical segment only |
| RD-E02 | RD-N06 Winchester—RD-N07 Strasburg/Cedar Creek; CT-04 internal | Valley Turnpike/Valley Pike; bidirectional physical road; army use May-June 1862 and Oct. 1864 | Full named local pike segment | Macadamized; Cedar Creek bridge repeatedly burned/rebuilt; road speed in one campaign is not capacity | **Verified**: Hotchkiss RDS-04 + NPS Cedar Creek RDS-05/RDS-06 | Candidate physical segment only |
| RD-E03 | RD-N06 Winchester—RD-N27 Martinsburg—RD-N28 Williamsport; CT-04 to unassigned Potomac endpoint | Martinsburg Pike; northbound army, train, and wagon retreat, 25-26 May 1862 | Exact one-way operation-specific passage | Twenty-two miles Winchester-Martinsburg, then north to Williamsport and across the Potomac; bridge/ferry method is unproved; Williamsport is not RD-N05 Harpers Ferry | **Verified**: primary Banks report RDS-23 + Virginia DHR RDS-24 | Operation evidence only; ineligible as a CT edge while the crossing remains unassigned |
| RD-E04 | RD-N08 Stony Creek Station—Dinwiddie Court House—RD-N09 Petersburg; unassigned→CT-06 | Cross roads to Dinwiddie Court House, then north on Boydton Plank Road; northbound Confederate military-supply wagons after Aug. 1864 | Exact operation-specific rail-road bypass | Stony Creek is the off-load point; the road transfer was roughly thirty miles and remained contested, inefficient, and subject to winter rail damage; no reverse or war-long service | **Verified**: NPS RDS-08/Army CMH RDS-09 + Virginia DHR RDS-25/Encyclopedia Virginia RDS-26 | Candidate operation passage only; endpoint is deliberately unassigned rather than mis-mapped to RN-10 |
| RD-E05 | RD-N10 Atlanta—RD-N11 Savannah; CT-14→CT-12 (no intermediate CT assignment claimed) | Sherman’s March to the Sea corps routes; one-way operation Nov.-Dec. 1864 | Full operation-specific army passage, multiple parallel routes | Not one road; official routes divide, cross rivers, and damage infrastructure; the operation supplies no routine reverse service or reusable interval | **Verified**: official War Department map RDS-10 + NPS RDS-11 | Operation evidence only; never a reusable edge |
| RD-E06 | RD-N11 Savannah—RD-N13 Goldsboro via RD-N12 Columbia; CT-12 plus unassigned endpoints | Sherman’s Carolinas march; one-way operation 28 Jan.-23 Mar. 1865 | Full operation-specific passage, but endpoint-to-CT mapping incomplete | Sisters Ferry crossing by 3 Feb.; Salkehatchie/Rivers Bridge road and swamp blocked 2-3 Feb., requiring bridging/wading; rain and heavy roads delayed a participant on 5 Mar.; Columbia and Goldsboro remain outside the closed D503 anchors | **Verified**: RDS-10 + RDS-11/RDS-12; crossing/limit families RDS-27/RDS-28/RDS-29 | Operation evidence only; unassigned nodes are omitted rather than guessed |
| RD-E07 | RD-N14 Bruinsburg—RD-N17 Jackson via RD-N15/RD-N16; CT-25→CT-26 | Grant’s eastward Vicksburg-campaign advance; one-way, 30 Apr.-14 May 1863 | Full operation-specific passage assembled from dated campaign legs | Landing is separate; roads diverged from the old Natchez Trace toward Raymond; no standing ferry or service | **Verified**: Army CMH RDS-14 + Coast Survey RDS-15 + NPS RDS-16 | Operation evidence only |
| RD-E08 | RD-N17 Jackson—RD-N19 Vicksburg via RD-N18; CT-26→CT-25 | Jackson/Champion Hill/Raymond/Jackson-road westward campaign passage; one-way, 15-17 May 1863 | Full operation-specific return axis | Multiple parallel roads; Bakers Creek bridge/road condition and a prior cloudburst changed the route; rail remains separate | **Verified**: RDS-14 + RDS-15 + RDS-17 | Operation evidence only |
| RD-E09 | RD-N20 Little Rock—RD-N21 Camden; CT-32 internal | Military Road from Little Rock through Benton and Arkadelphia, then the Washington-Camden Road; southbound 23 Mar.-15 Apr. 1864 and northbound retreat 26 Apr.-3 May | Exact operation-specific campaign passage | Ouachita and Saline crossings, horrible roads, rain, mud, pontoon work, and Jenkins’ Ferry bound the operation; it is not a standing Little Rock-Shreveport road | **Verified**: Sommer-NARA engineer map RDS-42 + Encyclopedia of Arkansas RDS-32 | Operation evidence only |
| RD-E10 | RD-N23 Alexandria—RD-N24 Mansfield/Pleasant Hill; CT-33 to unassigned endpoint | Red River Campaign army/wagon approach; northwest then southeast retreat, Mar.-Apr. 1864 | Full operation-specific passage to the battle corridor, not Shreveport | Road columns, rain/mud, congestion, river separation, and defeat bounded the operation; no Shreveport completion | **Verified**: Army University Press RDS-18 + Venable map RDS-19 | Operation evidence only; terminal CT unresolved |
| RD-E11 | RD-N26 Marshall—RD-N25 Shreveport; CT-35→CT-34 | Defensible route identity not yet established; wartime supply relationship only | Speculative connection | Road/bridge work and supply-center status do not identify exact road, ferry, dated wagon passage, or direction | **Inferred**: TSLAC RDS-21 only; RDS-18/RDS-19 stop east of this claim | Ineligible; retain as explicit gap |
| RD-E12 | RD-N21 Camden—RD-N22 Pine Bluff via Camden-Pine Bluff Road/Marks’ Mills and Warren Road junction; CT-32 internal | Eastbound supply-wagon movement, 25 Apr. 1864; a westbound convoy had reached Camden 20 Apr. | Exact operation-specific supply passage | Several-hundred-wagon train, muddy Moro Bottoms, escort/security, and capture at Marks’ Mills prove a dated route, not permanence or safe return | **Verified**: primary Official Records RDS-33 + Encyclopedia of Arkansas RDS-34 | Operation evidence only |
| RD-E13 | RD-N19 Vicksburg—RD-N17 Jackson—RD-N29 Meridian; CT-25→CT-26→CT-27 | Sherman’s Meridian Expedition; eastbound 3-14 Feb. 1864 and westbound return by 3 Mar. | Full operation-specific army passage with mapped endpoints/dates | Multiple columns and railroad-destruction objectives; the route does not establish a named permanent road, New Orleans continuation, or routine bidirectionality | **Verified**: Army CMH RDS-30 + NPS RDS-31 | Operation evidence only |
| RD-E14 | RD-N32 Springfield/Wilson’s Creek—RD-N33 Fayetteville/Fort Smith approach; CT-30 to unassigned endpoint | Wire Road/Military Road; physical bidirectionality and troop/supply use, 1861-65 | Named military-road segment/family south of Springfield | Exact traces and bridges varied; the southern endpoint lies outside the D503 anchor set and the row cannot be extended to Little Rock | **Verified**: NPS military-use history RDS-38 + Lloyd wartime road map RDS-39 | Candidate physical segment only; no CT-30→CT-32 edge |
| RD-E15 | RD-N31 Rolla—RD-N32 Springfield; CT-30 internal | Union wagon-supply route from the Rolla railhead through Lebanon toward Springfield, especially Jan.-Feb. 1862 | Operation-specific supply corridor, exact road name unresolved | Army CMH fixes the base, direction, and campaign; NPS/period maps do not establish one stable named road, surface, or uninterrupted availability | **Inferred**: Army CMH RDS-40 + cartographic/context RDS-38/RDS-39 | Ineligible until the exact named route and claim-specific second family resolve |

## 6. Explicit non-link register

The register contains **11 non-links**. Each is binding on this packet even where a
candidate row records narrower physical passage.

| ID | Endpoints / territories | Explicit non-link or prohibited inference | Evidence |
|---|---|---|---|
| RD-NL01 | RD-N01—RD-N04; CT-01→CT-03 | Washington’s local military-road system and Alexandria-Manassas turnpike evidence do not establish one continuous Washington-Manassas road service or an automatic Potomac crossing. | RD-E01; RDS-01, RDS-22 |
| RD-NL02 | RD-N05—RD-N07; CT-02→CT-04 | Valley Pike evidence does not complete a Harpers Ferry-Strasburg edge. RD-E03 instead proves one different 1862 Winchester-Martinsburg-Williamsport operation with an unassigned crossing. | RD-E02, RD-E03 |
| RD-NL03 | RD-N05/RD-N28 crossing areas; CT-02 plus unassigned | Williamsport, Shepherdstown/Boteler’s Ford, and Harpers Ferry are not interchangeable endpoints. The newly exact Williamsport row authorizes no timeless crossing or Harpers Ferry substitution. | RD-E03; RDS-07, RDS-23, RDS-24 |
| RD-NL04 | RD-N08—RD-N09; unassigned→CT-06 | The Stony Creek-Dinwiddie-Boydton bypass is not war-long, routine, or bidirectional. Resolving Stony Creek proves that it is not RN-10 Weldon and cannot be mapped to CT-09 by convenience. | RD-E04 |
| RD-NL05 | RD-N10—RD-N11—RD-N13; CT-14/12 and unassigned | Sherman’s divided corps marches do not create one permanent Atlanta-Savannah-Goldsboro road, a reverse service, or adjacency through Columbia. D503’s closed anchor set leaves Columbia and Goldsboro omitted. | RD-E05, RD-E06; D503 |
| RD-NL06 | RN-12 Louisville—RN-13 Nashville—RN-14 Chattanooga; CT-18→CT-20→CT-21 | The Louisville-Nashville turnpike was real and militarily used, while the mapped Nicholasville-Chattanooga “Great National Military Road” was proposed. Neither establishes a completed parallel Louisville-Nashville-Chattanooga through-road service. | RDS-13, RDS-36, RDS-37; existing CTS-R-11, CTS-R-12, CTI-03, and CTI-04 |
| RD-NL07 | RD-N14—RD-N19—RD-N29; CT-25/26/27 | The May 1863 Vicksburg operation and Feb.-Mar. 1864 Meridian operation remain separate dated passages; they do not create a permanent Mississippi road graph or any New Orleans continuation. | RD-E07, RD-E08, RD-E13 |
| RD-NL08 | RD-N20—RD-N21—RD-N22; CT-32 | Exact Little Rock-Camden and Camden-Pine Bluff operations do not compose a routine through service or establish Little Rock-to-Shreveport/Arkansas Post roads. | RD-E09, RD-E12; existing CTNL-08 and CTNL-18 boundaries |
| RD-NL09 | RD-N23—RD-N24—Shreveport; CT-33→CT-34 | The Red River army reached Mansfield/Pleasant Hill and retreated; it did not complete the intended large-force road/river movement to Shreveport. | RD-E10; RDS-18, RDS-19 |
| RD-NL10 | Marshall—Shreveport; CT-35→CT-34 | Supply-center proximity, road taxes, or the existing mixed rail/lake/road context do not prove an exact Marshall-Shreveport road service or interchange. | RD-E11; existing CTNL-05 |
| RD-NL11 | CT-29 Missouri River-St. Louis, CT-30 Missouri Ozarks, and CT-36 Houston-Galveston | RD-E14/RD-E15 establish only bounded CT-30 military-road evidence. Conflicting Wire-Road northern termini and the St. Louis-Rolla rail transfer forbid a composed CT-29→CT-30 road; no exact wartime CT-29 or CT-36 road row meets the floor. | RD-E14, RD-E15; RDS-38-RDS-41; D503; existing CTNL-17, CTNL-18, and CTNL-16 |

## 7. Road/rail/water/ferry/depot interchange register

The register contains **9 interchange candidates**. Existing `RN`, `WN`, `CTS`,
`CTI`, and `CTNL` references resolve in the D497/D499 packets or the read-only D506
substrate; none is modified here.

| ID | Road evidence | Existing endpoint/modes | Dated handling boundary | Provenance / status |
|---|---|---|---|---|
| RD-I01 | RD-E01 at RD-N02 Alexandria | RN-03 rail; port/road context | 1861-65; Potomac crossing/terminal transfer remains separate | Verified candidate; RDS-01/RDS-03 |
| RD-I02 | RD-E01 at RD-N04 Manassas | RN-04 O&A/Manassas Gap rail junction | 1861-62 road-rail military convergence; no capacity or through-car claim | Verified candidate; RDS-01/RDS-02 |
| RD-I03 | RD-E02 at RD-N07 Strasburg | RN-34 rail-to-road terminus | 1861-64; confirms road transfer but not rail continuation to Harpers Ferry | Verified candidate; RDS-04/RDS-06; CTNL-01 remains binding |
| RD-I04 | RD-E04 at RD-N08/RD-N09 | Stony Creek Station road-rail transfer; RN-07 Petersburg destination; CTS-R-07 remains the separate Weldon segment | After Aug. 1864; Stony Creek-to-wagon handling is exact, but Stony Creek is unassigned and not RN-10 | Verified operation-specific transfer; RDS-08/RDS-25/RDS-26; ineligible as a CT interchange |
| RD-I05 | RD-E05 at RD-N10 Atlanta | RN-15 and CTS-R-13, CTS-R-14, CTS-R-15, and CTS-R-17 rail spokes | Nov. 1864 departure after rail condition/control changed; roads do not inherit rail service | Verified operation context only |
| RD-I06 | RD-E05/RD-E06 at RD-N11 Savannah | RN-18, WN-29, CTS-R-16, CTS-S-01 | Dec. 1864-Jan. 1865; road arrival, rail condition, port control, and sea transfer are separate states | Verified operation context only |
| RD-I07 | RD-E07, RD-E08, and RD-E13 at RD-N17 Jackson | RN-25 and CTS-R-22 and CTS-R-23 rail context | May 1863 and Feb. 1864 operations remain distinct; road occupation/damage does not declare rail operability | Verified operation context only |
| RD-I08 | RD-E07 and RD-E08 at RD-N19 and RD-N14 | RN-24, WN-12, WN-15, CTS-W-10, and CTI-02 | 30 Apr.-17 May 1863; landing, battery passage, road march, rail transfer, and city control remain separate | Verified operation context only |
| RD-I09 | RD-E13 at RD-N29 Meridian | RN-26 and CTS-R-23/CTS-R-24 rail-junction context | 14-20 Feb. 1864; destructive army arrival does not establish rail operability, road service, or a New Orleans transfer | Verified operation context only; RDS-30/RDS-31 |

## 8. Theater coverage

| D503 teaching theater | CTs | Result of this pass |
|---|---|---|
| Chesapeake Approaches | CT-01-04, CT-08 | Strong local turnpike and Valley Pike segments plus an exact 25-26 May 1862 Winchester-Martinsburg-Williamsport route; the Williamsport endpoint remains unassigned and no crossing composition is allowed. CT-08 has no strategic-road row. |
| Virginia Heartland | CT-05-07 | Stony Creek Station-Dinwiddie Court House-Boydton Plank Road is resolved as a dated bypass into Petersburg, but Stony Creek is outside the closed anchors; no Richmond-Lynchburg road service is established. |
| Atlantic Coast | CT-09-13 | Sherman’s dated crossings and weather limits sharpen the operations but do not create service; D503 requires Goldsboro/Columbia omission, and no Charleston/Port Royal road edge is proved. |
| Georgia-Alabama Interior | CT-14-17 | Atlanta-Savannah is operation-specific; no routine Atlanta-Macon-Savannah, Augusta, Montgomery, or Mobile road graph is established. |
| Ohio-Tennessee | CT-18-24 | The evidence confirms rail/river depots plus local wagon delivery, not a Louisville-Nashville-Chattanooga through road. No CT-19/22/23/24 road rows meet the floor. |
| Mississippi Spine | CT-25-28 | Two May 1863 rows plus the separate Feb.-Mar. 1864 Vicksburg-Jackson-Meridian operation are exact; no permanent road service or New Orleans continuation follows. |
| Trans-Mississippi | CT-29-36 | Little Rock-Camden and Camden-Pine Bluff routes are now exact and independently corroborated; CT-30 has bounded Wire/Military Road evidence. Marshall-Shreveport, a completed Alexandria-Shreveport movement, CT-29, and CT-36 road rows remain unsupported. |

Coverage is therefore broader and more exact than D507, but still not complete enough
to produce a referentially closed strategic road substrate.

## 9. Known gaps and unresolved claims

The nine D507 questions now adjudicate as follows:

1. **Partly resolved:** RD-E03 fixes one exact northbound route—Winchester by
   Martinsburg Pike through Martinsburg to Williamsport, 25-26 May 1862. The
   Williamsport crossing remains unassigned, and no route-by-route register yet
   covers Harpers Ferry, Shepherdstown/Boteler’s Ford, and Williamsport in both
   directions.
2. **Resolved as operation evidence:** the off-load point was Stony Creek Station;
   wagons passed through Dinwiddie Court House and entered Petersburg on Boydton
   Plank Road. Resolution also disproves the old CT-09/RN-10 convenience mapping.
3. **Resolved by existing law:** D503’s catchments are closed sets of exact anchors.
   Columbia and Goldsboro are neither anchors nor lawful aliases, so they remain
   unassigned and omitted. This pass does not redraw a territory boundary.
4. **Partly resolved:** Sisters Ferry (28 Jan.-3 Feb.), Rivers Bridge/Salkehatchie
   causeway and swamp (2-3 Feb.), burned Buford Bridge, South Edisto ferry,
   Orangeburg Road, and 5 Mar. rain/heavy roads now carry exact bounded evidence.
   The multi-column Georgia/Carolinas operations still lack a complete road-by-road
   interval register and cannot become reusable service.
5. **Resolved negative:** the Louisville-Nashville turnpike existed and saw military
   use, while the mapped Nicholasville-Chattanooga military road was proposed. No
6. **Partly resolved:** RD-E13 adds the distinct 3 Feb.-3 Mar. 1864 Vicksburg-Jackson-
   Meridian operation. No outside-May-1863 New Orleans road continuation is proved.
7. **Resolved as two operations:** Sommer’s engineer map and the Arkansas/Official-
   Records families fix Little Rock-Camden and Camden-Pine Bluff as separate dated
   routes. They do not compose into permanent service.
8. **Partly resolved negative:** the Shreveport-Natchitoches/Old Stage/Mansfield-Fort
   Jesup road is exact, and Banks’s Alexandria approach stopped at Mansfield/Pleasant
   Hill and retreated. No completed Union Alexandria-Shreveport movement, exact
   Marshall-Shreveport road, crossing set, or claim-specific wartime wagon passage is
   proved.
9. **Partly resolved:** RD-E14/RD-E15 support bounded CT-30 military-road activity.
   The northern Wire-Road terminus conflicts across sources, the St. Louis-Rolla leg
   is rail context, and no exact CT-29 or CT-36 wartime road row meets the floor.

Five material research gaps therefore remain: the complete Potomac crossing register;
the complete Sherman road/bridge/ferry interval register; a New Orleans road row
outside May 1863; the exact Marshall-Shreveport passage; and exact CT-29/CT-36 rows.

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
2. every CT/RN/WN/CTS/CTI/CTNL/source reference to resolve, with the seven explicitly unassigned road nodes rejected rather than guessed;
3. two independent families for every `Verified` load-bearing claim and one-family rows pinned `Inferred`;
4. explicit direction, date, scope, crossing/bridge/depot limits, and operation-specific status;
5. no composition of segments, modern-road terms, gameplay fields, state/save/UI writes, or owner duplication;
6. deep immutable read-only normalization that fails closed as a whole on unresolved core references;
7. exact absence teeth for the eleven non-links and byte-equivalent D506 behavior when road data is absent;
8. a negative bind that promotes RD-E11 or RD-E15 without curing its evidence and reds only endpoint/source-floor integrity; and
9. a negative bind that maps RD-N13 to CT-09 or joins Potomac crossings and reds only prohibited-inference integrity.

That concept is deliberately non-executable. A future implementation needs a new
complete acceptance contract and standalone DRIVE transfer.

## 12. Final verdict

**NEEDS_MORE_RESEARCH**

The second pass records 42 sources, 33 nodes, 15 candidates (13 Verified · 2
Inferred · 0 Disputed), 11 non-links, and nine interchange candidates. It resolves
Stony Creek, the D503 Columbia/Goldsboro omission, the negative western through-road
question, and the two-part Arkansas route; it adds exact Williamsport, Sherman-limit,
Meridian, and CT-30 evidence without promoting operations into service. The remaining
Potomac, Sherman-interval, New Orleans, Marshall-Shreveport, CT-29, and CT-36 gaps
still prevent a complete, referentially closed road registry. Shipping a read-only
road substrate now would require forbidden endpoint, composition, or routine-service
inferences. Road data, runtime, and gameplay remain unauthorized.
