# Medicine, Hospitals, and Disease Research Packet

**Date:** 2026-07-21

**Status:** COMPLETE · docs/research only

**Governing decision:** D500

**Final verdict:** `READY_FOR_SOLDIER_DEPTH_LAW`

## 2. Purpose

This packet supplies citation-grade historical evidence for a future ARC 8 design
law to reason about individual-soldier medicine narratives without predicting an
individual fate. It distinguishes historical care pathways, institutional settings,
recorded dispositions, care labor, and source limits from D169's already-shipped
strategic sickness/wound-pressure system.

The output is an evidence vocabulary, not a medical simulation. A category or case
below may inform generic teaching, a documented named historical record, or a future
`Your Timeline` narrative category only at the eligibility level stated. None is a
runtime event, probability, treatment choice, bonus, recovery clock, or promise that
the same sequence applied across armies, theaters, dates, diagnoses, or people.

## 3. Scope

- **Dates:** 1861-1865, with opening-, mid-, and late-war organization separated.
- **Care settings:** immediate aid/dressing points, ambulance or stretcher removal,
  field and division hospitals, temporary/general hospitals, convalescent facilities,
  rail/water evacuation, hospital ships, camps, relief stations, and refugee care
  where the record supports them.
- **Narrative subjects:** illness, wounds, admission, transfer, convalescence, return
  to duty, light duty, Veteran Reserve/Invalid Corps transfer, disability, discharge,
  capture, and death as separately evidenced dispositions.
- **People and institutions:** Union, Confederate, USCT, women, Black medical labor,
  civilian relief, enslaved hospital labor, freedom seekers, and refugee institutions
  without forced symmetry or a racial/sectional competence hierarchy.
- **Consumer grain:** generic teaching; named historical record after identity,
  service, and participation proof; and `Your Timeline` categories visibly separated
  from canonical history.
- **Claim status:** `Verified` requires at least two independent non-tertiary source
  families; `Inferred` marks one credible family, same-record repetition, an archival
  lead not yet read, or a bounded negative finding; `Disputed` requires credible
  conflict. Missing records are never evidence that care did not occur.

## 4. Explicit exclusions

- No hospital minigame, medical economy, cure, triage choice, player treatment
  action, physician assignment, supply capacity, or care optimization.
- No wound, disease, infection, amputation, disability, recovery, discharge, return,
  or death probability; no immunity or diagnosis table; no timer or forced outcome.
- No conversion of death shares, hospital totals, admission counts, operation counts,
  disease rates, or outcome ratios into gameplay values.
- No named wound, illness, survival, disability, capture, or death inferred from
  aggregate casualties, a regiment's presence, or a generic medical profile.
- No duplicate D169 `C.medical` ledger, medical-relief priority/caps, Campaign Kit
  disease teaching, strategic bridge, save behavior, UI, formulas, or probe ownership.
- No duplicate Human Cost death-scale/mourning readout and no suffering as a reward,
  collectible, spectacle, or score.
- No support figure converted into an `ss:` replacement; no LANE-002 batch selection,
  replacement count change, person overlay, or `canMap:false` override.
- No flattening of nurse, surgeon, steward, attendant, cook, laundress, matron,
  administrator, relief agent, enslaved worker, and informal caregiver into one role.
- No claim that Clara Barton worked for the wartime Red Cross; no claim that
  Letterman's 1862 Army of the Potomac system instantly governed every Union army;
  no claim that hospital existence guaranteed access or effective care.
- No generic Andersonville, Elmira, or prison-medicine narrative from one witness or
  register; no retrospective diagnosis treated as modern clinical certainty.
- No rail/water/conquest mechanic, joined transport/care schema, ARC 7/8/9 runtime,
  D74 output change, or `src/**`, `data/**`, `tools/**`, `assets/**`, package,
  manifest, schema, save, probe, suite, frozen-base, or generated-output change.

## 5. Existing-surface crosswalk and the remaining gap

| Existing surface | What it already owns | Boundary / remaining gap |
|---|---|---|
| D169, `data/disease-medical.json`, `src/63-disease-medical.js`, and `tools/probe-disease-medical.mjs` | Aggregate sick/wounded/treated/disease-death pressure; the optional medical-relief priority and capped bridge; Campaign Kit teaching; save sanitation; UI; formula and probe ownership. | No claim-indexed, dated person-safe narrative corpus. Every D169 value remains closed; this packet supplies no second system. |
| `data/human-cost.json` and `tools/probe-human-cost.mjs` | Readout-only aggregate death scale, disease share, mourning, names, and moral gravity. | No treatment control or named fate. This packet does not re-author its totals or turn loss into a resource. |
| `data/women-in-war.json` and `data/codex.json` | Canonical rich records and shorter cross-references for Barton, Dix, Walker, Tubman, Taylor, and other support figures; explicit noncombatant/support mapping cautions. | Future design must reference canonical IDs rather than produce third copies. A support record may inform a care category but cannot fill a combatant slot. |
| `data/primary-sources.json` | Existing primary-source reader and provenance presentation. | No medicine-specific eligibility, disposition, or care-chain register. A future reader link must reuse this owner rather than create a second archive. |
| D407 and `docs/design/war-career-loop-design.md` | Relationship memory, participation proof, person-to-unit links, historical/`Your Timeline` separation, and the rule that aggregate casualties do not establish personal fate. | ARC 8 may add narrative receipts only after these guards. This packet does not authorize a fate event or implementation. |
| LANE-002 5b and `data/soldier-replacements.json` | Citation-grade named-person overlays, battle-date rank/sector, existing Verified records, and the exclusive replacement workflow. | No new batch or overlay is selected. Existing people may be cited as canonical exemplars; this packet cannot change them. |
| D497/D499 rail and water packets | Dated transport evidence and limitations for future ARC 7 law. | They may contextualize an actual evacuation route only. They do not prove medical availability, make a hospital node, or authorize transport mechanics here. |
| D455 §§4f/6/7 | ARC 8 consumer: primary-source daily-life beats and wounding/medicine narratives after feeder research. | The missing nonduplicative input is a sourced vocabulary for care setting, disposition, testimony, inequality, and narrative eligibility. |

**Remaining gap:** a dated, claim-indexed evidence layer that can say what kind of
historical medical narrative is supportable, for whom, from which records, and with
which uncertainty—without using aggregate history to manufacture a personal fate.

## 6. Research method and source-independence law

1. Start with the narrow historical claim, not a desired narrative beat. Every claim,
   category, institution, and individual below resolves to registered sources.
2. Count underlying evidence families, not URLs. A modern page and lesson plan that
   repeat one register, memoir, or personnel file are one family. Two NLM exhibition
   pages are not automatically independent.
3. `Verified` needs at least two independent non-tertiary families. One credible
   family is `Inferred`; credible conflict is `Disputed`, with the disagreement kept.
4. A named-person claim must establish identity, service context, date or interval,
   and the specific admission/disposition/fact asserted. Regiment-at-battle evidence
   does not prove that a person was present, sick, wounded, treated, or killed.
5. Treat period diagnoses as record language. Do not silently translate them into a
   modern diagnosis or causal chain.
6. Separate admission, treatment, transfer, convalescence, return, light duty,
   discharge, disability, capture, and death. Evidence for one does not imply another.
7. Separate organization on paper, access in practice, and outcome. The existence of
   an ambulance corps, hospital, bed, nurse, or relief agency does not guarantee that
   a particular person reached or benefited from it.
8. Separate Army of the Potomac reforms beginning in 1862 from the March 1864 federal
   uniform-ambulance statute, and both from other armies' local practice.
9. Preserve role and labor conditions. Paid, unpaid, commissioned, contracted,
   appointed, volunteer, detailed, enslaved, and self-directed work are not synonyms.
10. Use “contraband” only in quotation marks or as an explained wartime Union
    bureaucratic term; otherwise use freedom seeker, refugee, formerly enslaved
    person, or the source-faithful local description.
11. Exact quantities remain historical evidence only. They do not establish an
    individual's risk or a future gameplay value.
12. If a core narrative requires missing records, retain a research lead or omit it.
    Never bridge the gap with a deterministic table, analogy, legend, or symmetry.

## 7. Source register

The register contains **38 historical source records**. Project decisions and shipped
data/probes are crosswalks, not part of this count. All web references were inspected
on 2026-07-21; catalog-only or single-family leads are labelled accordingly.

