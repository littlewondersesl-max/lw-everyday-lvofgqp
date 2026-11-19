# Word Lab: is "A2 / B1" fact or opinion? CEFR audit + age-band proposal (19 Nov 2026)

**Short answer.** CEFR is a published standard, and sheets can be *graded against* reference word lists. That grading is evidence, not an absolute fact: the lists are built from learner corpora and expert judgement, and a worksheet label also depends on the task and the concepts, which no word list measures. Result for the 50 sheets: **the vocabulary of every sheet is readable at A2 once its taught topic words are counted, and 22 of 50 labels are confirmed as they stand; 28 sheets labelled B1 have A2-level vocabulary and are only B1 by concept and task load.** No label on the live site was changed.

## Word lists used (small text lists only, nothing else kept)
| List | What it gives | Source |
|---|---|---|
| Oxford 3000 + Oxford 5000 with CEFR levels (A1-C1), 5,000 headwords | Primary: the CEFR level of each word (lowest sense used) | Oxford Learner's Dictionaries lists (Oxford University Press), as TSV in github.com/voothi/20260715190122-oxford-3000-5000 (Apache-2.0 repo; the original is the official Oxford PDF "The Oxford 3000 by CEFR level", which I did not diff line by line) |
| Cambridge English **A2 Key / A2 Key for Schools** Vocabulary List (Aug 2025) | Cross-check at A2 | Cambridge University Press & Assessment (UCLES), official PDF |
| Cambridge English **B1 Preliminary / for Schools** Vocabulary List (Aug 2025) | Cross-check at B1 | Cambridge (CUPA), official PDF |
| England National Curriculum programmes of study: science, geography, history | Age at which a topic is first required (for the age proposal) | gov.uk, fetched 19 Nov 2026 |

The English Vocabulary Profile site was not used (it is a search-only web tool with no downloadable list).

## Method
1. For each sheet, all text a learner reads is counted: cool fact, glossary, teasers, activity, speak prompts, title. Proper nouns and chemical symbols are skipped.
2. **Raw %** = running words at or below the sheet's label in Oxford (or in the Cambridge list for the words Oxford does not list, e.g. inflected forms).
3. **With taught words %** = raw % plus words the sheet itself teaches (listed in the glossary, or a key word / teaser answer / word-bank word). Topic words are therefore *flagged as taught vocabulary*, not hidden. This is the figure used for the verdict.
4. Thresholds from reading research: about 95% of running words known is the minimum for adequate comprehension (Laufer 1989), about 98% is comfortable (Hu & Nation 2000; checked this session, replicated by Kremmel 2023). These are probabilities, not hard cut-offs.
5. **Evidence level** = the lowest level (A2 or B1) at which the sheet reaches 95% with taught words.
6. Sentence length and grammar flags (passive, relative clause, conditional, because/so, comparative/superlative, modal) are rough counts from the cool fact. They are checked against general CEFR descriptors and English Grammar Profile knowledge, but there is no official machine-readable grammar list, so this is a judgement aid, not a measurement.
7. Age: Flesch-Kincaid grade of the cool fact + 5 gives the native "reading age" (inflated by long proper names). The topic age is the start of the first National Curriculum year/key stage that requires the topic. Proposed band starts at the average of the two (min 7, max 12) and spans 3 years.

## Result in one table
| Label | Sheets | Text fits that level (>=95% with taught words) | Verdict |
|---|---|---|---|
| A2 | 15 | 15 of 15 (all at 97.5% or more) | **Confirmed** |
| B1 | 35 | 7 need B1 (A2 would be below 95%): Periodic table, Separating mixtures, Acids and bases, Chemical reactions, Metals, Heat and temperature, Volcanoes | **Confirmed** |
| B1 | 28 | The text is already A2 by vocabulary (and B1 for all 35) | **Not justified by vocabulary alone**; kept as B1 for concept and task load (listed below, not relabelled) |

