# Strategic Road and Wagon Transport Research Packet

**Milestone:** D507 initial road source pass; D508 nine-gap evidence pass; D509 five-family evidence pass; D511 final six-family evidence pass
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

The register contains **65 source records**. Pages from one institution are not
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
| RDS-27 | Cornelius C. Platter, Civil War diary, 1864-65, Digital Library of Georgia | Primary soldier diary / Platter-DLG | Buford Bridge burned; unnamed South Edisto ferry; Orangeburg Road; 5-8 Feb. road and corduroy work; 5 Mar. camp/crossing wait; and 8-9 Mar. rain, heavy-road, corduroy, bridge, and wagon delays. One soldier’s route only. | https://dlg.usg.edu/record/dlg_zlpd_ccp001 |
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
| RDS-43 | National Park Service, CWSAC, “Shepherdstown” | Federal institutional battle register / NPS CWSAC | Porter’s V Corps crossed the Potomac at Boteler’s Ford on 19-20 Sept. 1862; exact ford and dates, but not Lee’s preceding retreat direction. | https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=wv016 |
| RDS-44 | Jonathan A. Noyalas, “Shepherdstown, Battle of,” Encyclopedia Virginia | Virginia Humanities scholarly history / Encyclopedia Virginia | Lee’s Army of Northern Virginia crossed from Maryland into Virginia at Boteler’s Ford on the night of 18 Sept.; Union V Corps crossed toward Virginia on 19-20 Sept. and returned to Maryland. | https://encyclopediavirginia.org/entries/shepherdstown-battle-of/ |
| RDS-45 | Charles W. Snell, *Harpers Ferry Repels an Attack and Secures the Major Base of Operations for Sheridan’s Army, July 4, 1864-July 17, 1865* (1960), National Park Service | Federal historical study using primary records / Snell-NPS | B&O reconstruction to Martinsburg, the macadamized wagon road south from Martinsburg, proposed Winchester rail extension, and Oct.-Nov. 1864 wagon-train supply activity; does not identify one Harpers Ferry road crossing. | https://npshistory.com/publications/hafe/fed-fortifications.pdf |
| RDS-46 | Ulysses S. Grant, *Personal Memoirs*, part 6 | Primary commander memoir / Grant | Sept. 1864 army-supply teams kept at Harpers Ferry for Sheridan’s Winchester operation; no exact team route or Potomac crossing method. | https://gutenberg.org/cache/epub/5865/pg5865-images.html |
| RDS-47 | George Breck, wartime newspaper columns, chapter 7, New York State Military Museum | Primary artillery-officer correspondence / Breck-NYSM | 29-30 May 1862 Harpers Ferry bridge retreat; bridge washed out by 7 June; about sixty commissary/quartermaster teams arrived at Harpers Ferry from Winchester on 6 June, loaded there on 7 June, and returned through Charles Town and Berryville on 7-8 June over a gravelled and macadamized turnpike. Breck crossed the flooded river by skiff, but he does not say the teams crossed it. | https://museum.dmna.ny.gov/unit-history/artillery/1st-artillery-regiment-light/battery-l-1st-artillery-regiment-light/battery-l-1st-artillery-regiment-light-george-breck-columns-chapter-7 |
| RDS-48 | Edward Smith, *Historic Resource Study: Williamsport, Maryland* (1979), National Park Service | Federal historical study using primary records / Smith-NPS | Most of Banks’s army crossed into Maryland at Williamsport on 26 May 1862, apparently by ferry followed by the canal bridge; does not assign one method to every wagon or train. | https://npshistory.com/publications/choh/williamsport-hrs.pdf |
| RDS-49 | William T. Sherman, *Major-General Sherman’s Reports* (1865) | Primary official commander report / Sherman | Separate Jan.-Feb. 1865 corps routes, Union Causeway flooding, Sisters Ferry, Rivers/Beaufort/Binnaker/Holman/Kew/Guignard/Shilling crossings, State and Orangeburg-Edgefield roads, bridge repair, swamp, and mud limits. | https://upload.wikimedia.org/wikipedia/commons/c/c3/Major-General_Sherman%27s_reports_%28IA_majorgeneralsher00sher%29.pdf |
| RDS-50 | U.S. War Department, *Official Records*, Series I, vol. 47, parts I-II | Primary subordinate reports, itineraries, and orders / Official Records | Howard independently reports Force's pontoon crossing below Orangeburg Bridge and Giles Smith's repair of the main bridge. Fourth Division itinerary and parallel orders corroborate broad Robertsville-Lawtonville and Cheraw-Laurel Hill routes, but not Platter's whole handling chains; separate columns remain separate. | https://archive.org/details/warofrebellion014701rootrich ; https://archive.org/details/warofrebellion014702rootrich |
| RDS-51 | Mark L. Bradley, *The Civil War Ends, 1865*, U.S. Army Center of Military History | Federal professional-military history / Army CMH | Broad Carolinas rain, swamp, corduroy, artillery, and wagon constraints; not a substitute for exact unit intervals. | https://history.army.mil/portals/143/Images/Publications/catalog/75-17.pdf |
| RDS-52 | National Park Service, CWSAC, “Plains Store” | Federal institutional battle register / NPS CWSAC | Augur advanced from Baton Rouge toward the Plains Store/Bayou Sara road intersection on 21 May 1863; the operation did not start at New Orleans. | https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=LA009 |
| RDS-53 | U.S. Senate, *Relief of Telegraph Operators Who Served in the War of the Rebellion*, S. Doc. 251 (1904), reproducing War Department reports | Federal compilation of primary official reports / War Department-Senate | Department of the Gulf reports distinguish New Orleans communication from marches beginning at Baton Rouge or Brashear City toward Port Hudson and Bayou Teche; they do not prove a New Orleans-origin road march. | https://www.govinfo.gov/content/pkg/SERIALSET-04592_00_00-007-0251-0000/pdf/SERIALSET-04592_00_00-007-0251-0000.pdf |
| RDS-54 | Texas Historical Commission, “Marshall-Shreveport Stagecoach Road” marker record | State historical-marker record / THC | Exact civilian stage-road identity, Marshall-Waskom-Shreveport direction, dirt and rain limits, and continued Civil War stage service; no dated military wagon or army passage. | https://atlas.thc.texas.gov/Details/5203010197 |
| RDS-55 | Texas State Library and Archives Commission, “1864: No Way Out, continued” | State archival exhibition / TSLAC | The Union plan targeted Shreveport, Marshall, and Jefferson, but Banks was stopped at Mansfield/Pleasant Hill and retreated; no completed Union road movement to Shreveport. | https://www.tsl.texas.gov/exhibits/civilwar/1864_2.html |
| RDS-56 | Missouri Department of Natural Resources, Arrow Rock State Historic Site map, “Pierre A Fléche Trail” | State-site interpretive history / Missouri DNR | Boonville-Arrow Rock Road identity and Sterling Price’s eastbound 14 Oct. 1864 army passage toward Glasgow; one claim-specific family. | https://mostateparks.com/sites/g/files/zuston361/files/media/pdf/2024/11/ArrowRock_HSMap.pdf |
| RDS-57 | State Historical Society of Missouri, “Transportation Research Guide” | State historical-society research guide / SHSMO | Wire/Springfield/Telegraph Road naming and broad St. Louis-southwest Missouri reach; no dated claim-specific St. Louis-Rolla military road passage. | https://shsmo.org/research/guides/transportation |
| RDS-58 | Ralph A. Wooster and Brett J. Derbes, “Civil War,” Handbook of Texas Online | State scholarly synthesis / TSHA | Galveston-Houston-Henderson Railroad dependence and Magruder’s 1 Jan. 1863 railroad-bridge movement; no Houston-Galveston wagon-road identity. | https://www.tshaonline.org/handbook/entries/civil-war |
| RDS-59 | Texas Historical Commission, “Civil War Fortifications at Virginia Point” marker record | State historical-marker record / THC | The railroad bridge was the only mainland-Galveston connection and carried Magruder’s force on 31 Dec. 1862-1 Jan. 1863; it is negative road evidence, not a road crossing. | https://atlas.thc.texas.gov/Details?atlasnumber=5167008233&fn=print |
| RDS-60 | Charles D. Collins Jr., *Battlefield Atlas of Price's Missouri Expedition of 1864* (2016), U.S. Army Combat Studies Institute | Federal professional-military study / Collins-Army | On 14 Oct. 1864 Price detached John B. Clark's brigade plus 500 of Jackman's brigade to cross the Missouri at Arrow Rock and attack Glasgow while the main army moved west toward Marshall. It does not independently name the Boonville-Arrow Rock Road or place that detachment on the road from Boonville. | https://purl.fdlp.gov/GPO/gpo74005 |
| RDS-61 | U.S. War Department, *Official Records*, Series I, vol. 12, pt. 3 | Primary official correspondence / Official Records | Banks's 6 June 1862 Winchester dispatch expected a steam tug at Harpers Ferry to replace the washed-away bridge and separately discussed trains crossing at Williamsport; it does not assign Breck's sixty teams a river crossing or corroborate their exact road movement. | https://archive.org/details/3warofrebellion12secrrich |
| RDS-62 | U.S. Congress, *Report of the Joint Committee on the Conduct of the War: Red River Expedition* (1865) | Federal investigative report reproducing primary testimony and records / Joint Committee | The Red River land column concentrated at Franklin and Berwick Bay and began from Franklin in March 1864. Cavalry later came up from New Orleans and Banks traveled from New Orleans to Alexandria, but neither fact is a New Orleans-origin army road operation. | https://archive.org/details/cu31924096461599 |
| RDS-63 | U.S. War Department, *Official Records*, Series I, vol. 34, parts I-II | Primary official reports, correspondence, and orders / Official Records | Banks's Natchitoches-Mansfield approach, the road fork toward Marshall or Shreveport, and Confederate Shreveport-Keachi-Mansfield movement are exact; no report places a dated army or military-wagon passage on the separate Marshall-Shreveport Stagecoach Road. | https://archive.org/details/warofrebellion013401rootrich |
| RDS-64 | U.S. War Department, *Official Records*, Series I, vol. 15 | Primary official reports and correspondence / Official Records | The 1862 Galveston evacuation and 1863 recapture used the railroad, railroad bridge, locomotives, and trains. A declined proposal for civilian subsistence transfer by vehicles from Eagle Grove does not establish a Houston-Galveston military road row. | https://archive.org/details/warofrebellion15unit |
| RDS-65 | *History of Cooper County, Missouri* (1876) | Nineteenth-century county history / Cooper County history | On 16 Sept. 1861 Eppstein's battalion was ordered to guard the Lamine River bridge “on the road from Boonville to Arrow Rock”; this independently fixes the road and a dated military bridge action, but not Price's 14 Oct. 1864 passage. | https://archive.org/details/cu31924028846463 |