| ID | Author / institution | Title / date | Type / independent family | Coverage supported | Durable reference | Access / confidence note |
|---|---|---|---|---|---|---|
| MH-01 | Jonathan Letterman; U.S. Army AMEDD Center | *Medical Recollections of the Army of the Potomac* (1866), including 1862 orders/reports | Primary memoir and embedded orders / Letterman-AOP | Peninsula medical strain, dedicated ambulances, field-hospital organization, transports, camp exposure, and limits. | https://achh.army.mil/history/book-civil-lettermanmemoirs-medical-recollections/ | Full searchable official transcription; authorial perspective retained. High for the cited AOP events. |
| MH-02 | Thirty-Eighth Congress / GPO | Act establishing a uniform ambulance system, 11 Mar. 1864, 13 Stat. 20-22 | Primary federal statute / Congress | National statutory supervision, staffing, drills, readiness, destination transport, and nonmedical-use prohibition. | https://www.govinfo.gov/content/pkg/STATUTE-13/pdf/STATUTE-13-Pg20.pdf | Page image/text inspected. High for enacted law, not proof of uniform practice. |
| MH-03 | National Park Service | “Jonathan Letterman” | Federal institutional history / NPS | Army of the Potomac reform sequence, field dressing/field/permanent hospital model, Fredericksburg evacuation, and 1864 adoption. | https://home.nps.gov/articles/000/jonathan-letterman.htm | Inspected; independent synthesis paired with primary/statute. High. |
| MH-04 | National Park Service | “Medicine and Medical Practices” | Federal institutional history / NPS-Antietam | Antietam supply/transport constraints, semipermanent field hospitals, and bounded medical-practice corrections. | https://home.nps.gov/articles/medicine-and-medical-practices.htm | Inspected; Antietam-specific detail is not universal. High. |
| MH-05 | U.S. Surgeon-General's Office; NLM | *Medical and Surgical History of the War of the Rebellion*, vol. I, pt. I (1870-88) | Official retrospective compilation / Surgeon General | Medical documentation, disease/wound categories, and case/statistical evidence. | https://resource.nlm.nih.gov/14121350RX1 | Public-domain digitization verified; Union-centered and retrospective. High within its scope. |
| MH-06 | Mary C. Gillett; U.S. Army Center of Military History | *The Army Medical Department, 1818-1865* | Federal specialist scholarship / CMH | Opening-war organization, general hospitals, convalescent camps, relief labor, sanitation, and institutional limits. | https://history.army.mil/portals/143/Images/Publications/catalog/30-8.pdf | Searchable official monograph inspected. High; not a personal-outcome source. |
| MH-07 | National Park Service, Gettysburg NMP | “Gettysburg Overview,” aftermath/Camp Letterman | Federal institutional history / NPS-Gettysburg | Consolidation at Camp Letterman, later transfer, Union/Confederate patients, and closure by Jan. 1864. | https://www.nps.gov/gett/learn/historyculture/gettysburg-overview.htm | Inspected; route model does not prove each individual's exact path. High. |
| MH-08 | National Park Service, Gettysburg NMP | “Join the Army, Company K: Post-Visit Lesson” | Federal institutional microhistory / NPS-Company K | Named admission, convalescence, return, light-duty, disability, and death leads with explicit qualifiers. | https://www.nps.gov/gett/learn/education/classrooms/join-the-army-company-k-post-visit-lesson.htm | Inspected; one curated family. Every “probably,” “likely,” and “may” remains binding. Medium. |
| MH-09 | National Archives | “Carded Medical Records for Soldiers in the U.S. Army, 1821-1912” | Federal archival finding aid / RG 94 hospital abstracts | Record fields for complaint, admission, hospital, return, transfer, furlough, discharge, and death; includes Civil War volunteers and USCT. | https://www.archives.gov/research/military/army/carded-medical-records | Inspected. High for record types; an individual needs the actual card/source record. |
| MH-10 | National Archives | “Civil War Records: Basic Research Sources” | Federal archival methodology / CMSR-pension-unit families | Union/Confederate individual research paths, Confederate survival limits, and the warning that unit battle lists do not prove personal presence. | https://www.archives.gov/research/military/civil-war/resources | Inspected. High for evidence boundaries. |
| MH-11 | National Park Service, Gettysburg NMP | “Cornelia Hancock” | Federal institutional biography grounded in letters / Hancock family | Train-platform transfer, 2nd Corps field hospital, Camp Letterman, and eyewitness limits. | https://www.nps.gov/gett/learn/historyculture/wills-house-virtual-identity-cornelia-hancock.htm | Inspected; one institutional presentation of a primary letter family. Medium-high. |
| MH-12 | Library of Congress | “Civil War,” *American Women: Resources from the Manuscript Collections* | Federal archival guide / multiple manuscript collections | Women physicians, nurses, relief workers, convalescent letters, Esther Hawks, Sara Fleetwood, and collection locators. | https://guides.loc.gov/american-women-manuscript/health-and-medicine/civil-war | Inspected; discovery/collection guide, not proof of every summarized action. High as a locator. |
| MH-13 | Susie King Taylor; Library of Congress | *Reminiscences of My Life in Camp with the 33d USCT* (1902) | Primary retrospective memoir / Taylor | Black woman's self-recorded teaching, nursing/care, camp labor, and memory. | https://www.loc.gov/item/02030128/ | Complete public-domain scan/text verified; retrospective voice must be labelled. High for what Taylor records. |
| MH-14 | National Park Service | “Susie King Taylor” | Federal institutional biography / NPS | Taylor's role, unit-community context, education, caregiving, and memoir significance. | https://www.nps.gov/people/susie-king-taylor.htm | Inspected by research pass; independent context paired with MH-13. High. |
| MH-15 | Harriet Tubman; National Archives, RG 233 | General affidavit regarding wartime service, c. 1898 | Primary claim/pension record / Tubman-Congress | Tubman's claimed scout, nurse, cook, and spy service and later pension treatment. | https://www.archives.gov/legislative/features/claim-of-harriet-tubman | Document images/page inspected; retrospective claim paired with other records. High for the affidavit. |
| MH-16 | Benjamin Guterman; National Archives | “Doing ‘Good Brave Work’: Harriet Tubman's Testimony at Beaufort” | Archival specialist article with 1863 court-martial testimony / NARA-RG153 | Tubman's Beaufort presence, nursing context, and conditions among freedpeople. | https://www.archives.gov/publications/prologue/2000/fall/harriet-tubman-beaufort-testimony | Inspected; distinct underlying testimony from MH-15. High for bounded Beaufort context. |
| MH-17 | National Park Service, Clara Barton NHS | *Clara Barton's Civil War Service* | Federal site study with primary excerpts / Barton-NPS | Barton as independent civilian, battlefield relief, and the postwar Red Cross boundary. | https://www.nps.gov/clba/learn/historyculture/upload/cbservice_508.pdf | PDF inspected. High for role boundary; not a hospital-system source. |
| MH-18 | Library of Congress | Dorothea Dix portrait/catalog record | Federal primary-image catalog / LOC-Dix | Contemporary title: Superintendent for Nurses for the Union Army. | https://www.loc.gov/pictures/item/2021640301/ | Catalog inspected; title only, not operational authority. Medium. |
| MH-19 | National Park Service | “Dorothea Dix” | Federal institutional biography / NPS | Appointment, recruitment/assignment work, and authority limitations. | https://www.nps.gov/people/dorothea-dix.htm | Inspected by research pass; independent context for MH-18. High. |
| MH-20 | National Park Service | “Organization is Key” | Federal institutional history / NPS-relief | U.S. Sanitary Commission and civilian relief distinct from Army medicine; Barton chronology. | https://www.nps.gov/articles/organization-is-key.htm | Inspected; broad synthesis paired with MH-06/MH-17. Medium-high. |
| MH-21 | National Library of Medicine | *Binding Wounds, Pushing Boundaries* exhibition | Federal specialist exhibition with archival sources / NLM-Binding Wounds | Black surgeons, nurses, attendants, cooks/laundresses, institutional discrimination, Contraband Hospital, and Chimborazo labor. | https://www.nlm.nih.gov/exhibition/bindingwounds/exhibition.html | Inspected. High as a sourced synthesis; related NLM pages are one family. |
| MH-22 | Jill L. Newmark; National Archives | “Face to Face with History” | Federal archival article / RG 94 and RG 15 | William Powell, Alexander Augusta, Contraband Hospital, Black surgeons, personnel files, and pension evidence. | https://www.archives.gov/publications/prologue/2009/fall/face.html | Inspected; independent archival family paired with MH-21. High. |
| MH-23 | National Park Service, Petersburg NBP | “Women at City Point” | Federal site history / NPS-City Point | Caregivers, relief agents, Black cooks/laundresses, transport-home work, and first-person-record absence. | https://www.nps.gov/pete/learn/historyculture/women-at-city-point.htm | Inspected; absence of voices is a limitation, not absence of labor. Medium-high. |
| MH-24 | U.S. Department of Veterans Affairs, NCA | “USCT Burials in the National Cemetery” | Federal institutional interpretation / VA-NCA | Frequent USCT understaffing/undersupply, unequal care in practice, and a bounded named Camp William Penn death record. | https://www.cem.va.gov/docs/wcag/history/signs/Philadelphia-National-Cemetery-PA-USCT-Burials-Interpretive-Sign.pdf | One-page sign inspected; pair structural claims with MH-21/MH-22, never make individual probabilities. Medium-high. |
| MH-25 | National Park Service, Camp Nelson NM | “Hospitals” | Federal site history grounded in NARA/inspection records / NPS-Camp Nelson | General, disease, convalescent, prison, employee, and refugee hospitals; care limits and recorded dispositions. | https://www.nps.gov/cane/learn/historyculture/hospitals.htm | Inspected; exact local figures remain one-family unless underlying registers are read. Medium-high. |
| MH-26 | National Park Service, Camp Nelson NM | “Home for Colored Refugees” | Federal site history / NPS-Camp Nelson | 1864 expulsion, 1865 Home, overcrowding/housing, and care obligation for Black refugees. | https://www.nps.gov/cane/learn/historyculture/home-for-colored-refugees.htm | Inspected; same site family as MH-25 for independence. Medium-high. |
| MH-27 | National Park Service, Theodore Roosevelt Island | “Freedman's Camp” | Federal site history / NPS-Camp Greene | 1864-65 overcrowding, disease/malnutrition deaths, subsistence work, and Quaker hospital support. | https://www.nps.gov/this/learn/historyculture/freedman-s-camp.htm | Inspected; one family, so the case remains Inferred. Medium. |
| MH-28 | National Park Service, Shiloh NMP | “Corinth Contraband Camp” | Federal site history / NPS-Corinth | Refugee community, hospital/education/labor infrastructure, USCT recruitment, and Dec. 1863 displacement. | https://www.nps.gov/shil/planyourvisit/contrabandcamp.htm | Inspected; “model camp” language requires balance. One family. Medium. |
| MH-29 | National Archives | “Confederate Medical Personnel” and RG 109 guide | Federal archival finding aids / Confederate Medical Department records | Surviving hospital/personnel/patient/furlough/discharge series, enslaved/paid labor, named hospitals, and record fragmentation. | https://www.archives.gov/publications/prologue/1994/spring/confederate-medical-personnel.html ; https://www.archives.gov/research/guide-fed-records/groups/109.html | Inspected. High for holdings/survival; not condition or efficacy proof. |
| MH-30 | National Park Service, Richmond NBP | “Chimborazo Hospital” | Federal site history / NPS-Richmond | Oct. 1861 establishment, convalescent role, rail/ambulance arrival, staff/labor structure, and uncertain mortality. | https://www.nps.gov/rich/learn/historyculture/chimborazo.htm | Inspected; exact totals/death estimates not elevated without primary returns. High for bounded institution. |
| MH-31 | Encyclopedia Virginia / Virginia Humanities | “Chimborazo Hospital” | Specialist institutional scholarship / Virginia Humanities | Independent hospital/labor context and surviving-record synthesis. | https://encyclopediavirginia.org/entries/chimborazo-hospital/ | Inspected by research pass; pairs with NARA/NPS for bounded claims. Medium-high. |
| MH-32 | Mississippi Department of Archives and History | Confederate hospital order book, Lauderdale Springs, 1862-64 | Primary archival catalog / MDAH | Existence, dates, and repository of a western Confederate hospital order book. | https://koha-public.mdah.ms.gov/cgi-bin/koha/opac-detail.pl?biblionumber=31276 | Catalog inspected; contents not read. Research lead only. Medium for object existence. |
| MH-33 | William M. McPheeters; Cynthia DeHaven Pitcock and Bill J. Gurley | *I Acted from Principle* (University of Arkansas Press, 2000) | Edited primary diary / McPheeters | Confederate surgeon perspective in Price's Trans-Mississippi service; disease, malnutrition, and wounds. | https://www.uapress.com/product/i-acted-from-principle/ | Publisher/editor record inspected; no page-specific passage retrieved. Inferred lead only. |
| MH-34 | National Park Service, Fort Scott NHS | “Fort Scott in the Civil War” and Civil War Medicine teacher guide | Federal site history plus reproduced roster / NPS-Fort Scott | Western Union general-hospital overflow, disease/wound admissions, local aid, and named roster leads. | https://www.nps.gov/articles/fortscottcivilwar.htm ; https://www.nps.gov/common/uploads/teachers/lessonplans/Civil%20War%20Medicine%20Teachers%20Guide1_5081.pdf | Inspected by research pass; same site family. Medium. |
| MH-35 | Naval History and Heritage Command | “Red Rover” | Federal vessel history / DANFS-NHHC | Western hospital ship conversion, onboard care, transport, Mississippi Squadron support, and bounded dates. | https://www.history.navy.mil/research/histories/ship-histories/danfs/r/red-rover.html | Search result/full page verified by research pass. High; same Navy family as MH-36. |
| MH-36 | Naval History and Heritage Command | “The History of the Navy Nurse Corps” | Federal institutional history / NHHC-Nurse history | Sisters of the Holy Cross, Black women listed in ship records, Ann Stokes's 1863-64 service, and pension. | https://www.history.navy.mil/content/history/nhhc/browse-by-topic/communities/navy-medicine/navy-nurse-corps/the-history-of-the-navy-nurse-corps.html | Inspected by research pass; pair Ann Stokes with MH-37. High. |
| MH-37 | National Library of Medicine | “Nursing the Wounded: Angels of Mercy” | Federal specialist exhibition / NLM-Binding Wounds | Taylor, Ann Stokes, Black caregivers, Red Rover, paid/unpaid distinctions, and hospital labor. | https://www.nlm.nih.gov/exhibition/bindingwounds/nursing.html | Inspected; same family as MH-21 but independent of NHHC. High. |
| MH-38 | National Park Service, Andersonville NHS | “Prisoner Search / Hospital Register” contextual material | Federal site/archival interpretation / NPS-Andersonville | Existence and limits of dated Andersonville hospital-register evidence. | https://www.nps.gov/ande/learn/historyculture/feb24.htm | Inspected by research pass; roster/burial-date inconsistencies make broad prison claims unusable here. Medium-low. |