Mean sentence length is 11.0 words on A2 sheets and 11.3 on B1 sheets, and mean grade is 5.4 vs 5.9. So **A2 vs B1 are not separated by measurable language**; that is the honest finding.

### Per-sheet table (sup = with taught words; "above" = words above the label that the sheet does not teach)
| Sheet | Label | Raw % | Sup % | Text fits | Above-label words not taught | Sent. mean/max | FK | Verdict | Topic age (NC) | Reading age | Proposed age band | Better supported |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chemistry: States of matter | A2 | 85.1 | 98.7 | A2 | flow, kettle | 12.0/18 | 6.5 | confirmed | 8 (Y4) | 11.5 | 10-12 | both equal |
| Chemistry: Atoms and elements | B1 | 84.2 | 99.4 | A2 | particle | 9.3/15 | 6.7 | B1 not needed by vocabulary | 11 (KS3) | 11.7 | 11-13 | age |
| Chemistry: The periodic table | B1 | 92.9 | 99.1 | B1 | atom, protons | 10.4/14 | 6.3 | confirmed | 11 (KS3) | 11.3 | 11-13 | both equal |
| Chemistry: Mixtures and solutions | B1 | 93.2 | 99.5 | A2 | dissolving | 9.9/14 | 5.2 | B1 not needed by vocabulary | 9 (Y5) | 10.2 | 10-12 | age |
| Chemistry: Separating mixtures | B1 | 90.1 | 98.3 | B1 | steam, steel | 10.1/15 | 7.0 | confirmed | 9 (Y5) | 12.0 | 10-12 | both equal |
| Chemistry: Acids and bases | B1 | 84.6 | 98.1 | B1 | soda | 7.4/12 | 4.7 | confirmed | 11 (KS3 (Y5 only: acid + bicarbonate)) | 9.7 | 10-12 | CEFR |
| Chemistry: Chemical reactions | B1 | 94.1 | 98.0 | B1 | foam, soda | 14.0/18 | 7.1 | confirmed | 9 (Y5 (burning; formal reactions KS3)) | 12.1 | 11-13 | CEFR |
| Chemistry: Why iron rusts | B1 | 85.0 | 99.5 | A2 | chromium | 11.1/15 | 4.2 | B1 not needed by vocabulary | 9 (not named; Y5 irreversible changes) | 9.2 | 9-11 | both equal |
| Chemistry: Metals | B1 | 89.7 | 98.9 | B1 | sulfur | 10.6/16 | 6.9 | confirmed | 8 (Y4-5 conductors, properties) | 11.9 | 10-12 | both equal |
| Chemistry: Carbon | B1 | 88.9 | 97.9 | A2 | gem, pure, slippery | 12.1/21 | 5.5 | B1 not needed by vocabulary | 11 (KS3/KS4) | 10.5 | 11-13 | age |
| Science: Forces and gravity | A2 | 89.6 | 99.5 | A2 | rough | 11.9/18 | 4.7 | confirmed | 9 (Y5) | 9.7 | 9-11 | both equal |
| Science: Light and shadows | B1 | 94.3 | 100.0 | A2 | - | 12.3/24 | 5.8 | B1 not needed by vocabulary | 7 (Y3 (+Y6)) | 10.8 | 9-11 | age |
| Science: Sound and vibrations | B1 | 90.1 | 99.1 | A2 | forth, whistle | 9.9/14 | 3.2 | B1 not needed by vocabulary | 8 (Y4) | 8.2 | 8-10 | age |
| Science: Electricity and circuits | B1 | 89.3 | 99.5 | A2 | stretches | 12.1/23 | 6.6 | B1 not needed by vocabulary | 8 (Y4 (+Y6)) | 11.6 | 10-12 | age |
| Science: Magnets | A2 | 77.3 | 100.0 | A2 | - | 9.7/12 | 5.6 | confirmed | 7 (Y3) | 10.6 | 9-11 | both equal |
| Science: Energy | B1 | 95.2 | 99.1 | A2 | turbines | 11.4/16 | 6.3 | B1 not needed by vocabulary | 11 (KS3) | 11.3 | 11-13 | age |
| Science: The Solar System | A2 | 92.8 | 99.3 | A2 | inner | 9.4/13 | 4.9 | confirmed | 9 (Y5) | 9.9 | 9-11 | both equal |
| Science: Heat and temperature | B1 | 94.9 | 99.0 | B1 | fever, scale | 10.1/16 | 5.4 | confirmed | 9 (Y4-5; KS3 thermal energy) | 10.4 | 10-12 | both equal |
| Science: Simple machines | B1 | 86.6 | 97.0 | A2 | axe, flagpole, inclined, seesaw | 9.3/17 | 2.9 | B1 not needed by vocabulary | 9 (Y5) | 7.9 | 8-10 | both equal |
| Science: How scientists work | B1 | 99.5 | 99.5 | A2 | investigation | 10.1/17 | 5.3 | B1 not needed by vocabulary | 7 (working scientifically, KS1-2) | 10.3 | 9-11 | age |
| Biology: Cells | B1 | 81.8 | 100.0 | A2 | - | 9.9/16 | 3.6 | B1 not needed by vocabulary | 11 (KS3) | 8.6 | 10-12 | both equal |
| Biology: The human skeleton | A2 | 87.3 | 98.7 | A2 | backbone, breathe | 10.7/17 | 3.8 | confirmed | 7 (Y3) | 8.8 | 8-10 | both equal |
| Biology: The heart and blood | B1 | 86.6 | 99.1 | A2 | pump | 10.4/15 | 3.3 | B1 not needed by vocabulary | 10 (Y6) | 8.3 | 9-11 | both equal |
| Biology: Photosynthesis | B1 | 88.7 | 100.0 | A2 | - | 8.9/13 | 6.1 | B1 not needed by vocabulary | 11 (KS3) | 11.1 | 11-13 | age |
| Biology: The digestive system | B1 | 91.2 | 99.1 | A2 | hollow, organ | 13.3/16 | 5.7 | B1 not needed by vocabulary | 8 (Y4) | 10.7 | 9-11 | age |
| Biology: Food chains | B1 | 89.5 | 97.4 | A2 | bacteria, deer, hawk, nutrients, wolf | 11.6/20 | 5.7 | B1 not needed by vocabulary | 8 (Y4 (simple chains Y2)) | 10.7 | 9-11 | age |
| Biology: Life cycle of a butterfly | A2 | 85.9 | 97.5 | A2 | lays, tiny | 10.7/16 | 5.9 | confirmed | 9 (Y5) | 10.9 | 10-12 | both equal |
| Biology: The five senses | A2 | 87.4 | 99.0 | A2 | sharp, unpleasant | 8.9/16 | 2.7 | confirmed | 5 (Y1) | 7.7 | 7-9 | both equal |
| Biology: Germs and staying healthy | A2 | 87.6 | 100.0 | A2 | - | 12.3/15 | 5.0 | confirmed | 6 (Y2 hygiene; Y6 health) | 10.0 | 8-10 | CEFR |
| Biology: Animal adaptations | B1 | 88.6 | 97.3 | A2 | eyelids, hump, stems | 17.0/24 | 6.4 | B1 not needed by vocabulary | 10 (Y6) | 11.4 | 11-13 | age |
| Geography: Continents and oceans | A2 | 98.1 | 99.4 | A2 | layer | 11.4/15 | 9.8 | confirmed | 5 (KS1) | 14.8 | 8-10 | CEFR |
| Geography: The water cycle | A2 | 93.9 | 100.0 | A2 | - | 11.3/22 | 5.1 | confirmed | 7 (KS2) | 10.1 | 9-11 | both equal |
| Geography: Volcanoes | B1 | 82.8 | 99.0 | B1 | eruption | 11.9/16 | 6.4 | confirmed | 7 (KS2) | 11.4 | 9-11 | both equal |
| Geography: Earthquakes | B1 | 91.8 | 97.6 | A2 | craters, summit, tectonic, thermometer | 10.4/13 | 6.4 | B1 not needed by vocabulary | 7 (KS2) | 11.4 | 9-11 | age |
| Geography: Rivers | B1 | 92.8 | 98.6 | A2 | melting, slope | 12.7/19 | 5.4 | B1 not needed by vocabulary | 7 (KS2) | 10.4 | 9-11 | age |
| Geography: Weather and climate | B1 | 93.2 | 99.1 | A2 | anemometer | 13.5/22 | 8.8 | B1 not needed by vocabulary | 7 (KS1 weather, KS2 climate zones) | 13.8 | 10-12 | both equal |
| Geography: Deserts | A2 | 91.3 | 99.5 | A2 | length | 11.4/16 | 4.5 | confirmed | 7 (KS2 biomes) | 9.5 | 8-10 | both equal |
| Geography: Mountains | B1 | 96.2 | 99.5 | A2 | tectonic | 10.1/15 | 5.7 | B1 not needed by vocabulary | 7 (KS2) | 10.7 | 9-11 | age |
| Geography: Rainforests | B1 | 92.9 | 97.8 | A2 | carbon, dioxide, jaguar, oxygen | 10.6/16 | 5.4 | B1 not needed by vocabulary | 7 (KS2 biomes) | 10.4 | 9-11 | age |
| Geography: Reading maps | A2 | 93.0 | 99.6 | A2 | needle | 12.0/17 | 4.8 | confirmed | 5 (KS1 maps, KS2 grid refs) | 9.8 | 7-9 | CEFR |
| History: Ancient Egypt | A2 | 88.7 | 98.1 | A2 | beside, soil, wrapped | 12.0/21 | 6.2 | confirmed | 7 (KS2) | 11.2 | 9-11 | both equal |
| History: Ancient Greece | B1 | 90.3 | 98.9 | A2 | governs, wrestling | 13.3/18 | 7.0 | B1 not needed by vocabulary | 7 (KS2) | 12.0 | 10-12 | age |
| History: The Roman Empire | B1 | 90.9 | 99.5 | A2 | gladiator | 10.5/14 | 5.9 | B1 not needed by vocabulary | 7 (KS2) | 10.9 | 9-11 | age |
| History: The Stone Age | A2 | 97.0 | 100.0 | A2 | - | 9.1/14 | 4.0 | confirmed | 7 (KS2) | 9.0 | 8-10 | both equal |
| History: The Vikings | B1 | 92.9 | 100.0 | A2 | - | 11.9/15 | 6.7 | B1 not needed by vocabulary | 7 (KS2) | 11.7 | 9-11 | age |
| History: Medieval castles | B1 | 90.9 | 100.0 | A2 | - | 12.1/21 | 5.1 | B1 not needed by vocabulary | 11 (KS3 (Medieval Britain)) | 10.1 | 11-13 | age |
| History: The Silk Road | B1 | 91.4 | 99.5 | A2 | loads | 10.1/15 | 6.9 | B1 not needed by vocabulary | 11 (not named; KS3 estimate) | 11.9 | 11-13 | both equal |
| History: The printing press | B1 | 97.6 | 100.0 | A2 | - | 14.0/18 | 7.4 | B1 not needed by vocabulary | 11 (not named; KS3 estimate) | 12.4 | 12-14 | both equal |
| History: The Industrial Revolution | B1 | 97.2 | 100.0 | A2 | - | 11.5/16 | 8.0 | B1 not needed by vocabulary | 11 (KS3) | 13.0 | 12-14 | age |
| History: The first steps on the Moon | A2 | 91.1 | 99.0 | A2 | harm, sent | 11.9/18 | 7.1 | confirmed | 9 (not named; Y5 space) | 12.1 | 11-13 | CEFR |