## 4. Candidate road-node register

The register contains **37 nodes**. `D503 mapping` is evidentiary bookkeeping, not a
new spatial boundary. `Unassigned` means the named endpoint cannot be attached to a
D503 anchor without a later law decision.

| Node | Period endpoint / type | D503 mapping | Dated role and limitation | Sources |
|---|---|---|---|---|
| RD-N01 | Washington, D.C.; capital, depot, road origin | CT-01; RN-02/WN-24 | Union throughout; local encircling military roads do not themselves reach Manassas. | RDS-01, RDS-22 |
| RD-N02 | Alexandria, Virginia; town, port/rail/road interchange | CT-03; RN-03 | Union-held from May 1861; eastern end of the turnpike approach. | RDS-01, RDS-02, RDS-03 |
| RD-N03 | Centreville, Virginia; turnpike junction/locality | CT-03 | July 1861 and Aug. 1862 approach; no independent strategic owner. | RDS-01, RDS-03 |
| RD-N04 | Manassas Junction/Stone House crossroads; rail-road junction | CT-03; RN-04 | Turnpike/Sudley military use in 1861-62. | RDS-01, RDS-02, RDS-03 |
| RD-N05 | Harpers Ferry; depot, rail/canal/river/road crossing area | CT-02; RN-05 | Crossing and supply functions changed with control. The 1862 bridge, June flood loss, and 1864 wagon base do not form one permanent Potomac road crossing. | RDS-04, RDS-07, RDS-45, RDS-46, RDS-47 |
| RD-N06 | Winchester; Valley Pike town/depot | CT-04 | Repeated army movement 1862-64, including commissary/quartermaster wagon movement from Harpers Ferry. | RDS-04, RDS-05, RDS-07, RDS-45, RDS-46, RDS-47 |
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
| RD-N25 | Shreveport; river/road depot and Trans-Mississippi headquarters | CT-34; RN-29/WN-19 | Intended Red River campaign objective; the 1864 Union operation did not reach it. Confederate Shreveport-Keachi movement does not establish the Marshall road. | RDS-18, RDS-19, RDS-63 |
| RD-N26 | Marshall, Texas; road/rail supply center | CT-35; RN-30 | Wartime supply-center status and a civilian stage road toward Shreveport are supported; the 1864 road fork toward Marshall is separate, and an exact military passage on the named Marshall-Shreveport road is not proved. | RDS-21, RDS-54, RDS-55, RDS-63 |
| RD-N27 | Martinsburg, Virginia/West Virginia; pike town and depot | Unassigned | Banks passed north from Winchester on 25 May 1862; the town is not an assigned D503 anchor. | RDS-23, RDS-24 |
| RD-N28 | Williamsport, Maryland; Potomac crossing | Unassigned | Banks’s column crossed northward on 25-26 May 1862, most of the army apparently by ferry and canal bridge; the train’s exact method remains unresolved. This crossing cannot substitute for Harpers Ferry or Shepherdstown/Boteler’s Ford. | RDS-23, RDS-24, RDS-48 |
| RD-N29 | Meridian, Mississippi; rail-road objective and junction | CT-27; RN-26 | Sherman reached it from Vicksburg/Jackson in Feb. 1864 and returned in late Feb.-early Mar.; the operation was destructive, not routine service. | RDS-30, RDS-31 |
| RD-N30 | St. Louis/Jefferson Barracks; Missouri depot and northern Wire-Road context | CT-29 | Federal depot/telegraph origin; sources differ on the named Wire Road’s northern extent and no dated St. Louis-Rolla military road passage is proved. | RDS-38, RDS-39, RDS-57 |
| RD-N31 | Rolla, Missouri; railhead and wagon-supply base | CT-30 | Union southwest-Missouri supply base in 1861-65; the exact named road to Springfield remains unresolved. | RDS-39, RDS-40 |
| RD-N32 | Springfield/Wilson’s Creek, Missouri; road junction and military base | CT-30; BATTLE-WILSONS-CREEK | Wire/Military Road troop and supply use is exact south of Springfield; northern naming remains inconsistent. | RDS-38, RDS-40 |
| RD-N33 | Fayetteville-Fort Smith approach, Arkansas; Wire/Military Road limit | Unassigned | Southern road limit for documented Missouri-Arkansas military use; it creates no CT-30-to-CT-32 connection. | RDS-38 |
| RD-N34 | Shepherdstown/Boteler’s Ford; Potomac ford and battle locality | Unassigned | Lee’s army crossed Maryland-to-Virginia on 18 Sept. 1862; Porter’s V Corps crossed toward Virginia on 19-20 Sept. and withdrew to Maryland. The ford is not Harpers Ferry or Williamsport. | RDS-43, RDS-44 |
| RD-N35 | Boonville, Missouri; Missouri River road origin | Unassigned (CT-29 theater coverage only; no D503 anchor) | The road identity and a separate 1861 Lamine River bridge action are exact. Missouri DNR attributes Price's 14 Oct. 1864 eastbound passage to this road, while the Army atlas fixes the detached force and Arrow Rock order but not its Boonville origin. | RDS-56, RDS-60, RDS-65 |
| RD-N36 | Arrow Rock, Missouri; Missouri River road waypoint/landing town | Unassigned (CT-29 theater coverage only; no D503 anchor) | Clark's brigade plus 500 of Jackman's brigade was ordered to cross the Missouri here on 14 Oct. 1864 and attack Glasgow. The crossing is operation-specific; road and river modes remain separate. | RDS-56, RDS-60 |
| RD-N37 | Glasgow, Missouri; target beyond the exact road segment | Unassigned (CT-29 theater coverage only; no D503 anchor) | The 14 Oct. 1864 detached-force objective lay beyond Arrow Rock; neither source proves that the named Boonville-Arrow Rock Road continued to Glasgow. | RDS-56, RDS-60 |