## 8. Claim register

The register contains **36 historical claim rows: 22 Verified, 14 Inferred, and 0
Disputed**. “Verified” applies only to the narrow wording in its row. Design-law
conclusions elsewhere are not counted as historical claims.

| Claim ID | Date / place | Narrow evidence statement | Provenance | Sources | Binding caution |
|---|---|---|---|---|---|
| MC-01 | Army of the Potomac, June-Aug. 1862 | After the Peninsula operations, Letterman described exhausted/abandoned supplies, inadequate shelter, and ambulances unfit for effective service before his reorganization. | Verified | MH-01, MH-03 | Opening strain is Army-of-the-Potomac evidence, not proof that all early care was absent or identical. |
| MC-02 | Army of the Potomac, 2 Aug. 1862; U.S. armies, 11 Mar. 1864 | Letterman's order created dedicated AOP ambulance organization; Congress later enacted a uniform federal ambulance system with medical supervision, drills, readiness, and restricted use. | Verified | MH-01, MH-02, MH-03 | Keep 1862 AOP implementation distinct from 1864 national law and from actual compliance. |
| MC-03 | Eastern theater, 1862-63 | A sourced AOP model moved from temporary aid/dressing points through dedicated removal and division/field hospitals toward more durable/general hospitals. | Verified | MH-01, MH-03, MH-07 | This is a model with bypasses, delays, and failures—not a universal fixed sequence. |
| MC-04 | Antietam, Sept. 1862 | Many wounded could not bear immediate movement; semipermanent field hospitals retained serious cases, while disrupted rail and Quartermaster priorities delayed supplies. | Verified | MH-01, MH-04 | A transport connection did not guarantee supplies or safe evacuation. |
| MC-05 | Fredericksburg, Dec. 1862 | Letterman's system used directed ambulance routes across pontoon bridges to Falmouth hospitals, after which some recovering patients moved to Washington. | Verified | MH-01, MH-03 | The documented route is operation-specific; no time, capacity, or recovery guarantee follows. |
| MC-06 | Gettysburg, July 1863-Jan. 1864 | Scattered field hospitals were consolidated at Camp Letterman before further transport; Hancock witnessed wounded awaiting trains, field-hospital work, and later service at the camp. | Verified | MH-07, MH-11 | Not every wounded person followed one route or left on the same schedule. |
| MC-07 | Eastern and western examples, 1862-64 | Rail, steamer, transport, and hospital ship could carry patients between field/camp and more durable facilities, but geography, control, sanitation, availability, and clinical condition constrained movement. | Verified | MH-01, MH-07, MH-35 | Transport evidence is not a medical capacity or ARC 7 movement value. |
| MC-08 | U.S. Army records, 1861-65 | A named record may document complaint, admission/hospital, general-hospital transfer, furlough, return, discharge, or death; CMSR and pension files may add service/medical context. | Verified | MH-05, MH-09, MH-10 | The record must be retrieved. A finding aid or absent card does not establish a person's fate. |
| MC-09 | U.S. institutions, 1862-65 | Convalescent camps/facilities were distinct from acute care and could hold recovering soldiers near a route back to duty. | Verified | MH-06, MH-25 | Convalescent does not mean recovered, returned, or fit by a predetermined date. |
| MC-10 | 1861-65 medical evidence | Wounds, operations, anesthesia, amputation, prosthetics, and disability can be taught from claim-specific sources, but the evidence does not support a generic outcome table. | Verified | MH-04, MH-05, MH-06 | Exact quantities and clinical outcomes remain evidence only; no probability or spectacle. |
| MC-11 | Company K, 91st Pennsylvania, 1863-64 | The NPS microhistory preserves several different documented/qualified trajectories: hospital admission, convalescence, return, light duty, Invalid Corps transfer, disability, and death. | Inferred | MH-08 | One curated family; its “probably,” “likely,” “may,” and causal uncertainty cannot be smoothed away. |
| MC-12 | Army camps, 1861-65 | Crowding, exposure, food/water/sanitation, fatigue, climate, and infectious disease could shape health, while record and outcome varied by place/person; exposure never establishes a named illness or death. | Verified | MH-01, MH-05, MH-06 | No deterministic susceptibility, immunity, diagnosis, or fate. |
| MC-13 | Camp Nelson, 1863-65 | The complex contained separate general, disease, convalescent, prison, employee, and refugee facilities, and local records show that substantial organization did not guarantee effective care. | Inferred | MH-25, MH-26 | Same NPS/site family; exact local counts and causes need the underlying register plus independent support. |
| MC-14 | Fort Scott, 1861-65 | A western Union general hospital treated disease and battle/skirmish patients and expanded into other buildings/tents under pressure. | Inferred | MH-34 | One site family; useful as a western limitation, not a Union-system proxy. |
| MC-15 | Mississippi Squadron, June 1862-Nov. 1865 | *Red Rover* served as a western hospital ship, treated/transported sick and wounded, and employed military, religious, and Black women caregivers. | Verified | MH-35, MH-36, MH-37 | Do not turn ship history into a capacity, guaranteed route, or universal naval-care claim. |
| MC-16 | Richmond, Oct. 1861-Apr. 1865 | Chimborazo was a large Confederate convalescent/general hospital receiving many patients after earlier emergency care and rail/ambulance movement; relevant patient/personnel records survive in RG 109. | Verified | MH-29, MH-30, MH-31 | Exact totals, effectiveness, and comparative quality are not promoted from estimates. |
| MC-17 | Chimborazo, 1861-65 | The hospital depended on detailed soldiers, women, free Black workers, and enslaved African American labor; owners often received enslaved workers' wages. | Verified | MH-21, MH-29, MH-30, MH-31 | Coerced labor, paid employment, and professional authority must remain distinct; no benevolent-institution gloss. |
| MC-18 | Confederate medical records, 1861-65 | Surviving records are uneven and include hospital rolls, registers, employee lists, requisitions, furlough/discharge records, and patient books; destruction and non-recording limit person-level certainty. | Inferred | MH-10, MH-29 | Both are NARA guidance/holdings families. Record absence cannot prove no care, work, or illness. |
| MC-19 | Lauderdale Springs, Mississippi, 1862-64 | MDAH holds a Confederate hospital order book for the stated dates. | Inferred | MH-32 | The catalog proves the object, not its contents; no limitation or practice claim is yet eligible. |
| MC-20 | Trans-Mississippi, 1862-65 | McPheeters's edited diary is a localized Confederate surgeon witness for disease, malnutrition, wounds, and service with Price west of the Mississippi. | Inferred | MH-33 | One diary family and no page-specific passage retrieved; not a theater-wide medical profile. |
| MC-21 | Union care/relief settings, 1861-65 | Women worked in materially different positions as nurses, physicians/contract surgeons, matrons, administrators, relief agents, cooks, laundresses, and informal caregivers. | Verified | MH-06, MH-12, MH-17, MH-18, MH-19, MH-23 | Do not collapse these roles into “nurse,” erase authority limits, or imply equal pay/status. |
| MC-22 | Clara Barton, 1861-65 | Barton's wartime work was independent civilian battlefield relief; she did not yet serve under an American Red Cross. | Inferred | MH-12, MH-17 | Strong institutional/archival support, but the retrieved LOC guide is a collection locator rather than a second action record. |
| MC-23 | Dorothea Dix, 1861-65 | Dix held the Union title Superintendent of Army Nurses and recruited/assigned nurses, while institutional and gender constraints bounded her authority. | Verified | MH-18, MH-19 | She did not command every woman caregiver or all hospital labor. |
| MC-24 | U.S. Sanitary Commission, from June 1861 | The USSC was a civilian voluntary relief/advisory organization supplying and supporting the Union Army, not the Army Medical Department. | Verified | MH-06, MH-20 | Relief and military medical command remain separate. |
| MC-25 | Susie King Taylor, 1862-65 | Taylor's memoir and institutional record support caregiving/teaching with the 1st South Carolina/33rd USCT community while her official/work labels also included laundress and cook. | Verified | MH-13, MH-14, MH-37 | Retrospective memoir; never call her a commissioned nurse or combatant replacement. |
| MC-26 | Harriet Tubman, Beaufort/Department of the South, 1862-early 1865 | Distinct affidavit and court-martial/testimony families support wartime nursing/care alongside cook, scout, and spy roles in South Carolina. | Verified | MH-15, MH-16 | Keep roles distinct and do not reduce Tubman's service to nursing. |
| MC-27 | Beaufort, 1862-65 | The retrieved evidence supports Tubman's care work at Beaufort but does not independently establish an assignment to a specifically named “Contraband Hospital.” | Inferred | MH-15, MH-16 | Do not convert local tradition or geographic overlap into an exact hospital posting. |
| MC-28 | Contraband Hospital, Washington, D.C., 1863-64 | Black surgeons including Augusta and Powell held authority; the institution treated Black civilians and soldiers and employed Black nurses/attendants under racial discrimination. | Verified | MH-21, MH-22 | Use “Contraband Hospital” as the institution's historical name with an explanatory language note. |
| MC-29 | William P. Powell Jr., 1863-64 | Powell served as a contract assistant surgeon and later led the Contraband Hospital, with archival records documenting work, conflict, and later pension evidence. | Inferred | MH-21, MH-22 | Both presentations substantially rely on the same personnel/pension family; retrieve the file for a strict named Verified row. |
| MC-30 | Union medical settings, 1861-65 | Black women and men worked as surgeons, nurses, attendants, cooks, laundresses, laborers, and relief workers in military/civilian institutions, while archival visibility and authority were unequal. | Verified | MH-12, MH-21, MH-22, MH-23, MH-37 | Do not merge enslaved Confederate labor, paid employment, unpaid service, and professional authority. |
| MC-31 | USCT, 1863-65 | Federal/institutional evidence supports unequal care in practice through frequent understaffing/undersupply and structural discrimination, not a universal absence of care. | Verified | MH-21, MH-22, MH-24 | No mortality percentage or individual result becomes a game probability; do not blame Black soldiers or clinicians. |
| MC-32 | Camp Greene/Freedman's Camp, May 1864-June 1865 | NPS records overcrowding, disease/malnutrition deaths, residents' subsistence work, and partial Quaker hospital support. | Inferred | MH-27 | One family; the War Department failure and resident agency both belong in any later use. |
| MC-33 | Camp Nelson Home for Colored Refugees, Jan. 1865 onward | A refugee institution and hospital existed after deadly expulsion and amid rapid overcrowding. | Inferred | MH-25, MH-26 | Same site family; a facility is not proof of adequate/equal care. |
| MC-34 | Corinth, 1862-Dec. 1863 | The refugee community included homes, school, church, hospital, labor, and USCT recruitment before displacement to Memphis. | Inferred | MH-28 | One family; “model camp” cannot erase precarity, coercion, or displacement. |
| MC-35 | Andersonville, 1864-65 | A hospital-register trail exists, but the retrieved NPS material warns of roster and burial-date inconsistencies. | Inferred | MH-38 | Eligible only as a record-limit example; no generic prison disease/treatment narrative. |
| MC-36 | City Point, 1864-65 | Black women performed hospital/ship cooking and laundry labor, but the site record notes that their own first-person accounts are largely absent. | Inferred | MH-23 | One site family. Missing voices are a teaching/source-limit fact, not permission to invent dialogue or experience. |