The "not taught" column lists words the Oxford lists put above the sheet's label that are not in the glossary or the sheet's key words (71 word-sheet pairs across 39 sheets). Where Oxford has no entry, the Cambridge A2/B1 lists were used as a second source.

## Chemistry Word Lab pages 1-4
These four pages carry **no CEFR label** (their line says "English + science" and, on pages 1 and 4, "for a smart teenager"), so no level claim is being made. Measured against the lists (taught key words counted):

| Page | Words | A2 raw / with key words | B1 raw / with key words | Mean/max sentence | FK | Words above B1 not taught |
|---|---|---|---|---|---|---|
| 1: Why do onions make you cry? | 207 | 88.4 / 94.2 | 95.2 / 99.0 | 10.9/16 | 4.4 | floats, protein |
| -2: Why do fireflies glow? | 199 | 77.9 / 84.4 | 84.9 / 90.5 | 10.4/19 | 6.2 | bioluminescence, fireflies, firefly, luci, luciferin, periodic, predators, protein, scare |
| -3: Why does metal rust? | 208 | 78.8 / 90.4 | 90.4 / 96.6 | 14.0/21 | 6.4 | flakes, oxygen |
| -4: How do chemists pull medicine from a plant? | 224 | 79.5 / 85.7 | 88.8 / 95.1 | 11.0/16 | 6.0 | compound, crush, ether, evaporate, extraction, leftover, neat, parasite, pure, trust |