## 5. Candidate road-edge and service-evidence register

The register contains **18 candidates: 14 Verified, 4 Inferred, 0 Disputed**. These
are research rows, not authorized services. `Eligibility` states only what a later
read-only substrate could consider after curing the stated gap.

| ID | Exact endpoints; CT refs | Period identity; direction; dated use | Evidence scope | Surface, crossing, season, obstruction, and interchange limits | Provenance / independent families | Eligibility |
|---|---|---|---|---|---|---|
| RD-E01 | RD-N02 Alexandria—RD-N04 Manassas; CT-03 internal (Washington context CT-01 remains outside the edge) | Fauquier and Alexandria/Warrenton Turnpike via Centreville; physical bidirectionality, military use July 1861 and Aug. 1862 | Full named turnpike segment within CT-03; not a CT-01→CT-03 service | Macadam turnpike near Manassas; Bull Run/Sudley crossings and local battle control vary; road-rail at RN-03/RN-04 | **Verified**: Corbett map RDS-01 + NPS Manassas RDS-02/RDS-03 | Candidate physical segment only |
| RD-E02 | RD-N06 Winchester—RD-N07 Strasburg/Cedar Creek; CT-04 internal | Valley Turnpike/Valley Pike; bidirectional physical road; army use May-June 1862 and Oct. 1864 | Full named local pike segment | Macadamized; Cedar Creek bridge repeatedly burned/rebuilt; road speed in one campaign is not capacity | **Verified**: Hotchkiss RDS-04 + NPS Cedar Creek RDS-05/RDS-06 | Candidate physical segment only |
| RD-E03 | RD-N06 Winchester—RD-N27 Martinsburg—RD-N28 Williamsport; CT-04 to unassigned Potomac endpoint | Martinsburg Pike; northbound army, train, and wagon retreat, 25-26 May 1862 | Exact one-way operation-specific passage | Twenty-two miles Winchester-Martinsburg, then north to Williamsport. Banks ordered trains ahead; most of the army apparently crossed by ferry and canal bridge, but no source assigns that method to every wagon. Williamsport is not RD-N05 Harpers Ferry. | **Verified**: primary Banks report RDS-23 + Virginia DHR RDS-24; method limit RDS-48 | Operation evidence only; ineligible as a CT edge while the crossing remains unassigned |
| RD-E04 | RD-N08 Stony Creek Station—Dinwiddie Court House—RD-N09 Petersburg; unassigned→CT-06 | Cross roads to Dinwiddie Court House, then north on Boydton Plank Road; northbound Confederate military-supply wagons after Aug. 1864 | Exact operation-specific rail-road bypass | Stony Creek is the off-load point; the road transfer was roughly thirty miles and remained contested, inefficient, and subject to winter rail damage; no reverse or war-long service | **Verified**: NPS RDS-08/Army CMH RDS-09 + Virginia DHR RDS-25/Encyclopedia Virginia RDS-26 | Candidate operation passage only; endpoint is deliberately unassigned rather than mis-mapped to RN-10 |
| RD-E05 | RD-N10 Atlanta—RD-N11 Savannah; CT-14→CT-12 (no intermediate CT assignment claimed) | Sherman’s March to the Sea corps routes; one-way operation Nov.-Dec. 1864 | Full operation-specific army passage, multiple parallel routes | Not one road; official routes divide, cross rivers, and damage infrastructure; the operation supplies no routine reverse service or reusable interval | **Verified**: official War Department map RDS-10 + NPS RDS-11 | Operation evidence only; never a reusable edge |
| RD-E06 | RD-N11 Savannah—RD-N13 Goldsboro via RD-N12 Columbia; CT-12 plus unassigned endpoints | Sherman’s Carolinas march; one-way operation 28 Jan.-23 Mar. 1865 | Full operation-specific passage, but endpoint-to-CT mapping incomplete | The `RD-SI*` register keeps corps routes, crossings, ferries, causeways, road names, and dates separate. Platter remained in camp on 5 Mar.; rain and heavy roads limited his column on 8-9 Mar. Columbia and Goldsboro remain outside the closed D503 anchors. | **Verified**: official War Department map RDS-10 + Sherman report RDS-49; interval families RDS-27, RDS-28, RDS-29, RDS-50, RDS-51 | Operation evidence only; unassigned nodes are omitted rather than guessed |
| RD-E07 | RD-N14 Bruinsburg—RD-N17 Jackson via RD-N15/RD-N16; CT-25→CT-26 | Grant’s eastward Vicksburg-campaign advance; one-way, 30 Apr.-14 May 1863 | Full operation-specific passage assembled from dated campaign legs | Landing is separate; roads diverged from the old Natchez Trace toward Raymond; no standing ferry or service | **Verified**: Army CMH RDS-14 + Coast Survey RDS-15 + NPS RDS-16 | Operation evidence only |
| RD-E08 | RD-N17 Jackson—RD-N19 Vicksburg via RD-N18; CT-26→CT-25 | Jackson/Champion Hill/Raymond/Jackson-road westward campaign passage; one-way, 15-17 May 1863 | Full operation-specific return axis | Multiple parallel roads; Bakers Creek bridge/road condition and a prior cloudburst changed the route; rail remains separate | **Verified**: RDS-14 + RDS-15 + RDS-17 | Operation evidence only |
| RD-E09 | RD-N20 Little Rock—RD-N21 Camden; CT-32 internal | Military Road from Little Rock through Benton and Arkadelphia, then the Washington-Camden Road; southbound 23 Mar.-15 Apr. 1864 and northbound retreat 26 Apr.-3 May | Exact operation-specific campaign passage | Ouachita and Saline crossings, horrible roads, rain, mud, pontoon work, and Jenkins’ Ferry bound the operation; it is not a standing Little Rock-Shreveport road | **Verified**: Sommer-NARA engineer map RDS-42 + Encyclopedia of Arkansas RDS-32 | Operation evidence only |
| RD-E10 | RD-N23 Alexandria—RD-N24 Mansfield/Pleasant Hill; CT-33 to unassigned endpoint | Red River Campaign army/wagon approach; northwest then southeast retreat, Mar.-Apr. 1864 | Full operation-specific passage to the battle corridor, not Shreveport | Road columns, rain/mud, congestion, river separation, and defeat bounded the operation; no Shreveport completion | **Verified**: Army University Press RDS-18 + Venable map RDS-19 | Operation evidence only; terminal CT unresolved |
| RD-E11 | RD-N26 Marshall—RD-N25 Shreveport; CT-35→CT-34 | Marshall-Shreveport Stagecoach Road via the Waskom direction; civilian bidirectionality and stage service continued during the Civil War | Named civilian route and wartime stage service; military use unresolved | Dirt road was often impassable in rain. The source's comparison to a later highway is excluded. Official Records fix military movement on the Natchitoches-Mansfield-Keachi-Shreveport approach and a separate fork toward Marshall, not a dated army/wagon passage, crossing set, or direction on this named road. | **Inferred**: route and civilian service RDS-54; military context RDS-21/RDS-55 and route-separation evidence RDS-63 do not carry the exact road claim | Ineligible until a claim-specific military family and independent corroboration resolve |
| RD-E12 | RD-N21 Camden—RD-N22 Pine Bluff via Camden-Pine Bluff Road/Marks’ Mills and Warren Road junction; CT-32 internal | Eastbound supply-wagon movement, 25 Apr. 1864; a westbound convoy had reached Camden 20 Apr. | Exact operation-specific supply passage | Several-hundred-wagon train, muddy Moro Bottoms, escort/security, and capture at Marks’ Mills prove a dated route, not permanence or safe return | **Verified**: primary Official Records RDS-33 + Encyclopedia of Arkansas RDS-34 | Operation evidence only |
| RD-E13 | RD-N19 Vicksburg—RD-N17 Jackson—RD-N29 Meridian; CT-25→CT-26→CT-27 | Sherman’s Meridian Expedition; eastbound 3-14 Feb. 1864 and westbound return by 3 Mar. | Full operation-specific army passage with mapped endpoints/dates | Multiple columns and railroad-destruction objectives; the route does not establish a named permanent road, New Orleans continuation, or routine bidirectionality | **Verified**: Army CMH RDS-30 + NPS RDS-31 | Operation evidence only |
| RD-E14 | RD-N32 Springfield/Wilson’s Creek—RD-N33 Fayetteville/Fort Smith approach; CT-30 to unassigned endpoint | Wire Road/Military Road; physical bidirectionality and troop/supply use, 1861-65 | Named military-road segment/family south of Springfield | Exact traces and bridges varied; the southern endpoint lies outside the D503 anchor set and the row cannot be extended to Little Rock | **Verified**: NPS military-use history RDS-38 + Lloyd wartime road map RDS-39 | Candidate physical segment only; no CT-30→CT-32 edge |
| RD-E15 | RD-N31 Rolla—RD-N32 Springfield; CT-30 internal | Union wagon-supply route from the Rolla railhead through Lebanon toward Springfield, especially Jan.-Feb. 1862 | Operation-specific supply corridor, exact road name unresolved | Army CMH fixes the base, direction, and campaign; NPS/period maps do not establish one stable named road, surface, or uninterrupted availability | **Inferred**: Army CMH RDS-40 + cartographic/context RDS-38/RDS-39 | Ineligible until the exact named route and claim-specific second family resolve |
| RD-E16 | RD-N34 Shepherdstown/Boteler’s Ford; unassigned Potomac crossing internal | Boteler’s Ford; Lee’s Army of Northern Virginia crossed Maryland-to-Virginia on the night of 18 Sept. 1862; Porter’s V Corps crossed toward Virginia on 19-20 Sept. and withdrew to Maryland | Exact ford, armies, dates, and directions for one campaign crossing sequence | Ford conditions and control changed during the action; no road extension to RD-N05 Harpers Ferry, RD-N28 Williamsport, or RD-N06 Winchester follows | **Verified**: NPS CWSAC RDS-43 + Encyclopedia Virginia RDS-44 | Operation evidence only; crossing remains unassigned and non-routine |
| RD-E17 | RD-N05 Harpers Ferry—RD-N06 Winchester via Charles Town and Berryville; CT-02→CT-04 | Gravelled/macadamized turnpike; about sixty Union commissary and quartermaster teams arrived northbound from Winchester on 6 June 1862, loaded on 7 June, and returned south on 7-8 June | Exact round-trip supply operation, with the load site bounded to Harpers Ferry rather than a specific riverbank | The bridge had washed away, and Breck personally crossed the flooded river by skiff. The teams approached from the Virginia-side road, however, and no source says they crossed the Potomac or needed to do so; their exact loading-side/depot handling is unspecified. A projected steam tug and separate 1864 supply evidence do not cure the claim-specific second-family gap. | **Inferred**: exact operation RDS-47 only; bridge context RDS-61 and separate corridor context RDS-45/RDS-46 do not corroborate the team movement | Ineligible until exact loading-side handling and a claim-specific second family resolve |
| RD-E18 | RD-N35 Boonville—RD-N36 Arrow Rock; Unassigned→Unassigned (CT-29 historical coverage only) | Boonville-Arrow Rock Road; Missouri DNR attributes an eastbound 14 Oct. 1864 Price-army passage toward Glasgow, while the Army atlas specifies Clark's brigade plus 500 of Jackman's brigade as the detached force ordered to cross at Arrow Rock | Exact road identity and one-family attribution of the 1864 named-road passage. The Army atlas independently corroborates the date, detachment, Arrow Rock crossing order, and Glasgow target, but not travel on the named road or a Boonville origin. | The 1864 surface and pre-Arrow Rock crossing set remain unresolved. The road's Lamine River bridge had separate military use in 1861; that does not prove the 1864 passage. Arrow Rock's operation-specific river crossing creates no permanent water interchange, and Glasgow is a target beyond—not an endpoint of—the named road. | **Inferred**: exact 1864 named-road passage RDS-56 only; RDS-60 carries the detached-force operation and RDS-65 the road/1861 bridge, not a second claim-specific 1864 passage family | Ineligible until a claim-specific 1864 second family and D503 endpoint law resolve |