## 9. Historical care-chain category register

These categories are separable evidence states, not a mandatory sequence. A future
design law may reject, merge, or narrow them; it may not assign odds or assume that a
person traversed a category without a record.

| Category ID | Historical category | Dated / side-theater floor | Evidence boundary | Eligible consumers | Claims |
|---|---|---|---|---|---|
| CC-01 | Immediate aid / temporary dressing point | Union eastern examples, 1862-63; other use needs local evidence. | First aid or stabilization near the field; terminology and location varied. No treatment or survival outcome implied. | Generic teaching; `Your Timeline` setting after a proved participating unit/person link. | MC-03, MC-04 |
| CC-02 | Stretcher/ambulance collection | AOP, Aug. 1862 onward; federal armies-in-the-field law, Mar. 1864; practice still local. | Dedicated removal is documented for the AOP and later federal statute; availability and timing varied. | Generic teaching; named record only if route/person is documented; `Your Timeline` category. | MC-02, MC-03, MC-05 |
| CC-03 | Division/field hospital | Union eastern examples, 1862-63; Confederate/local use needs case evidence. | Temporary or semipermanent acute-care setting; may retain patients unable to move. | Generic; named only from a hospital/participant source; timeline setting. | MC-03, MC-04, MC-06 |
| CC-04 | Post-battle consolidation hospital | Camp Letterman, Union eastern, July 1863-Jan. 1864. | Camp Letterman is the strongest example; not every battle produced an equivalent institution. | Generic; bounded named evidence; timeline category after participation. | MC-06 |
| CC-05 | General/permanent hospital | Union and Confederate bounded cases, 1861-65; no systemwide equivalence. | Longer-lived facility that could receive transfer, acute, chronic, or convalescent cases; admission is not recovery. | Generic; named when hospital/date/disposition is sourced; timeline category. | MC-06, MC-08, MC-16 |
| CC-06 | Rail/road transfer | Union eastern examples, 1862-63; Confederate eastern arrival context, 1861-65. | Actual patient movement depends on route, control, equipment, condition, and orders. | Generic; named only with route evidence; timeline category without capacity. | MC-04, MC-05, MC-06, MC-07 |
| CC-07 | Water transport / hospital ship | Union eastern transport and western naval case, 1862-65. | Medical transport or shipboard care is operation- and vessel-specific. | Generic; named when ship/person record exists; timeline category. | MC-07, MC-15 |
| CC-08 | Convalescent facility | Bounded Union and Confederate eastern/western cases, 1861-65. | Recovery/rest before possible return or reassignment; not a fixed-duration state. | Generic; named from admission/disposition evidence; timeline category without timer. | MC-09, MC-13, MC-16 |
| CC-09 | Light duty / Invalid or Veteran Reserve service | U.S. named-record examples, 1863-65; no Confederate analogue inferred. | A recorded disposition or later assignment, not a diagnosis or proof of cause. | Generic; named from service/medical records; timeline category only after role rules. | MC-08, MC-11 |
| CC-10 | Missing/fragmentary care trail | Union, Confederate, and prisoner-record limits, 1861-65. | The record may stop between battlefield, hospital, transfer, discharge, or death. | Generic source-criticism lesson only; never an invented named event. | MC-18, MC-35, MC-36 |

