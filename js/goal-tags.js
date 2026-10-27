/* Little Wonders · goal tag registry (hand-edited; the ONLY place content is tagged for the parent goals panel).
   To add content: add ONE entry to ITEMS below (see README "Goals and points"). Book pages come from js/goal-books.js (generated).
   bars: share of the points each activity gives to the six goals (they are normalised, so only the proportions matter).
   lvl:  CEFR level the item is aimed at (A1, A2 or B1). Points always go to that level's version of the goal.
   wins: named first-success / improvement tracks inside a game (label + unit are shown to parents). */
window.LWGoalTags=(function(){
const GOALS=[
 {
  "id": "vocab",
  "title": "Words I know",
  "levels": {
   "A1": {
    "can": "Your child names everyday things and picks the right word for a picture.",
    "ex": [
     "This is a cup.",
     "The cat is small."
    ]
   },
   "A2": {
    "can": "Your child uses everyday words in groups and describes what things are for and what they are like.",
    "ex": [
     "A towel is soft, and it dries my hands.",
     "I keep my pencils in my backpack."
    ]
   },
   "B1": {
    "can": "Your child understands and uses topic words, including some science words, and explains what they mean.",
    "ex": [
     "A magnet attracts iron, so it can lift a paperclip.",
     "Clouds are made of tiny drops of water."
    ]
   }
  }
 },
 {
  "id": "spelling",
  "title": "Spelling and letters",
  "levels": {
   "A1": {
    "can": "Your child knows the letters of the alphabet, in order, and spells short three- and four-letter words.",
    "ex": [
     "C-A-T spells cat.",
     "B is for bread."
    ]
   },
   "A2": {
    "can": "Your child spells common words of up to five letters and finds missing letters.",
    "ex": [
     "The word is plate: p-l-a-t-e.",
     "I can spell rainy without help."
    ]
   },
   "B1": {
    "can": "Your child spells longer words and keeps the order of many letters in mind.",
    "ex": [
     "Blanket: b-l-a-n-k-e-t.",
     "I spelled weather correctly, and I know it is not whether."
    ]
   }
  }
 },
 {
  "id": "sentences",
  "title": "Making sentences",
  "levels": {
   "A1": {
    "can": "Your child puts words in the right order to make a short, complete sentence.",
    "ex": [
     "The cow says moo.",
     "I put on my shoes."
    ]
   },
   "A2": {
    "can": "Your child joins two ideas with words like so, because and but, and adds a little detail.",
    "ex": [
     "It was hot, so I opened the window.",
     "I like soup because it is warm."
    ]
   },
   "B1": {
    "can": "Your child builds longer sentences that show time, reason and condition.",
    "ex": [
     "While the kettle was boiling, Max played his guitar.",
     "If the rain stops, we can play outside."
    ]
   }
  }
 },
 {
  "id": "grammar",
  "title": "Grammar",
  "levels": {
   "A1": {
    "can": "Your child uses the simple building blocks correctly: is and are, can, this and that, in, on and under, and simple present verbs.",
    "ex": [
     "She sweeps the porch.",
     "A frog can jump."
    ]
   },
   "A2": {
    "can": "Your child talks about the past and compares things, and begins to speak about the future.",
    "ex": [
     "I took my umbrella yesterday.",
     "A dog is bigger than a cat."
    ]
   },
   "B1": {
    "can": "Your child handles more advanced patterns, such as things that have just happened, duties and plans.",
    "ex": [
     "I haven't finished my project yet.",
     "Do you have to hand it in today?"
    ]
   }
  }
 },
 {
  "id": "listening",
  "title": "Listening and understanding",
  "levels": {
   "A1": {
    "can": "Your child follows a short instruction, picks out key words and answers a simple question about what was heard.",
    "ex": [
     "Please close the door.",
     "Is the cheese heavy?"
    ]
   },
   "A2": {
    "can": "Your child follows what happens first, next and last in a short story, and answers who, what and why.",
    "ex": [
     "First I do my homework, then I make my bed.",
     "Why did Mia think it was Ben?"
    ]
   },
   "B1": {
    "can": "Your child follows an everyday conversation, keeps track of a longer story, and works out how people feel.",
    "ex": [
     "I haven't finished yet, but I'll bring it tomorrow.",
     "The giant was angry because someone had taken his gold."
    ]
   }
  }
 },
 {
  "id": "speaking",
  "title": "Talking about my world",
  "levels": {
   "A1": {
    "can": "Your child says short, useful things about the weather, what people are doing, chores at home and family.",
    "ex": [
     "It is sunny.",
     "I wash the dishes."
    ]
   },
   "A2": {
    "can": "Your child tells what happened and why, and asks other people about their day.",
    "ex": [
     "It was rainy yesterday, so I took my umbrella.",
     "After dinner, Mom washes the dishes and I dry them."
    ]
   },
   "B1": {
    "can": "Your child holds a short conversation about plans, duties and feelings, and gives reasons.",
    "ex": [
     "If it rains this weekend, we will stay in and bake with Grandma.",
     "I have to tidy my room before my cousins arrive, but I will finish soon."
    ]
   }
  }
 }
];
// grammar points a parent sees, and the level where each is first expected (drives "still to meet")
const GRAMMAR={present_simple:['Present simple','A1'],to_be:['am / is / are','A1'],can_cant:["can and can't",'A1'],prepositions:['in, on, under','A1'],questions:['Questions','A1'],this_that:['this and that','A1'],there_is:['there is / there are','A1'],have_has:['have and has','A1'],imperative:['Instructions','A1'],present_continuous:['What is happening now','A1'],adjectives:['Describing words','A1'],
  past_simple:['Past simple','A2'],link_cause:['so and because','A2'],link_time:['before, after, then','A2'],comparative:['Comparing things','A2'],future:['Future with will','A2'],link_contrast:['but','A2'],other_modals:['should and must','A2'],
  link_if:['If sentences','B1'],superlative:['The most and the -est','B1'],present_perfect:['Things that have just happened','B1'],have_to:['Duties with have to','B1']};
const TOPICS={weather:'Weather',actions:'What people are doing',chores:'Chores',family:'Family'};
// points a book page earns when its coin is collected (1 point in total, shared by bars)
const KINDS={
  c:{n:'word card',bars:{vocab:.5,sentences:.15,grammar:.1,speaking:.25}},
  b:{n:'tiny story',bars:{sentences:.3,listening:.2,grammar:.2,speaking:.3}},
  p:{n:'action pair',bars:{vocab:.3,grammar:.4,speaking:.3}},
  s:{n:'story page',bars:{listening:.4,sentences:.2,grammar:.15,speaking:.25}},
  w:{n:'worksheet page',bars:{vocab:.35,sentences:.35,spelling:.3}},
  o:{n:'cover page',bars:{vocab:1},w:.3}};
const ITEMS={
  // ---- games
  'games/alphabet-lights':{label:'Alphabet Lights',lvl:'A1',bars:{spelling:.7,vocab:.15,listening:.15},
    wins:{seq:{label:'Letter sequence',unit:'level',bars:{spelling:.7,listening:.3}},wordseq:{label:'Word sequence',unit:'level',bars:{spelling:.7,vocab:.15,listening:.15}},spell:{label:'Spelling',unit:'letters',bars:{spelling:1}},table:{label:'Letter table',unit:'answers',bars:{spelling:.6,vocab:.4}}}},
  'games/animal-memory':{label:'Animal Memory',lvl:'A1',bars:{listening:.5,vocab:.3,speaking:.2},wins:{memory:{label:'Animal memory',unit:'level'}}},
  'games/match-pet':{label:'Match the pet to its home',lvl:'A1',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All pets home',unit:''}}},
  'games/match-object':{label:'Match the object',lvl:'A1',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All objects matched',unit:''}}},
  'games/mm-room-hop':{label:'Room Hop',lvl:'A1',topic:'objects,house',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All objects in a room',unit:''}}},
  'games/mm-use-it':{label:'Use It!',lvl:'A1',topic:'objects',bars:{vocab:.4,grammar:.3,listening:.3},wins:{match:{label:'All objects matched to what we do',unit:''}}},
  'games/mm-helper-pairs':{label:'Helper Pairs',lvl:'A1',topic:'objects',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All helper pairs found',unit:''}}},
  'games/mm-shadow-match':{label:'Shadow Match',lvl:'A1',topic:'objects',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All shadows matched',unit:''}}},
  'games/mm-read-find':{label:'Read It, Find It',lvl:'A1',topic:'objects',bars:{vocab:.35,sentences:.35,listening:.3},wins:{match:{label:'All sentences matched',unit:''}}},
  'games/mm-before-after':{label:'Before and After',lvl:'A1',topic:'objects',bars:{vocab:.4,sentences:.3,listening:.3},wins:{match:{label:'All before and after matched',unit:''}}},
  'games/mm-feed-pets':{label:'Feed the Pets',lvl:'A1',topic:'animals,pets',bars:{vocab:.5,listening:.3,sentences:.2},wins:{match:{label:'All pets fed',unit:''}}},
  'games/mm-mama-baby':{label:'Mama and Baby',lvl:'A1',topic:'animals',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All babies home',unit:''}}},
  'games/mm-kite-week':{label:'Max\'s Kite Week',lvl:'A1',topic:'weather',bars:{vocab:.4,listening:.3,sentences:.3},wins:{match:{label:'All days matched',unit:''}}},
  'games/mm-pack-mountain':{label:'Pack for the Mountain',lvl:'A1',topic:'weather',bars:{vocab:.4,listening:.3,sentences:.3},wins:{match:{label:'All bags packed',unit:''}}},
  'games/mm-chore-kit':{label:'Chore Kit',lvl:'A1',topic:'chores,family',bars:{vocab:.4,sentences:.3,listening:.3},wins:{match:{label:'All chore kits packed',unit:''}}},
  'games/mm-family-team':{label:'Family Team',lvl:'A1',topic:'chores,family',bars:{vocab:.35,sentences:.35,listening:.3},wins:{match:{label:'All chores matched to the family',unit:''}}},
  'games/mm-zoom-guess':{label:'Zoom and Guess',lvl:'A1',topic:'food',bars:{vocab:.5,listening:.3,speaking:.2},wins:{match:{label:'All foods guessed',unit:''}}},
  'games/mm-taste-test':{label:'Taste Test',lvl:'A1',topic:'food',bars:{vocab:.4,grammar:.3,sentences:.3},wins:{match:{label:'All clues matched',unit:''}}},
  'games/mm-grow-cook-chill':{label:'Grow, Cook or Chill',lvl:'A1',topic:'food',bars:{vocab:.5,listening:.3,grammar:.2},wins:{match:{label:'All foods in place',unit:''}}},
  'games/save-sam':{label:'Save Sam',lvl:'A1',bars:{sentences:.4,vocab:.3,listening:.3},wins:{stage:{label:'Rescue stage',unit:'stage'}}},
  'games/what-should-max-wear':{label:'What should Max wear?',lvl:'A1',topic:'weather',bars:{listening:.4,vocab:.3,speaking:.3},okLabel:'weather choices',okTotal:3},
  'games/household-chores':{label:'Household Chores',lvl:'A2',topic:'chores,family',bars:{vocab:.35,speaking:.3,listening:.2,grammar:.15}},
  'games/land-neighbours':{label:'Land Neighbours',lvl:'A2',bars:{vocab:.5,sentences:.3,speaking:.2}},
  'games/four-corners':{label:'Four Corners',lvl:'A1',bars:{speaking:.6,listening:.4}},
  'stories/story-library':{label:'The Story Library',lvl:'B1',bars:{vocab:.3,sentences:.25,grammar:.2,listening:.25},g:['past_simple']},
  // ---- video series (each video listed under v)
  'games/everyday-english':{label:'Everyday English with Max',lvl:'A1',bars:{listening:.45,sentences:.2,grammar:.15,speaking:.2},vLabel:'videos',vTotal:11,okLabel:'situations answered right',okTotal:33,g:['link_cause','present_continuous']},
  'stories/comic-stories':{label:'Comic stories',lvl:'A1',bars:{listening:.45,sentences:.25,vocab:.15,speaking:.15},vLabel:'stories',vTotal:10,
    vLvl:{'bunnys-carrot':'A1','where-is-duck':'A1','robo-colors':'A1','the-lost-kite':'A1','pip-pip-penguin':'A1','toms-seed':'A1','mouse-and-cheese':'A1','missing-cookies':'A2','robot-zip':'A2','moon-disappeared':'A2'}},
  // ---- single videos and worksheets
  'lessons/conversations/a1':{label:'Conversation A1',lvl:'A1',topic:'chores',bars:{listening:.4,speaking:.35,sentences:.15,grammar:.1},g:['can_cant','questions']},
  'lessons/conversations/a2':{label:'Conversation A2',lvl:'A2',topic:'chores',bars:{listening:.4,speaking:.3,grammar:.15,sentences:.15},g:['future']},
  'lessons/conversations/b1':{label:'Conversation B1',lvl:'B1',bars:{listening:.35,speaking:.3,grammar:.25,sentences:.1},g:['present_perfect','have_to']},
  'stories/jack-texts':{label:'Jack and the Beanstalk texts',lvl:'B1',bars:{vocab:.4,sentences:.3,grammar:.3},g:['past_simple']},
  'chem':{label:'Chemistry Word Lab',lvl:'B1',bars:{vocab:.6,spelling:.25,speaking:.15}},
  // ---- Word Lab sheets (one page each: brain teasers, cool fact, word hunt, speaking)
  'lessons/word-lab/chemistry/chemistry-acids-and-bases':{label:'Chemistry Word Lab: Acids and bases',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-atoms-and-elements':{label:'Chemistry Word Lab: Atoms and elements',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-carbon':{label:'Chemistry Word Lab: Carbon',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-chemical-reactions':{label:'Chemistry Word Lab: Chemical reactions',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-metals':{label:'Chemistry Word Lab: Metals',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-mixtures-and-solutions':{label:'Chemistry Word Lab: Mixtures and solutions',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-separating-mixtures':{label:'Chemistry Word Lab: Separating mixtures',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-states-of-matter':{label:'Chemistry Word Lab: States of matter',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-the-periodic-table':{label:'Chemistry Word Lab: The periodic table',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/chemistry/chemistry-why-iron-rusts':{label:'Chemistry Word Lab: Why iron rusts',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-forces-and-gravity':{label:'Science Word Lab: Forces and gravity',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-light-and-shadows':{label:'Science Word Lab: Light and shadows',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-sound-and-vibrations':{label:'Science Word Lab: Sound and vibrations',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-electricity-and-circuits':{label:'Science Word Lab: Electricity and circuits',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-magnets':{label:'Science Word Lab: Magnets',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-energy':{label:'Science Word Lab: Energy',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-the-solar-system':{label:'Science Word Lab: The Solar System',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-heat-and-temperature':{label:'Science Word Lab: Heat and temperature',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-simple-machines':{label:'Science Word Lab: Simple machines',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/science/science-how-scientists-work':{label:'Science Word Lab: How scientists work',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-cells':{label:'Biology Word Lab: Cells',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-the-human-skeleton':{label:'Biology Word Lab: The human skeleton',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-the-heart-and-blood':{label:'Biology Word Lab: The heart and blood',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-photosynthesis':{label:'Biology Word Lab: Photosynthesis',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-the-digestive-system':{label:'Biology Word Lab: The digestive system',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-food-chains':{label:'Biology Word Lab: Food chains',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-life-cycle-of-a-butterfly':{label:'Biology Word Lab: Life cycle of a butterfly',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-the-five-senses':{label:'Biology Word Lab: The five senses',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-germs-and-staying-healthy':{label:'Biology Word Lab: Germs and staying healthy',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/biology/biology-animal-adaptations':{label:'Biology Word Lab: Animal adaptations',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-continents-and-oceans':{label:'Geography Word Lab: Continents and oceans',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-the-water-cycle':{label:'Geography Word Lab: The water cycle',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-volcanoes':{label:'Geography Word Lab: Volcanoes',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-earthquakes':{label:'Geography Word Lab: Earthquakes',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-rivers':{label:'Geography Word Lab: Rivers',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-weather-and-climate':{label:'Geography Word Lab: Weather and climate',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-deserts':{label:'Geography Word Lab: Deserts',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-mountains':{label:'Geography Word Lab: Mountains',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-rainforests':{label:'Geography Word Lab: Rainforests',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/geography/geography-reading-maps':{label:'Geography Word Lab: Reading maps',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-ancient-egypt':{label:'History Word Lab: Ancient Egypt',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-ancient-greece':{label:'History Word Lab: Ancient Greece',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-roman-empire':{label:'History Word Lab: The Roman Empire',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-stone-age':{label:'History Word Lab: The Stone Age',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-vikings':{label:'History Word Lab: The Vikings',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-medieval-castles':{label:'History Word Lab: Medieval castles',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-silk-road':{label:'History Word Lab: The Silk Road',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-printing-press':{label:'History Word Lab: The printing press',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-industrial-revolution':{label:'History Word Lab: The Industrial Revolution',lvl:'B1',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  'lessons/word-lab/history/history-the-first-steps-on-the-moon':{label:'History Word Lab: The first steps on the Moon',lvl:'A2',bars:{vocab:.4,spelling:.2,sentences:.2,speaking:.2}},
  // ---- books outside the Everyday series (Everyday books come from goal-books.js)
};
// defaults for content that has no entry yet (it still scores, and is listed as "untagged" in the console)
const DEFAULTS={game:{lvl:'A1',bars:{vocab:.4,sentences:.2,listening:.2,speaking:.2}},book:{lvl:'A1',bars:{vocab:.5,sentences:.3,speaking:.2}},video:{lvl:'A1',bars:{listening:.5,vocab:.2,speaking:.3}},worksheet:{lvl:'A1',bars:{vocab:.4,sentences:.3,grammar:.3}},videoSeries:{lvl:'A1',bars:{listening:.5,vocab:.2,speaking:.3}},project:{lvl:'A1',bars:{speaking:.6,listening:.4}}};
return {GOALS,GRAMMAR,TOPICS,KINDS,ITEMS,DEFAULTS,ALIAS:{'lessons/chem-word-lab':'chem'}};
})();