### 5.1 D509/D511 Potomac crossing and Winchester-approach register

These six rows prevent site, date, direction, crossing method, and train evidence from
being merged. A `Verified` row corroborates only the stated operation. An `Inferred`
row remains one-family or crossing-incomplete evidence.

| ID | Date; force; direction | Exact road, approach, or crossing | Method and army/train/wagon use | Provenance / limit |
|---|---|---|---|---|
| RD-P01 | 29-30 May 1862; Union Harpers Ferry garrison and Battery L; Virginia/Bolivar side to Maryland Heights | Harpers Ferry streets to the then-current bridge and Maryland Heights road | Infantry, civilians, teams, horses, guns, and caissons crossed; artillery horses were led singly and carriages drawn by hand | **Inferred**: Breck RDS-47 only; exact operation, no permanence |
| RD-P02 | 25-26 May 1862; Banks’s army with trains in advance; Winchester north through Martinsburg to Williamsport and Maryland | Martinsburg Pike to RD-N28 Williamsport | Most of the army apparently used the ferry and then the canal bridge; no source assigns that method to every train wagon | **Verified**: RDS-23/RDS-24; method limit RDS-48; same claim as RD-E03 |
| RD-P03 | 6-8 June 1862; about sixty Union commissary/quartermaster teams; Winchester north to Harpers Ferry, then loaded return south | Turnpike through Berryville and Charles Town | Gravelled/macadamized road carried the teams in both directions. They approached Harpers Ferry from the Virginia side; Breck's personal skiff passage and the lost bridge do not prove or require a team Potomac crossing. The exact loading-side handling remains unspecified. | **Inferred**: exact team operation RDS-47 only; RDS-61 supplies bridge context, not a second team-movement family; same claim as RD-E17 |
| RD-P04 | Night 18 Sept. and 19-20 Sept. 1862; Lee’s Army of Northern Virginia and Porter’s V Corps; Maryland-to-Virginia, then Union crossing and withdrawal | RD-N34 Boteler’s Ford, one mile south of Shepherdstown | Named ford; Lee’s army retreated through it, Union detachments crossed toward Virginia, and survivors returned to Maryland | **Verified**: RDS-43/RDS-44; same claim as RD-E16 |
| RD-P05 | 15, 24, and 25 June 1863; Ewell’s Second, Hill’s Third, and Longstreet’s First Corps; northward Virginia-to-Maryland invasion | Ewell divided between Williamsport and Shepherdstown; Hill used Boteler’s Ford; Longstreet used Williamsport | Boteler’s is a named ford. The source does not assign a method at Williamsport, distribute Ewell’s trains between sites, or join the crossings. | **Inferred**: NPS chronology RDS-07 only |
| RD-P06 | Sept.-Nov. 1864; Sheridan’s army supply trains; Harpers Ferry and Martinsburg south toward Winchester/Valley and returning north | Separate Harpers Ferry and Martinsburg depot origins; macadamized wagon road south from Martinsburg | Teams were kept at Harpers Ferry in September; large wagon trains used both origins in Oct.-Nov. The sources do not prove one Harpers Ferry-Martinsburg-Winchester road or a Potomac road-crossing method. | **Verified supply-system context, Inferred road interval**: RDS-45/RDS-46 |