## 10. Disease- and wound-narrative category register

| Narrative ID | Evidence-safe narrative category | Minimum evidence | Forbidden inference |
|---|---|---|---|
| NC-01 | Camp exposure/health pressure | Dated place/unit or generic institutional setting plus source-bounded conditions. | A named diagnosis, immunity, illness, or death. |
| NC-02 | Illness recorded | Named complaint/diagnosis in an actual medical/service source; use period wording. | Modern diagnosis, cause, prognosis, or contagion path. |
| NC-03 | Wound recorded | Named person, date/action, wound fact, and participation/service evidence. | Wound type, severity, treatment, disability, or survival unless separately sourced. |
| NC-04 | Awaiting/removal to care | Witness, order, hospital, ambulance, train, boat, or ship evidence. | Guaranteed pickup, elapsed time, route capacity, or quality. |
| NC-05 | Hospital admission | Named hospital/date or bounded institutional case. | Treatment received, improvement, or outcome. |
| NC-06 | Transfer between settings | Two settings plus documented transfer/date or a generic institutional route. | A universal care chain or automatic access. |
| NC-07 | Convalescence | Record says convalescent/recovering or documents the interval. | Fixed recovery time or return to duty. |
| NC-08 | Return to duty | Explicit disposition/service evidence. | Full recovery or absence of lasting disability. |
| NC-09 | Light duty/reassignment | Explicit service disposition, Invalid/Veteran Reserve transfer, or duty record. | Cause, degree of disability, or permanent outcome. |
| NC-10 | Discharge/disability | Explicit discharge, pension, service, or medical evidence. | A generic wound/disease rule or modern disability diagnosis. |
| NC-11 | Death in care | Named death/date/place record; cause only when independently documented. | Wound-caused or disease-caused death from temporal proximity alone. |
| NC-12 | Unresolved/missing record | Conflicting, qualified, or fragmentary evidence displayed as such. | Filling the silence with a dramatic fate, dialogue, or clinical detail. |

## 11. Institutional, hospital, evacuation, relief, and camp cases

| Case ID | Dates / place | Evidence-safe use | Provenance | Sources | Limitation / ARC 8 value |
|---|---|---|---|---|---|
| IC-01 | Harrison's Landing, July-Aug. 1862 | Early AOP medical/transport strain, exposure, makeshift shelter, and subsequent reorganization. | Verified | MH-01, MH-03 | Strong opening-war contrast; cannot represent every army. |
| IC-02 | AOP ambulance reform to federal statute, Aug. 1862-Mar. 1864 | Shows organization changing over time and law following local reform. | Verified | MH-01, MH-02, MH-03 | Law-on-paper and practice remain separate. |
| IC-03 | Antietam, Sept. 1862 | Immobile wounded, semipermanent hospitals, rail/supply disruption, and relief interaction. | Verified | MH-01, MH-04 | No treatment/outcome or transport capacity. |
| IC-04 | Fredericksburg, Dec. 1862 | Documented ambulance/pontoon/Falmouth route and later transfer for some recovering patients. | Verified | MH-01, MH-03 | Operation-specific pathway, not universal timing. |
| IC-05 | Camp Letterman, July 1863-Jan. 1864 | Consolidation, care, later transfer, convalescence, and witness perspective. | Verified | MH-07, MH-11 | Patient routes varied; suffering is not scenery. |
| IC-06 | Camp Nelson, 1863-65 | Multiple facility types, convalescent category, disease burden, and refugee-care limits. | Inferred | MH-25, MH-26 | Same site family; exact local totals stay research leads. |
| IC-07 | *Red Rover*, western rivers, 1862-65 | Hospital ship, patient transport, Black women caregivers, and western theater reach. | Verified | MH-35, MH-36, MH-37 | No ship capacity/game route; role labels remain historical. |
| IC-08 | Fort Scott, 1861-65 | Western Union hospital overflow and localized record leads. | Inferred | MH-34 | One family; not a Union-wide profile. |
| IC-09 | Chimborazo, Richmond, 1861-65 | Confederate convalescent/general hospital, rail/ambulance arrival, and coerced/paid labor distinctions. | Verified | MH-21, MH-29, MH-30, MH-31 | Do not use survival estimates as efficacy; slavery is structural, not background color. |
| IC-10 | Contraband Hospital, Washington, 1863-64 | Black professional authority, Black staff, freedom-seeker/USCT care, and institutional racism. | Verified | MH-21, MH-22 | Historical institution name requires explanation; no medical-quality score. |
| IC-11 | Camp Greene/Freedman's Camp, 1864-65 | Overcrowding, War Department neglect, resident subsistence, and partial Quaker hospital support. | Inferred | MH-27 | Needs a second family before named or quantitative use. |
| IC-12 | Corinth refugee camp, 1862-Dec. 1863 | Community hospital/education/labor and later displacement. | Inferred | MH-28 | “Model” framing cannot erase precarity or displacement. |
| IC-13 | Lauderdale Springs / McPheeters Trans-Mississippi leads, 1862-65 | Proves that a local order book and surgeon diary can anchor future western Confederate research. | Inferred | MH-32, MH-33 | Different local sources do not corroborate one case; no narrative until entries/pages are read. |
| IC-14 | Andersonville register boundary, 1864-65 | Source-criticism example: a hospital register exists but conflicting roster/burial dates limit claims. | Inferred | MH-38 | No generic prison-camp disease, treatment, cruelty, or outcome narrative is authorized. |