Reading: pages 1 and 3 fit B1 (95% or more). Page 4 sits right at the B1 line (95.1%) and page 2 is below it (90.5%): fireflies and medicine pages are heavy on topic words (bioluminescence, luciferin, predators, extraction, parasite). They should be described as "B1+ with taught words" if a level is ever added; no label was added.

## Age bands: proposal only (nothing on the live site changed)
The rule above gives a band per sheet (last two columns of the big table). Where **CEFR vs age is better supported**:
- **Age labelling better supported (21 sheets, all B1-labelled with A2 vocabulary)**: Atoms and elements, Mixtures and solutions, Carbon, Light and shadows, Sound and vibrations, Electricity and circuits, Energy, How scientists work, Photosynthesis, The digestive system, Food chains, Animal adaptations, Earthquakes, Rivers, Mountains, Rainforests, Ancient Greece, The Roman Empire, The Vikings, Medieval castles, The Industrial Revolution. The topic and reading level agree on an age; the B1 word-level claim does not.
- **CEFR better supported (6 sheets)**: Acids and bases, Chemical reactions (both really need B1 vocabulary), and Germs and staying healthy, Continents and oceans, Reading maps, The first steps on the Moon (A2 text where topic age and reading age disagree, so an age number is shaky; Continents and oceans reads as grade 9.8 only because of long place names, so its band was set by hand to 8-10).
- **Equal (23 sheets)**: both are about equally supported (e.g. States of matter, Periodic table, Metals, Forces and gravity, Magnets, Solar System, Skeleton, Five senses, Deserts, Ancient Egypt, Stone Age).

Judgement for Pip: use CEFR as a **reading-demand note** ("A2 vocabulary" / "B1 vocabulary") backed by this audit, and add an age band as the main label for B1 sheets whose vocabulary is A2. Either way is a defensible standard, neither is an absolute fact.

## Remaining judgement calls
- Sheets labelled B1 whose vocabulary is A2 (28): keep B1 (concept/task), relabel A2, or switch to age bands. Not decided by this audit.
- The Oxford lists give the lowest-sense level (e.g. "pupil"); some words are credited too generously, and inflections/compounds are matched with simple rules.
- Taught words are credited. Without that credit, raw coverage at the label is 77-99.5% (only 7 of 50 sheets reach 95% raw), so the verdicts depend on the glossary and key words being taught before the reading.
- Grammar load is a rough heuristic; the thresholds (95% / 98%) are probabilistic.
- Age bands for ESL learners assume the learner is the age of a native reader of that level or older; ESL beginners usually need the older end of each band.