The register therefore resolves Boteler’s Ford and several dated Harpers Ferry or
Williamsport operations. The June 1862 evidence does not require a team Potomac
crossing, but it leaves the Harpers Ferry loading-side handling, the 1863
Williamsport methods, and the 1864 depot-to-road joins unassigned.

### 5.2 D509/D511 Sherman Georgia/Carolinas interval register

The thirteen rows below retain each corps, wing, cavalry, or participant column. They
are subordinate evidence for RD-E06, not candidate services or a composed route.

| ID | Date; column; direction | Exact interval or crossing | Surface, weather, obstruction, bridge/ferry, and train limit | Provenance / status |
|---|---|---|---|---|
| RD-SI01 | 19 Jan.-first week Feb. 1865; Slocum’s left wing and Kilpatrick; Savannah north to Sisters Ferry/east bank | Union Causeway attempt, then upstream to Sisters Ferry | Causeway was repaired and corduroyed, but January rain broke the pontoon and left it four feet under water. Sisters Ferry’s river and overflow were nearly three miles wide; two XX Corps divisions and cavalry crossed before the whole wing completed passage. | **Verified**: Sherman report RDS-49 + Colehour diary RDS-29 |
| RD-SI02 | 31 Jan.-3 Feb.; XVII Corps; Pocotaligo north/up the Salkehatchie to Rivers Bridge | Rivers Bridge/Salkehatchie approach and crossing | Confederate obstructions included felled trees, burned bridges, and a blocked causeway. Mower and Giles A. Smith crossed nearly three miles of knee-to-shoulder-deep swamp below the bridge and turned the position. | **Verified**: Sherman report RDS-49 + NPS Rivers Bridge RDS-28 |
| RD-SI03 | 31 Jan.-3 Feb.; XV Corps; Pocotaligo north by an inland parallel route | Hickory Hill-Loper’s Crossroads-Anglesey Post Office-Beaufort Bridge | Pioneers removed felled trees and rebuilt bridges; the corps reached Loper’s Crossroads by 2 Feb. and was assigned Beaufort Bridge, separate from XVII Corps at Rivers Bridge. | **Verified**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI04 | 2-8 Feb.; Williams’s two XX Corps divisions; Sisters Ferry east bank toward the South Carolina Railroad | Lawtonville-Allendale-Beaufort Bridge-Graham’s Station | Flood-delayed column received a distinct route and reached Graham’s Station on 8 Feb.; no Platter or XV Corps interval is substituted. | **Verified**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI05 | 2-10 Feb.; Kilpatrick’s cavalry; Sisters Ferry area toward Blackville | Barnwell route to Blackville, then toward Aiken | Cavalry crossed on pontoons by 2 Feb. and moved by Barnwell; this is not the XX Corps Lawtonville route or either right-wing bridge approach. | **Verified**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI06 | 5-11 Feb.; Corse’s Fourth Division, XV Corps, separated rear column; Robertsville north toward Orangeburg | Robertsville-Lawtonville-Hickory Hill/Coosawhatchie-Whippy Swamp-Graham’s Station-burned Buford Bridge-unnamed South Edisto ferry-Orangeburg Road | Ax work, heavy rain, corduroy, a swamp bridge, and a delayed supply train bound the route. Platter names no South Edisto ferry, so it cannot be assigned to Binnaker’s, Holman’s, Kew, or Guignard’s. | **Inferred**: Platter RDS-27; the Fourth Division itinerary in RDS-50 corroborates the broad route only, not the burned bridge, unnamed ferry, or whole handling chain |
| RD-SI07 | 11-12 Feb.; XVII Corps; South Edisto north/east toward Orangeburg | Binnaker’s Bridge to Orangeburg | Corps-specific crossing and direct Orangeburg movement; it is not XV Corps at Holman’s Bridge. | **Verified**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI08 | 11-12 Feb.; XV Corps; South Edisto north toward Poplar Springs | Holman’s Bridge to Poplar Springs | Supporting route remained separate from XVII Corps and from the left-wing/cavalry crossings. | **Verified**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI09 | 11-12 Feb.; left wing and cavalry; South Edisto toward the Orangeburg-Edgefield Road | Kew and Guignard’s Bridges to Orangeburg-Edgefield Road holding point | The official report preserves two named crossings but does not distribute every left-wing or cavalry unit between them. | **Verified bounded order**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI10 | 12 Feb.; XVII Corps; into Orangeburg | Orangeburg Bridge, with Force’s division crossing by pontoon about two miles below | Enemy partially burned the bridge; one division crossed below by pontoon, then Giles Smith's division took and repaired the main bridge for the corps. No other corps inherits this method. | **Verified exact handling**: Sherman report RDS-49 + Howard's independent subordinate report in RDS-50 |
| RD-SI11 | 13-15 Feb.; XVII Corps; Orangeburg north toward Columbia | State Road | The report identifies the corps road but supplies no reusable surface or bridge condition for the full interval. | **Verified bounded route**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI12 | 13-15 Feb.; XV Corps; Poplar Springs north toward Columbia | Shilling’s Bridge over North Edisto, country road to State Road at Zeigler’s, then Little Congaree Bridge | Fresh-overflow mud impeded the Little Congaree approach; the partially burned bridge required repair before artillery passage. The route joins the State Road only at Zeigler’s. | **Verified**: Sherman report RDS-49 + official route map RDS-10 |
| RD-SI13 | 5 and 8-9 Mar.; Platter’s Fourth Division XV Corps column; Cheraw toward Fayetteville | 5 Mar. camp while XVII Corps crossed Great Pee Dee; 8 Mar. Laurensburgh Road; 9 Mar. alternate road through Laurel Hill toward Juniper Creek Swamp | The 5 Mar. entry records no heavy-road march. Rain and cut-up roads blocked the Laurensburgh objective on 8 Mar.; on 9 Mar. treacherous road, attempted corduroy, a broken bridge, and slow wagons stretched the division over miles. | **Inferred**: Platter RDS-27; the Fourth Division itinerary in RDS-50 corroborates Cheraw-Laurel Hill-Juniper Creek only, not the 8-9 Mar. handling details; broad RDS-51 context is not claim-specific |