The first ten cases plus the explicitly bounded western/Trans-Mississippi leads meet
D500's coverage test without pretending equal depth. IC-01/02 cover early ad-hoc
strain and reform; IC-03/04/05 provide documented care/evacuation paths; IC-06/08
cover disease and western limitations; IC-07 covers waterborne western care; IC-09
provides the Confederate institutional case; IC-10/11/12 cover Black medical labor
and freedom-seeker/refugee care. IC-13 and IC-14 remain honest research limits.

## 12. Individual evidence cases and consumer eligibility

`consumerEligibility` is evidence metadata only. It neither creates a person record
nor authorizes runtime. Support figures remain `canMap:false`; named soldiers below
are research examples, not a LANE-002 batch.

| Person case ID | Evidence-safe historical record | Identity / service / participation boundary | Provenance | consumerEligibility | Sources | Binding caution |
|---|---|---|---|---|---|---|
| PC-01 · Wilson Nailor | Wounded 2 July 1863; general-hospital stay to 23 Oct.; rejoined and later transferred. | Company K, 91st Pennsylvania microhistory; named event/service sequence is only as strong as MH-08 until files are retrieved. | Inferred | `genericTeaching`, `yourTimelineCategory` | MH-08 | “Probably Camp Letterman” stays uncertain; retrieve medical/service records before strict named use. |
| PC-02 · Charles Swisher | Reported to a Philadelphia general hospital in Aug. 1863, returned, then entered Invalid Corps in Jan. 1864. | Company K, 91st Pennsylvania record; Gettysburg participation is not established by this source. | Inferred | `genericTeaching`, `yourTimelineCategory` | MH-08 | Gettysburg presence and whether wound or illness caused the sequence are unresolved. |
| PC-03 · John T. Creamer | Sent to a Washington hospital and died there 21 Dec. 1863. | Company K, 91st Pennsylvania record; hospital/death sequence is sourced, battlefield participation and cause are not. | Inferred | `genericTeaching`, `yourTimelineCategory` | MH-08 | The page says “likely wounded”; do not assert wound, cause, or care sequence. |
| PC-04 · Calvin Hamilton | NPS records a Gettysburg leg wound, refusal of proposed amputation, home recovery, and later light duties. | Company K, 91st Pennsylvania microhistory supplies the bounded participation/service sequence; primary files are not retrieved. | Inferred | `genericTeaching`, `yourTimelineCategory` | MH-08 | One family; never generalize treatment choice or outcome. |
| PC-05 · Peter Harbaugh | NPS records later illness, hospital laundry light duty, discharge, and reported lasting disability. | Company K, 91st Pennsylvania service context; this is a later illness/duty sequence, not a Gettysburg fate. | Inferred | `genericTeaching`, `yourTimelineCategory` | MH-08 | Separate illness, duty, discharge, and later captain's report; no diagnosis inferred. |
| PC-06 · Susie King Taylor | Retrospective first-person care/teaching/labor record with the 1st SC/33rd USCT community. | Unit-community/support participation, not enlistment as a soldier or proof of every action/date. | Verified | `genericTeaching`, `namedHistoricalRecord` | MH-13, MH-14, MH-37 | Canonical support record only; not a soldier replacement or generic “first nurse” claim. |
| PC-07 · Harriet Tubman | Distinct affidavit/testimony evidence for South Carolina nursing/care alongside cook/scout/spy roles. | Department of the South support/service evidence; no combatant slot or exact named-hospital assignment follows. | Verified | `genericTeaching`, `namedHistoricalRecord` | MH-15, MH-16 | Canonical support record; exact Beaufort hospital posting remains Inferred. |
| PC-08 · Cornelia Hancock | Witnessed patients awaiting trains, served at a 2nd Corps field hospital and Camp Letterman, and left letters. | Civilian caregiver/witness participation in bounded eastern settings, not military enlistment or patient status. | Inferred | `genericTeaching`, `namedHistoricalRecord` | MH-11 | One underlying letter family; support/witness record, no `ss:` mapping. |
| PC-09 · William P. Powell Jr. | Contract surgeon and later leader at Contraband Hospital; archival personnel/pension trail survives. | U.S. contract medical service/institutional authority; not combatant participation, and the strict person file is not retrieved. | Inferred | `genericTeaching`, `namedHistoricalRecord` | MH-21, MH-22 | Same underlying file family; not a combatant record, and allegations/prejudice require contextual treatment. |
| PC-10 · Alexander T. Augusta | Commissioned Black medical officer and Contraband Hospital authority under documented racial resistance. | U.S. commissioned medical service/institutional authority, not evidence of battlefield-combat participation. | Verified | `genericTeaching`, `namedHistoricalRecord` | MH-21, MH-22 | Medical/support authority, not a Soldier's Story replacement or generic equality claim. |
| PC-11 · Ann Stokes | Black caregiver aboard *Red Rover* from 1863-64 with later pension based on her own service. | Named shipboard care/service evidence; no soldier role, battlefield presence, or generalized Navy status follows. | Verified | `genericTeaching`, `namedHistoricalRecord` | MH-36, MH-37 | Preserve the deck-log/rating language as historical bureaucracy, not her identity or a modern rank. |

For PC-01 through PC-05, `yourTimelineCategory` means only that the documented type
of disposition may inform a generic future category. It does not make the named
person or the microhistory a runtime payload, and it does not satisfy strict named
historical use before the underlying service/medical records are retrieved.

## 13. Convalescence, return, disability, discharge, and death boundaries

| Candidate state / disposition | Evidence required for historical record | Eligible `Your Timeline` category | Never infer |
|---|---|---|---|
| Exposed to camp conditions | Dated unit/place or generic institutional source. | A generic health-pressure or daily-life setting after participation linkage. | Illness, diagnosis, immunity, absence, or outcome. |
| Recorded ill | Medical/service source using a complaint or period diagnosis. | Illness narrative without predetermined severity/outcome. | Modern diagnosis, contagion source, treatment, or death. |
| Recorded wounded | Person, action/date, participation, and wound fact. | Wound narrative after the battle result/person link exists. | Anatomy, severity, operation, disability, or survival. |
| Admitted | Hospital/date or equivalent primary record. | Admission to a source-compatible setting. | Treatment received, quality, improvement, or outcome. |
| Transferred | Origin/destination and transfer evidence. | A route-consistent transition, with uncertainty when appropriate. | Capacity, elapsed time, clinical stability, or guaranteed arrival. |
| Convalescent | Explicit convalescent/recovering description or documented interval. | Recovery-in-progress narrative with no clock. | Return, full recovery, permanent disability, or a fixed duration. |
| Returned to duty | Explicit service/medical disposition. | A later timeline state if runtime law separately authorizes it. | Full health, no recurrence, unchanged role, or a bonus. |
| Light duty / reserve corps | Explicit assignment or transfer. | A bounded role change after identity/authority checks. | Medical cause, disability degree, permanence, or shame/cowardice. |
| Discharged | Explicit discharge/service record, including stated reason only when sourced. | A terminal/noncombat timeline state if future law allows it. | Death, permanent disability, diagnosis, or moral judgment. |
| Disabled / pensioned | Medical, pension, service, or strong longitudinal evidence. | A dignity-protected disability narrative, not a penalty token. | Clinical details, causation, incapacity level, or modern category. |
| Died | Named death/date/place; cause only from claim-specific evidence. | A timeline death only from actual game result plus future law, never historical aggregation. | Wound/disease causation from proximity or a unit casualty count. |
| Record unresolved | Conflicting/qualified/fragmentary evidence displayed verbatim in substance. | An uncertainty/source-criticism receipt, not a dramatic event. | Any missing intermediate state, dialogue, treatment, or outcome. |