## 6. Explicit non-link register

The register contains **11 non-links**. Each is binding on this packet even where a
candidate row records narrower physical passage.

| ID | Endpoints / territories | Explicit non-link or prohibited inference | Evidence |
|---|---|---|---|
| RD-NL01 | RD-N01—RD-N04; CT-01→CT-03 | Washington’s local military-road system and Alexandria-Manassas turnpike evidence do not establish one continuous Washington-Manassas road service or an automatic Potomac crossing. | RD-E01; RDS-01, RDS-22 |
| RD-NL02 | RD-N05—RD-N07; CT-02→CT-04 | Valley Pike evidence does not complete a Harpers Ferry-Strasburg edge. RD-E03 and RD-E17 prove different 1862 operations on different approaches; neither supplies a reusable through edge. | RD-E02, RD-E03, RD-E17 |
| RD-NL03 | RD-N05/RD-N28/RD-N34 crossing areas; CT-02 plus unassigned | Williamsport, Shepherdstown/Boteler’s Ford, and Harpers Ferry are distinct endpoints. RD-E16 resolves Boteler’s Ford and RD-E03 resolves one Williamsport operation, but neither supplies a timeless crossing, Harpers Ferry substitution, or crossing join. | RD-E03, RD-E16, RD-E17; RD-P01 through RD-P06 |
| RD-NL04 | RD-N08—RD-N09; unassigned→CT-06 | The Stony Creek-Dinwiddie-Boydton bypass is not war-long, routine, or bidirectional. Resolving Stony Creek proves that it is not RN-10 Weldon and cannot be mapped to CT-09 by convenience. | RD-E04 |
| RD-NL05 | RD-N10—RD-N11—RD-N13; CT-14/12 and unassigned | Sherman’s divided corps marches do not create one permanent Atlanta-Savannah-Goldsboro road, a reverse service, or adjacency through Columbia. The RD-SI rows remain separate; D503’s closed anchor set leaves Columbia and Goldsboro omitted. | RD-E05, RD-E06; RD-SI01 through RD-SI13; D503 |
| RD-NL06 | RN-12 Louisville—RN-13 Nashville—RN-14 Chattanooga; CT-18→CT-20→CT-21 | The Louisville-Nashville turnpike was real and militarily used, while the mapped Nicholasville-Chattanooga “Great National Military Road” was proposed. Neither establishes a completed parallel Louisville-Nashville-Chattanooga through-road service. | RDS-13, RDS-36, RDS-37; existing CTS-R-11, CTS-R-12, CTI-03, and CTI-04 |
| RD-NL07 | New Orleans and RD-N14—RD-N19—RD-N29; CT-28 versus CT-25/26/27 | The May 1863 Vicksburg and Feb.-Mar. 1864 Meridian operations remain separate. Department of the Gulf evidence starts relevant road marches at Baton Rouge, Brashear City, Franklin, or Berwick Bay. New Orleans was a river/rail/telegraph base and a source of later-arriving cavalry or commander travel, not the origin of a qualifying army road operation toward the Mississippi interior. | RD-E07, RD-E08, RD-E13; RDS-30, RDS-31, RDS-52, RDS-53, RDS-62 |
| RD-NL08 | RD-N20—RD-N21—RD-N22; CT-32 | Exact Little Rock-Camden and Camden-Pine Bluff operations do not compose a routine through service or establish Little Rock-to-Shreveport/Arkansas Post roads. | RD-E09, RD-E12; existing CTNL-08 and CTNL-18 boundaries |
| RD-NL09 | RD-N23—RD-N24—Shreveport; CT-33→CT-34 | Banks’s army reached Mansfield/Pleasant Hill and retreated. It did not complete the intended large-force road/river movement to Shreveport, and no Marshall endpoint follows from the plan. | RD-E10; RDS-18, RDS-19, RDS-55 |
| RD-NL10 | RD-N26 Marshall—RD-N25 Shreveport; CT-35→CT-34 | RDS-54 fixes a civilian stage road and wartime stage service. Official military movement on the Natchitoches-Mansfield-Keachi-Shreveport approach and its separate Marshall fork, supply-center proximity, the later-highway comparison, and mixed rail/lake context do not prove a dated military wagon passage, crossing set, service, or interchange on the exact Marshall-Shreveport road. | RD-E11; RDS-21, RDS-54, RDS-55, RDS-63; existing CTNL-05 |
| RD-NL11 | CT-29 Missouri River-St. Louis, CT-30 Missouri Ozarks, and CT-36 Houston-Galveston | RD-E18 remains an unassigned named-road segment below the two-family floor; it cannot be joined to St. Louis-Rolla rail or CT-30 Wire-Road rows. Its Arrow Rock crossing is operation-specific, not a water interchange, and Glasgow is only the target beyond the segment. CT-36 evidence identifies railroad movement and the Virginia Point railroad bridge; a declined civilian vehicle-transfer proposal cannot substitute for a Houston-Galveston military wagon road. | RD-E14, RD-E15, RD-E18; RDS-38, RDS-39, RDS-40, RDS-41, RDS-56, RDS-57, RDS-58, RDS-59, RDS-60, RDS-64, RDS-65; D503; existing CTNL-17, CTNL-18, and CTNL-16 |