The decisive consumer rule is unchanged: canonical history may state only what its
person-specific sources establish. `Your Timeline` may narrate what the player's
documented game result produces only after a future ARC 8 law defines that authority.
The two can share a category name; they can never share an unlabelled truth claim.

## 14. Women, Black medical labor, USCT, civilian relief, and refugee-care coverage

| Coverage area | Evidence available here | Status / safe use | Boundary |
|---|---|---|---|
| Civilian battlefield relief | Barton; USSC/Christian Commission context; City Point agents. | Strong generic/named teaching. | Barton was an independent civilian, not a wartime Red Cross agent; civilian relief did not command Army medicine. |
| Nursing administration | Dix title/appointment and bounded authority. | Verified named/institutional teaching. | Do not make her controller of all women, Black caregivers, contract surgeons, or local relief. |
| Black woman's participant testimony | Taylor memoir plus institutional context. | Verified named support record and narrative-category evidence. | Retrospective memoir; official labor label and unpaid care remain visible; no `ss:` mapping. |
| Black woman's multidomain Union service | Tubman affidavit and Beaufort testimony. | Verified named support record for care alongside other roles. | Exact named hospital assignment below floor; do not erase scout/spy/liberation work. |
| Black professional medical authority | Augusta, Powell, Rapier and other Contraband Hospital/Union surgeon records. | Verified institution; some named trajectories remain Inferred pending primary-file retrieval. | Racism and contract/commission distinctions stay visible; no “color-blind Army” arc. |
| Black hospital/support labor | NLM, LOC, City Point, Contraband Hospital, *Red Rover*. | Verified role range; individual visibility varies. | Paid, unpaid, coerced, enslaved, enlisted, contracted, and professional labor are not interchangeable. |
| USCT care inequality | Structural understaffing/undersupply and discrimination. | Verified generic teaching, never an individual fate rule. | Do not universalize, blame Black troops/clinicians, or create a racial health modifier. |
| Enslaved Confederate hospital labor | Chimborazo personnel/labor evidence. | Verified institutional teaching. | Name coercion and who received wages; never present hospital scale as benevolence detached from slavery. |
| Camp Nelson refugees | Home/hospital after expulsion and overcrowding. | Inferred local case. | Facility existence is not adequate care; needs independent primary/register support. |
| Camp Greene freedom seekers | Overcrowding, neglect, deaths, subsistence work, and Quaker aid. | Inferred local case. | Avoid a white-rescue frame; resident agency and War Department failure are both central. |
| Corinth freedom seekers | Community hospital, school, work, recruitment, and later forced relocation. | Inferred local case. | “Model camp” is not an outcome verdict; do not turn civilians into a manpower pipeline. |
| City Point Black women | Cooking/laundry on hospital grounds and ships, with few surviving first-person records. | Inferred role/source-limit teaching. | Missing testimony cannot be filled with invented dialogue, feelings, or clinical scenes. |

## 15. Opening-, mid-, late-war, side, and theater limitations

### Opening war, 1861-mid-1862

- The richest organizational evidence here is Union and eastern. The Peninsula case
  supports strain, makeshift shelter/transport, disease exposure, and the conditions
  prompting Letterman's AOP reforms. It does not define western Union, Confederate,
  Navy, or local civilian practice.
- Chimborazo's October 1861 establishment proves a large Confederate institutional
  response at Richmond, not a Confederate-wide system or comparative advantage.
- Early relief and women-care evidence is decentralized. “Volunteer nurse” is not a
  single legal, paid, trained, or command status.

### Midwar, late 1862-1863

- The AOP order, Antietam, Fredericksburg, and Camp Letterman provide the strongest
  documented evolution from local reform to repeated operational use. They remain
  AOP/eastern cases until the March 1864 federal statute.
- *Red Rover* supplies a distinct western river/hospital-ship case; Camp Nelson and
  Fort Scott show that western institutions and pressures did not mirror the East.
- USCT formation, Contraband Hospital, Taylor, Tubman, and refugee institutions make
  race, freedom, labor, and medical access inseparable. They cannot be appended as a
  cosmetic “diversity” note to a white institutional story.

### Late war, 1864-1865

- The 1864 statute establishes national ambulance organization on paper; it does not
  establish instantaneous implementation, uniform availability, or equal access.
- City Point, Camp Nelson, Camp Greene, and refugee-home evidence shows both expanding
  infrastructure and continuing inequality/neglect. More facilities do not equal a
  clean progress curve.
- Convalescence, Invalid/Veteran Reserve duty, discharge, pension, and postwar
  disability require person-specific records. The war's end does not close a body's
  or family's story.

### Side and theater limits

| Area | What this packet can support | What remains below the floor |
|---|---|---|
| Union eastern | AOP reform chronology, several evacuation/camp/general-hospital examples, relief roles, and record families. | A universal Union chain, individual access, or systemwide outcome comparison. |
| Union western/naval | *Red Rover*, Camp Nelson, Fort Scott, and localized hospital/refugee cases. | A complete western network, capacity, or equivalence to AOP organization. |
| Confederate eastern | Chimborazo's institutional/convalescent/labor case and RG 109 record paths. | Comparative efficacy, complete patient outcomes, and unqualified mortality totals. |
| Confederate western / Trans-Mississippi | Lauderdale order-book and McPheeters-diary leads. | Page-specific practices, a network, systemwide shortage, or a sourced individual trajectory. |
| USCT / Black care | Structural inequality, Black professional/support labor, Contraband Hospital, Taylor/Tubman/Stokes, and specific refugee institutions. | A single rate, universal experience, or racial susceptibility/competence rule. |
| Prisoners | One Andersonville register-limit lead and isolated individual captivity in existing records. | Any generic prison medicine, camp comparison, outcome table, or spectacle. |
| Civilian/refugee care | Several bounded Union-occupied sites with institutional/relief evidence. | National coverage, adequate-care assumptions, and voices absent from the archive. |

## 16. ARC 8 inputs versus architecture choices left open

### Evidence inputs now ready for law-draft use

1. A ten-category care-setting vocabulary that explicitly permits bypass, delay,
   absence, and fragmented records.
2. Twelve narrative categories separating exposure, illness/wound, admission,
   transfer, convalescence, return, reassignment, discharge, disability, death, and
   unresolved evidence.
3. A three-value consumer-eligibility vocabulary: `genericTeaching`,
   `namedHistoricalRecord`, and `yourTimelineCategory`.
4. A person-safe proof rule: identity + service + participation + claim-specific
   medical/disposition evidence, with every uncertainty word preserved.
5. Institutional cases spanning opening reform, care/evacuation paths, disease/camp
   limits, Union/Confederate institutions, western/naval care, Black medical labor,
   women/civilian relief, and refugee care.
6. Role/state distinctions that prevent “nurse,” “hospital,” “convalescent,” and
   “returned” from functioning as false catch-all labels.
7. Dignity/source rules for period terminology, unequal archives, slavery, race,
   gender, disability, captivity, and historical/alternative-timeline separation.

### Architecture and product choices still open

- Whether ARC 8 uses event receipts, archive cards, relationship-memory entries,
  post-battle summaries, or another existing surface; no new UI is selected here.
- Which, if any, named historical cases may enter a future law. LANE-002 and existing
  canonical people remain the sole data owners.
- The frequency, timing, prose system, localization, accessibility behavior, and
  player agency of any `Your Timeline` narrative.
- Whether a timeline state persists, ends a career, changes a role, or only teaches;
  no save shape or state machine is selected.
- How War Career's participation/fate adapters and D407 relationship memory consume
  evidence; this packet supplies categories, not an API.
- Whether primary-source excerpts are shown and through which existing reader; all
  quotation, copyright, and accessible-presentation decisions remain open.