## 7. Road/rail/water/ferry/depot interchange register

The register contains **10 interchange candidates**. Existing `RN`, `WN`, `CTS`,
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
| RD-I10 | RD-E17 at RD-N05 Harpers Ferry | RN-05/B&O plus canal, river, bridge, and depot context | 29-30 May 1862 bridge movement differs from the 6-8 June teams arriving from Winchester, loading, and returning after the bridge washed out; the teams' exact loading-side handling is unknown, and 1864 Harpers Ferry and Martinsburg depots remain separate origins | Inferred operation-specific transfer only; RDS-45, RDS-46, RDS-47, RDS-61; no team Potomac crossing or road-crossing service inferred |

## 8. Theater coverage

| D503 teaching theater | CTs | Result of this pass |
|---|---|---|
| Chesapeake Approaches | CT-01-04, CT-08 | The Potomac register separates Harpers Ferry, Williamsport, and Shepherdstown/Boteler’s Ford operations. Boteler’s Ford is Verified. The Harpers Ferry-Winchester supply row does not require a team Potomac crossing, but remains Inferred because the loading-side handling and claim-specific second family are missing. CT-08 has no strategic-road row. |
| Virginia Heartland | CT-05-07 | Stony Creek Station-Dinwiddie Court House-Boydton Plank Road is resolved as a dated bypass into Petersburg, but Stony Creek is outside the closed anchors; no Richmond-Lynchburg road service is established. |
| Atlantic Coast | CT-09-13 | Thirteen Sherman interval rows separate the wings, corps, cavalry, ferries, bridges, roads, and corrected 5/8-9 Mar. dates. RD-SI10's Orangeburg handling is now independently corroborated; RD-SI06 and RD-SI13 retain their one-family handling limits. All remain operation evidence; D503 requires Goldsboro/Columbia omission, and no Charleston/Port Royal road edge is proved. |
| Georgia-Alabama Interior | CT-14-17 | Atlanta-Savannah is operation-specific; no routine Atlanta-Macon-Savannah, Augusta, Montgomery, or Mobile road graph is established. |
| Ohio-Tennessee | CT-18-24 | The evidence confirms rail/river depots plus local wagon delivery, not a Louisville-Nashville-Chattanooga through road. No CT-19/22/23/24 road rows meet the floor. |
| Mississippi Spine | CT-25-28 | Two May 1863 rows plus the separate Feb.-Mar. 1864 Vicksburg-Jackson-Meridian operation are exact. The Red River land column also concentrated at Franklin/Berwick Bay, not New Orleans. New Orleans river, rail, telegraph, later-cavalry, and commander-travel evidence therefore supplies no New Orleans-origin army road continuation. |
| Trans-Mississippi | CT-29-36 | Little Rock-Camden and Camden-Pine Bluff remain exact and independently corroborated; CT-30 has bounded Wire/Military Road evidence. Boonville, Arrow Rock, and Glasgow remain unassigned under D503; the Inferred RD-E18 segment ends at Arrow Rock, with Glasgow only its target beyond. Marshall-Shreveport lacks exact military-road corroboration, Banks never completed Alexandria-Shreveport, and CT-36 remains rail/railroad-bridge evidence rather than a military road row. |

Coverage is broader and more exact than D509, but still not complete enough
to produce a referentially closed strategic road substrate.

## 9. Known gaps and unresolved claims

The six D511 research families adjudicate as follows:

1. **Harpers Ferry-Winchester, premise corrected but not promoted:** RDS-47 says the
   teams arrived at Harpers Ferry from Winchester, loaded, and returned over the
   Charles Town-Berryville turnpike. Because that approach remained on the Virginia
   side, the documented operation neither states nor requires a team Potomac crossing.
   RDS-61 independently confirms the bridge-loss context and a projected steam tug,
   but does not corroborate the sixty-team movement or locate its load handling.
   RD-E17 therefore remains Inferred; exact loading-side handling and a claim-specific
   second family remain missing.
2. **Boonville-Arrow Rock, force and endpoints corrected but not promoted:** RDS-60
   identifies Clark's brigade plus 500 of Jackman's brigade—not Price's main army—as
   the force ordered to cross at Arrow Rock and attack Glasgow on 14 October. It does
   not independently place that force on the named road from Boonville. RDS-65 fixes
   the road and its Lamine River bridge in a separate 1861 military action, not the
   1864 passage. RD-E18 therefore remains Inferred. Boonville, Arrow Rock, and Glasgow
   are unassigned because D503 supplies no anchor; the candidate ends at Arrow Rock,
   Glasgow remains only the target beyond it, and no water interchange is created.
3. **New Orleans origin, resolved negative for this pass:** RDS-62 places the Red
   River land-column concentration at Franklin and Berwick Bay and its start at
   Franklin. Later cavalry from New Orleans and Banks's own travel to Alexandria do
   not make the army road operation originate in New Orleans. Together with RDS-52
   and RDS-53, this leaves river, railroad, port, and telegraph connections separate;
   no candidate row was added.
4. **Marshall-Shreveport, route families kept separate:** RDS-54 fixes the named
   civilian stage road, Waskom direction, dirt surface, rain limit, and wartime stage
   service. RDS-63 fixes military movement along the Natchitoches-Mansfield-Keachi-
   Shreveport approach and a distinct fork toward Marshall, but does not put a dated
   force or military wagon train on the exact Marshall-Shreveport Stagecoach Road.
   RD-E11 remains Inferred. Banks's stopped and reversed Union operation remains
   bounded by RDS-18, RDS-19, and RDS-55.
5. **CT-36, rail boundary independently reinforced:** RDS-64's primary reports use
   railroad movement, the Virginia Point railroad bridge, locomotives, and trains for
   the Galveston operations. A declined civilian subsistence-transfer proposal by
   vehicles from Eagle Grove is not a military road passage. It reinforces RDS-58 and
   RDS-59 without producing a two-family CT-36 road row; no candidate was added.
6. **Sherman handling, one promotion and two retained limits:** Howard's independent
   subordinate report in RDS-50 corroborates Sherman's Force-division pontoon crossing
   below Orangeburg and Giles Smith's repair of the main bridge, promoting RD-SI10
   from Inferred to Verified. The Fourth Division itinerary corroborates only the
   broad paths behind RD-SI06 and RD-SI13, not Platter's exact bridge, ferry, corduroy,
   weather, or wagon-handling chains; those two remain Inferred. The thirteen-row
   register is now 11 Verified and 2 Inferred and still authorizes no reusable route.

D508’s statement that Platter encountered the cited rain/heavy-road limit on 5 March
was incorrect. His 5 March entry records a day in camp while XVII Corps crossed the
Great Pee Dee. He records the Laurensburgh Road limit on 8 March and the treacherous
road, attempted corduroy, broken bridge, and slow wagons on 9 March. D509 corrects
the date without broadening the claim beyond Platter’s column.

The final evidence pass changes no candidate-edge classification: RD-E11, RD-E15,
RD-E17, and RD-E18 remain the four Inferred candidate rows. No qualifying New
Orleans-origin or CT-36 candidate was found. RD-E11 still lacks a dated military
passage and crossing set; RD-E17 and RD-E18 still lack claim-specific second
families. RD-SI06 and RD-SI13 retain one-family handling details even though the
column-separated Sherman interval register is complete for this pass.

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

1. exact closed IDs and signatures for sources, nodes, candidates, Potomac/Sherman interval rows, non-links, and interchanges;
2. every CT/RN/WN/CTS/CTI/CTNL/source reference to resolve, with the eleven explicitly unassigned road nodes rejected rather than guessed;
3. two independent families for every `Verified` load-bearing claim and one-family rows pinned `Inferred`;
4. explicit direction, date, scope, crossing/bridge/depot limits, and operation-specific status;
5. no composition of segments, modern-road terms, gameplay fields, state/save/UI writes, or owner duplication;
6. deep immutable read-only normalization that fails closed as a whole on unresolved core references;
7. exact absence teeth for the eleven non-links and byte-equivalent D506 behavior when road data is absent;
8. a negative bind that promotes RD-E11, RD-E15, RD-E17, or RD-E18 without curing its evidence and reds only endpoint/source-floor integrity; and
9. a negative bind that maps RD-N13 to CT-09, joins Potomac crossings, or collapses Sherman columns and reds only prohibited-inference integrity.

That concept is deliberately non-executable. A future implementation needs a new
complete acceptance contract and standalone DRIVE transfer.

## 12. Final verdict

**NEEDS_MORE_RESEARCH**

The fourth pass records 65 sources, 37 nodes, 18 candidates (14 Verified · 4
Inferred · 0 Disputed), six Potomac rows, thirteen Sherman interval rows (11
Verified · 2 Inferred), 11 non-links, and ten interchange candidates. It corrects
the Harpers Ferry crossing premise, bounds RD-E18 to unassigned Boonville-Arrow Rock
endpoints and a detached force, independently verifies RD-SI10's Orangeburg handling,
and records claim-specific negative results for New Orleans, Marshall-Shreveport,
and CT-36. The missing second families, lawful endpoints, crossing or handling sets,
and exact road identities still prevent a complete, referentially closed registry.
Shipping a read-only road substrate now would require forbidden endpoint,
composition, or routine-service inferences. Road data, runtime, and gameplay remain
unauthorized.