- Any mechanics, values, probabilities, balance, economy, treatment, recovery,
  capacity, battlefield, casualty, winner, AI, or output behavior. These remain
  prohibited rather than merely undecided.

## 17. Dignity, anti-spectacle, anti-Lost-Cause, race/gender, and source risks

| Risk | Binding rule |
|---|---|
| Medical spectacle | No body-part collection, operation animation, wound rarity, “good death,” graphic reward, or clinical suffering as entertainment. Teach through records, consequence, care, and uncertainty. |
| Deterministic medicine | No diagnosis-to-outcome table, wound roll, disease chance, immunity, cure, recovery clock, or rate borrowed from an aggregate source. |
| Named-fate fabrication | Aggregate casualties and unit presence cannot establish participation or personal fate. War Career's identity/participation authority remains prior. |
| Presentist diagnosis | Period complaint/diagnosis words stay attributed; no silent modern psychiatric, infectious, or disability label. |
| Ableism | Disability, convalescence, light duty, discharge, and pension are not failure, cowardice, debuffs, or moral verdicts. |
| Racial determinism | USCT inequality is an institutional/racist access condition, never a racial health statistic, competence modifier, or inevitability. |
| Benevolent-institution myth | Hospitals/relief groups could provide care while remaining unequal, coercive, under-resourced, or dependent on enslaved/unrecognized labor. Show both. |
| Enslaved labor erasure | Chimborazo's scale cannot be taught without the coerced Black labor that sustained it and the wage/authority distinctions the records preserve. |
| Gender flattening | Nurse, contract surgeon, superintendent, matron, relief agent, laundress, cook, teacher, and informal caregiver remain distinct. |
| Barton anachronism | Her Civil War work is independent civilian relief; the American Red Cross comes later. |
| Archival silence | Missing Black, civilian, Confederate, western, or poor soldiers' records are a source limit, not evidence of no experience and not a license to invent. |
| “Contraband” normalization | Explain it as Union wartime legal/bureaucratic language; prefer freedom seeker/refugee/formerly enslaved person in neutral narration. |
| Lost Cause hygiene | Confederate hospital organization cannot become evidence that slavery was incidental, humane, or unrelated to institutional capacity. |
| False symmetry | Do not force equal Union/Confederate, eastern/western, white/Black, or soldier/civilian case counts where source survival and power differ. |
| Transport conflation | Rail/river/ship access does not equal medical access, care quality, or a movement value. D497/D499 remain evidence context only. |
| Source mirroring | Two pages repeating one register, memoir, or personnel file remain one family. Preserve every qualifier and disagreement. |

D74 remains absolute. This packet supplies no combat or output lever, and suffering
cannot enter a winner, score, strength, readiness, morale, fatigue, supply, loot,
badge, objective, AI, or other optimization path.

## 18. Validation recommendations

A future docs guard may validate this packet or a later design-law artifact by
checking:

1. required headings and exactly one allowed verdict;
2. unique source, claim, category, institutional-case, and person-case IDs;
3. source/claim/category/case referential integrity;
4. provenance tokens restricted to `Verified`, `Inferred`, and `Disputed`;
5. at least two genuinely independent source-family IDs for every row labelled
   `Verified`, with an explicit exemption only for design-law (not historical) rows;
6. nonempty date/place, evidence boundary, consumer eligibility, and caution fields;
7. required role distinctions, historical/`Your Timeline` separation, period-language
   warning, `canMap:false` boundary, and D169/Human Cost/War Career/LANE-002 crosswalk;
8. a prohibited-field/token scan for probability, percent-as-value, timer, capacity,
   bonus, cure, treatment action, hospital resource, wound table, outcome table,
   casualty/winner/score mutation, or runtime schema;
9. one explicit Confederate limitation, one western/Trans-Mississippi limitation,
   Black medical labor, USCT inequality, women/civilian relief, and refugee-care
   coverage without forced symmetry; and
10. no new `ss:` IDs, no named person without identity/service evidence, and no
    support record treated as a combatant.

No probe is authorized now. A future ARC 8 law must design teeth only after it
chooses a consumer and state authority. Red teeth never land without the fix.

## 19. Remaining traps, source gaps, corrections, and refutations

### Material corrections and refutations

- **AOP reform is not instant Union uniformity.** The defensible chronology is local
  AOP reform in 1862, then federal statute in March 1864; neither proves equal or
  complete implementation.
- **The care chain is not a conveyor belt.** Dressing point, ambulance, field
  hospital, general hospital, and convalescence are categories with delays, bypasses,
  failures, and locally different terms.
- **Admission is not outcome.** “Hospital,” “convalescent,” “returned,” “Invalid
  Corps,” “discharged,” “disabled,” and “died” are distinct evidence states.
- **Women did not share one “nurse” status.** Professional, commissioned, contracted,
  appointed, volunteer, paid, unpaid, enslaved, and informal roles carried different
  authority and recognition.
- **Barton was not a wartime Red Cross agent.** Her Civil War relief was independent
  civilian work; the American organization followed later.
- **Hospital scale is not care quality.** Camp Nelson and Chimborazo demonstrate
  organization and labor, not guaranteed access, effectiveness, or a clean sectional
  ranking.
- **USCT inequality is structural, not biological or deterministic.** Understaffing,
  undersupply, discrimination, and unequal institutions cannot become a racial
  susceptibility or personal-outcome rule.
- **Chimborazo cannot be detached from slavery.** Its operation depended materially
  on enslaved Black labor alongside other workers; organization is not a Lost Cause
  alibi.
- **Prison folklore is below the floor.** One register, one captivity story, or a
  burial list cannot support generic Andersonville/Elmira medicine or a camp outcome
  table.
- **Two presentations may be one family.** NLM's related exhibition pages, NHHC's
  related histories, or NPS pages grounded in the same local register do not become
  independent by URL count.

No credible direct contradiction required a `Disputed` row. The risky differences
found were chronology, scope, record survival, and source-derived uncertainty; they
are kept as bounded `Inferred` claims rather than falsely promoted or manufactured
into a conflict.

### Remaining source gaps

1. Retrieve actual RG 94 medical cards/CMSRs/pension files before any Company K or
   other named soldier becomes a strict Verified medical trajectory.
2. Read Camp Nelson's underlying hospital/refugee registers and inspection reports;
   pair local quantities with an independent primary or specialist family.
3. Read the Lauderdale Springs order book before asserting Confederate western
   practice, supply, admission, or disposition.
4. Select page/date passages from McPheeters and corroborate them with a departmental,
   hospital, or participant source before using a Trans-Mississippi narrative.
5. Add primary/edited-document families for Camp Greene, Corinth, and Camp Nelson
   refugee care before named or quantitative ARC 8 use.
6. Deepen USCT care research through specific regimental/hospital returns and Black
   participant records; do not import an aggregate mortality rate as a person rule.
7. Add a source-grade Confederate western individual trajectory if ARC 8 needs named
   side/theater balance. Do not manufacture symmetry from eastern Richmond records.
8. Treat prisoner-camp medicine as a separate future research question if required;
   this packet deliberately declines it.
9. Psychological trauma, pain management, specific medicines, infection, and modern
   disability classification remain outside this packet unless separately chartered
   with period-language and dignity expertise.

These gaps do not block a Soldier Depth law from using the Verified category,
eligibility, and dignity framework. They do block named use of the affected rows.

## 20. Verdict and precise next bounded task

`READY_FOR_SOLDIER_DEPTH_LAW`

The evidence supports a nonmechanical ARC 8 law-draft input: distinct care and
disposition categories, claim-specific named-person proof, consumer eligibility,
institutional/side/theater limits, and dignity/source rules. The core case coverage
meets D500 without duplicating D169. Weak western Confederate, refugee-camp, Company
K, and prison leads are quarantined as Inferred and cannot silently enter named
content.

**Exact next:** D502, a separate docs-only ARC 6 release reconciliation and ARC 7
scope adjudication. Reconcile D455 with the shipped politics/election, rail, water,
and medicine packets plus current logistics, blockade, diplomacy, Western Theater,
bridge, auto-resolve, custom-builder, Chronicle/divergence, War Career, terrain, and
tactical ownership. Decide whether ARC 6 is complete and whether ARC 7 first needs a
dedicated conquest design-law artifact. Do not choose consequential territory,
turn-scale, economy, movement-capacity, objective-reward, hex, or save architecture;
HALT for Aaron if committed law/evidence does not resolve one. Do not implement ARC
7 or mutate protected surfaces.
