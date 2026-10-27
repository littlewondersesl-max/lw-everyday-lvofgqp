(function () {
  "use strict";

  var SAY = {
    grab: "You take it with your hand.",
    vine: "A long green plant that hangs.",
    paddle: "You push the water with it.",
    canoe: "A little boat for the river.",
    jump: "You go up in the air.",
    swim: "You move in the water.",
    rope: "A strong string you can hold.",
    fly: "You go up like a bird.",
    open: "You make it not closed.",
    backpack: "A bag you wear on your back.",
    umbrella: "It keeps the rain off you.",
    hat: "It sits on your head.",
    duck: "A bird that likes water.",
    scream: "You yell really loud.",
    bee: "A buzz-buzz bug.",
    run: "You go very fast.",
    ladder: "Steps you climb up.",
    climb: "You go up with your hands.",
    bird: "It has wings and sings."
  };

  var STROKE = ' fill="none" stroke="#1c1108" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"';
  function svg(inner) {
    return '<svg viewBox="0 0 160 120" aria-hidden="true">' + inner + "</svg>";
  }

  var ART = {
    grab: svg(
      '<path d="M86 22c8 4 10 16 4 24 10 2 14 14 6 22 10 4 10 18 0 24-2 14-22 20-34 10-10 8-28 4-32-10-8-4-10-18 0-24-8-8-4-22 8-24 0-12 16-20 28-14 6-8 16-10 20-8z" fill="#f0a070" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M40 70c18-28 52-40 86-18" fill="none" stroke="#2f8a32" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M40 70c18-28 52-40 86-18" fill="none" stroke="#4cbc48" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M96 28c8-10 18-8 20-2M118 48c10-6 16 0 16 6" fill="none" stroke="#2f8a32" stroke-width="3"/>'
    ),
    vine: svg(
      '<path d="M78 8c-4 22 10 28 6 48-4 18 10 22 6 44" fill="none" stroke="#1c1108" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M78 8c-4 22 10 28 6 48-4 18 10 22 6 44" fill="none" stroke="#3daa44" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M70 28c-16-2-20 12-12 16 10 2 16-8 12-16z" fill="#4cbc48" stroke="#1c1108" stroke-width="2.4"/>' +
      '<path d="M92 54c16 0 20 14 10 18-10 4-18-8-10-18z" fill="#2f8a32" stroke="#1c1108" stroke-width="2.4"/>' +
      '<path d="M70 86c-16 4-18 16-8 18 12 2 16-12 8-18z" fill="#4cbc48" stroke="#1c1108" stroke-width="2.4"/>'
    ),
    paddle: svg(
      '<path d="M28 96c10-28 18-62 22-78" fill="none" stroke="#1c1108" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M28 96c10-28 18-62 22-78" fill="none" stroke="#c47a2a" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M44 14c18-8 40 2 44 22 4 18-10 32-28 28-16-4-26-18-16-50z" fill="#e8a040" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M58 22c10 2 18 10 16 20" fill="none" stroke="#1c1108" stroke-width="2" opacity=".45"/>'
    ),
    canoe: svg(
      '<path d="M12 74c18 16 118 16 136 0-10-18-28-26-68-26S22 56 12 74z" fill="#8a4a1c" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M28 70h104" stroke="#d4a060" stroke-width="3"/>' +
      '<path d="M8 78c20 10 124 10 144 0" fill="none" stroke="#2a8aaa" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M20 88c16 6 104 6 120 0" fill="none" stroke="#4ec4d4" stroke-width="3" stroke-linecap="round"/>'
    ),
    jump: svg(
      '<circle cx="86" cy="22" r="12" fill="#f0a070" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M86 36l-4 28-16 8M82 50l22 6 8 16M70 64l-18 4M104 56l16-10" fill="none" stroke="#1c1108" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M86 36l-4 28-16 8M82 50l22 6 8 16" fill="none" stroke="#ff7a1a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M36 104c16-8 28-6 40 2 12-10 30-12 48 0" fill="none" stroke="#3daa44" stroke-width="4" stroke-linecap="round"/>'
    ),
    swim: svg(
      '<circle cx="70" cy="40" r="11" fill="#f0a070" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M66 52c8 10 28 8 36-2M62 58c-16 4-22 16-10 18M104 54c16 8 20 0 16-8" fill="none" stroke="#1c1108" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M66 52c8 10 28 8 36-2" fill="none" stroke="#ff7a1a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M16 86c20-10 28 8 48 0 20-8 28 8 48 0 16-6 24 4 32 2" fill="none" stroke="#2a8aaa" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M24 98c18-8 26 6 44 0 20-8 26 6 46 0" fill="none" stroke="#4ec4d4" stroke-width="3" stroke-linecap="round"/>'
    ),
    rope: svg(
      '<path d="M40 20c20 0 20 16 0 16s-20 16 0 16 20 16 0 16 20 16 0 16 20 16 8 20" fill="none" stroke="#1c1108" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M40 20c20 0 20 16 0 16s-20 16 0 16 20 16 0 16 20 16 0 16 20 16 8 20" fill="none" stroke="#c47a2a" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="52" cy="104" r="7" fill="#e8a040" stroke="#1c1108" stroke-width="3"/>'
    ),
    fly: svg(
      '<ellipse cx="86" cy="62" rx="22" ry="14" fill="#e8d8a0" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M70 56c-22-22-36-8-28 8 12 4 20 2 28-8z" fill="#fff6d8" stroke="#1c1108" stroke-width="2.6"/>' +
      '<path d="M100 54c24-20 36-4 26 12-12 2-20 0-26-12z" fill="#fff6d8" stroke="#1c1108" stroke-width="2.6"/>' +
      '<circle cx="96" cy="58" r="3" fill="#1c1108"/>' +
      '<path d="M108 64l14 4" stroke="#1c1108" stroke-width="2.6" stroke-linecap="round"/>'
    ),
    open: svg(
      '<path d="M36 70l44-22 44 22v28H36V70z" fill="#c47a2a" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M36 70l44 18 44-18" fill="none" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M44 48l36-20 40 18-36 20z" fill="#e8a040" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M70 40l18-6" stroke="#1c1108" stroke-width="2"/>'
    ),
    backpack: svg(
      '<path d="M56 28c0-10 12-16 24-16s24 6 24 16" fill="none" stroke="#1c1108" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="40" y="32" width="80" height="72" rx="14" fill="#6b3a1c" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M48 44h64v16H48z" fill="#8a4e24" stroke="#1c1108" stroke-width="2.4"/>' +
      '<rect x="66" y="48" width="28" height="10" rx="2" fill="#c48a2a" stroke="#1c1108" stroke-width="2"/>'
    ),
    umbrella: svg(
      '<path d="M22 64c0-28 26-48 58-48s58 20 58 48H22z" fill="#ffe15a" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M22 64c12-8 24-8 36 0 12-8 24-8 36 0 12-8 26-8 44 0" fill="none" stroke="#1c1108" stroke-width="2.4"/>' +
      '<path d="M80 64v36c0 8 10 10 14 4" fill="none" stroke="#1c1108" stroke-width="4" stroke-linecap="round"/>'
    ),
    hat: svg(
      '<ellipse cx="80" cy="86" rx="54" ry="12" fill="#3a2a14" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M48 84c0-36 16-52 32-52s32 16 32 52H48z" fill="#5a3a1c" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M48 70h64" stroke="#c48a2a" stroke-width="6"/>'
    ),
    duck: svg(
      '<ellipse cx="78" cy="72" rx="32" ry="22" fill="#f0c020" stroke="#1c1108" stroke-width="3"/>' +
      '<circle cx="108" cy="50" r="16" fill="#f0c020" stroke="#1c1108" stroke-width="3"/>' +
      '<circle cx="114" cy="46" r="3" fill="#1c1108"/>' +
      '<path d="M122 52c12 2 14 10 4 12-8 0-12-4-16-8z" fill="#ff7a1a" stroke="#1c1108" stroke-width="2.4"/>' +
      '<path d="M20 92c20-6 100-6 124 4" fill="none" stroke="#2a8aaa" stroke-width="3" stroke-linecap="round"/>'
    ),
    scream: svg(
      '<circle cx="80" cy="60" r="36" fill="#f0a070" stroke="#1c1108" stroke-width="3"/>' +
      '<ellipse cx="66" cy="50" rx="5" ry="8" fill="#1c1108"/>' +
      '<ellipse cx="96" cy="50" rx="5" ry="8" fill="#1c1108"/>' +
      '<ellipse cx="80" cy="78" rx="10" ry="14" fill="#1c1108"/>' +
      '<path d="M56 34c-8-10-18-8-16 0M104 34c8-10 18-8 16 0" fill="none" stroke="#1c1108" stroke-width="3" stroke-linecap="round"/>'
    ),
    bee: svg(
      '<ellipse cx="80" cy="68" rx="26" ry="20" fill="#ffe15a" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M62 56v24M80 50v36M98 56v24" stroke="#1c1108" stroke-width="5"/>' +
      '<path d="M62 50c-10-22 8-28 18-12M98 50c10-22-8-28-18-12" fill="#fff6d8" stroke="#1c1108" stroke-width="2.6"/>' +
      '<circle cx="100" cy="62" r="3" fill="#1c1108"/>'
    ),
    run: svg(
      '<circle cx="78" cy="24" r="11" fill="#f0a070" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M76 36l-8 26 18 6M68 48l22-4 16 8M68 62l-20 8M86 68l8 22" fill="none" stroke="#1c1108" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M76 36l-8 26 18 6M68 48l22-4" fill="none" stroke="#ff7a1a" stroke-width="3" stroke-linecap="round"/>'
    ),
    ladder: svg(
      '<path d="M48 12v96M112 12v96" fill="none" stroke="#1c1108" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M48 12v96M112 12v96" fill="none" stroke="#c47a2a" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M48 32h64M48 54h64M48 76h64M48 98h64" stroke="#1c1108" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M48 32h64M48 54h64M48 76h64M48 98h64" stroke="#e8a040" stroke-width="2.4" stroke-linecap="round"/>'
    ),
    climb: svg(
      '<path d="M40 10v100M70 10v100" fill="none" stroke="#1c1108" stroke-width="6"/>' +
      '<path d="M40 34h30M40 58h30M40 82h30" stroke="#c47a2a" stroke-width="4"/>' +
      '<circle cx="96" cy="36" r="10" fill="#f0a070" stroke="#1c1108" stroke-width="3"/>' +
      '<path d="M90 46c-8 8-16 6-20 0M96 48v22l12 14M90 62l16 4" fill="none" stroke="#1c1108" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M90 46c-8 8-16 6-20 0M96 48v22" fill="none" stroke="#ff7a1a" stroke-width="2.6" stroke-linecap="round"/>'
    ),
    bird: svg(
      '<ellipse cx="78" cy="70" rx="24" ry="16" fill="#4aa0d4" stroke="#1c1108" stroke-width="3"/>' +
      '<circle cx="102" cy="58" r="13" fill="#4aa0d4" stroke="#1c1108" stroke-width="3"/>' +
      '<circle cx="107" cy="55" r="2.6" fill="#1c1108"/>' +
      '<path d="M114 60l12 2-12 6z" fill="#ff7a1a" stroke="#1c1108" stroke-width="2"/>' +
      '<path d="M60 62c-16-18-8-28 8-16" fill="#7ec8f0" stroke="#1c1108" stroke-width="2.6"/>' +
      '<path d="M70 86l-6 14M86 86l8 14" stroke="#1c1108" stroke-width="3" stroke-linecap="round"/>'
    )
  };

  var ICONS = {
    grab: "img/icons/grab.png",
    vine: "img/icons/vine.png",
    rope: "img/icons/rope.png",
    canoe: "img/icons/canoe.png",
    paddle: "img/icons/paddle.png",
    jump: "img/icons/jump.png",
    swim: "img/icons/swim.png",
    scream: "img/icons/scream.png",
    hat: "img/icons/hat.png",
    umbrella: "img/icons/umbrella.png",
    duck: "img/icons/duck.png",
    ladder: "img/icons/ladder.png",
    fly: "img/icons/fly.png",
    run: "img/icons/run.png",
    climb: "img/icons/climb.png",
    bird: "img/icons/bird.png",
    stone: "img/icons/stone.png",
    open: "img/icons/open.png",
    backpack: "img/icons/backpack.png",
    bee: "img/icons/bee.png",
    tree: "img/icons/tree.png"
  };

  function wordItem(w, role, pic) {
    return { w: w, role: role, pic: pic || ICONS[w] || "", say: SAY[w] || "" };
  }

  var STAGES = [
    {
      name: "Waterfall",
      prefix: "s1",
      danger: "img/s1-danger.png",
      think: "img/s1-think.png",
      thinkOrigin: "38% 42%",
      win: "img/s1-win.png",
      fail: "img/s1-fail.png",
      verb: "grab",
      noun: "vine",
      success: "Grab the vine!",
      instantVerbs: { swim: "fail-swim", jump: "fail-jump", fly: "fail-fly" },
      pairFails: { "open+backpack": "fail-backpack" },
      words: [
        wordItem("grab", "verb"),
        wordItem("vine", "noun"),
        wordItem("paddle", "noun"),
        wordItem("canoe", "noun"),
        wordItem("jump", "verb"),
        wordItem("swim", "verb"),
        wordItem("rope", "noun"),
        wordItem("fly", "verb"),
        wordItem("open", "verb"),
        wordItem("backpack", "noun")
      ]
    },
    {
      name: "Bees",
      prefix: "s2",
      danger: "img/s2-danger.png",
      think: "img/s2-think.png",
      thinkOrigin: "48% 42%",
      win: "img/s2-win.png",
      fail: "img/s2-fail.png",
      verb: "grab",
      noun: "umbrella",
      success: "Grab the umbrella!",
      instantVerbs: { scream: "fail-scream", fly: "fail-fly", run: "fail-run" },
      pairFails: {},
      words: [
        wordItem("grab", "verb"),
        wordItem("umbrella", "noun"),
        wordItem("hat", "noun"),
        wordItem("duck", "noun"),
        wordItem("scream", "verb"),
        wordItem("bee", "noun"),
        wordItem("run", "verb"),
        wordItem("fly", "verb")
      ]
    },
    {
      name: "Tree",
      prefix: "s3",
      danger: "img/s3-danger.png",
      think: "img/s3-think.png",
      thinkOrigin: "28% 36%",
      win: "img/s3-win.png",
      fail: "img/s3-fail.png",
      verb: "grab",
      noun: "rope",
      success: "Grab the rope!",
      instantVerbs: { jump: "fail-jump", fly: "fail-fly" },
      pairFails: { "climb+ladder": "fail-ladder" },
      words: [
        wordItem("grab", "verb"),
        wordItem("rope", "noun"),
        wordItem("ladder", "noun"),
        wordItem("jump", "verb"),
        wordItem("climb", "verb"),
        wordItem("bird", "noun"),
        wordItem("fly", "verb")
      ]
    }
  ];

  var LITTLES = ["the", "a", "an", "his", "her", "to"];

  var CARD_PIC = {
    tiger: "img/cards/tiger.png",
    snake: "img/cards/snake.png",
    paddle: "img/cards/paddle.png",
    waterfall: "img/cards/waterfall.png",
    canoe: "img/cards/canoe.png",
    vine: "img/cards/vine.png",
    grab: "img/cards/grab.png",
    bird: "img/cards/bird.png",
    river: "img/cards/river.png",
    jungle: "img/cards/jungle.png"
  };

  var JOURNEY_WORDS = ["tiger", "snake", "paddle", "waterfall", "canoe", "vine", "grab", "bird", "river", "jungle"];

  var JOURNEY = [
    {
      img: "img/journey/1-walk.png",
      forward: true,
      cards: false,
      hotspots: [
        { id: "tiger", word: "tiger", x: 8, y: 35, w: 18, h: 22 },
        { id: "snake", word: "snake", x: 62, y: 58, w: 16, h: 18 },
        { id: "waterfall", word: "waterfall", x: 40, y: 18, w: 22, h: 20 }
      ]
    },
    {
      img: "img/journey/2-bank.png",
      forward: true,
      cards: false,
      hotspots: [
        { id: "river", word: "river", x: 30, y: 42, w: 50, h: 18 },
        { id: "waterfall", word: "waterfall", x: 42, y: 22, w: 20, h: 16 },
        { id: "vine", word: "vine", x: 78, y: 28, w: 18, h: 30 },
        { id: "canoe", word: "canoe", x: 48, y: 52, w: 32, h: 28, click: "next" }
      ]
    },
    {
      img: "img/journey/3-paddle.png",
      forward: true,
      cards: false,
      hotspots: [
        { id: "vine", word: "vine", x: 55, y: 10, w: 20, h: 40 },
        { id: "river", word: "river", x: 20, y: 55, w: 60, h: 25 },
        { id: "bird", word: "bird", x: 70, y: 8, w: 22, h: 22, click: "bird" }
      ]
    },
    {
      img: "img/journey/4-falls.png",
      forward: false,
      cards: true,
      hotspots: [
        { id: "vine", word: "vine", x: 70, y: 10, w: 26, h: 55, click: "vine" }
      ]
    }
  ];

  var SPEAKER_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9h4l6-5v16l-6-5H4z" fill="currentColor"/>' +
    '<path d="M17 9c1.6 1.4 1.6 4.6 0 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    "</svg>";

  var VOICE_EXTS = [".mp3", ".wav", ".m4a"];
  var imgOk = {};
  var vidOk = {};
  var voiceOk = {};
  var preloadVideos = {};

  var stageIndex = 0;
  var verbPlaced = null;
  var nounPlaced = null;
  var littlePlaced = null;
  var locked = false;
  var cinemaGen = 0;
  var timers = [];
  var inspecting = null;
  var inspectReady = false;
  var inspectHome = null;
  var chips = [];
  var selectedChip = null;
  var raf = 0;
  var lastT = 0;
  var journeyMode = false;
  var journeyScene = 0;
  var grabArmed = false;
  var birdBobbed = false;
  var journeyInspecting = null;

  var $ = function (id) { return document.getElementById(id); };
  var screenTitle = $("screen-title");
  var screenPlay = $("screen-play");
  var screenSafe = $("screen-safe");
  var deckEl = $("deck");
  var packBtn = $("btn-pack");
  var scoopBtn = $("btn-scoop");
  var zeroEl = $("zero-g");
  var slotVerb = $("slot-verb");
  var slotLittle = $("slot-little");
  var slotNoun = $("slot-noun");
  var stampEl = $("stamp");
  var marksEl = $("marks");
  var dimEl = $("inspect-dim");
  var ph = $("placeholder");
  var sceneBase = $("scene-base");
  var stillA = $("scene-still-a");
  var stillB = $("scene-still-b");
  var sceneVideo = $("scene-video");
  var stillOn = null;
  var hotspotsEl = $("hotspots");
  var birdBobEl = $("bird-bob");
  var hoverPop = $("hover-pop");
  var fwdBtn = $("btn-forward");

  function currentStage() { return STAGES[stageIndex]; }

  function showScreen(which) {
    screenTitle.classList.toggle("hidden", which !== "title");
    screenPlay.classList.toggle("hidden", which !== "play");
    screenSafe.classList.toggle("hidden", which !== "safe");
  }

  function later(ms, fn) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function (id) { window.clearTimeout(id); });
    timers = [];
  }

  function bumpCinema() {
    cinemaGen += 1;
    clearTimers();
    return cinemaGen;
  }

  function alive(gen) { return gen === cinemaGen; }

  function buzz() {
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
  }

  /* ---------- voices ---------- */
  function pickVoice() {
    var voices = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    var i, v;
    for (i = 0; i < voices.length; i++) {
      v = voices[i];
      if (v.lang === "en-US") return v;
    }
    for (i = 0; i < voices.length; i++) {
      v = voices[i];
      if ((v.lang || "").toLowerCase().indexOf("en") === 0) return v;
    }
    return null;
  }

  function speakTTS(text) {
    if (!window.speechSynthesis || !text) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.88;
    var voice = pickVoice();
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  if (window.speechSynthesis) {
    speechSynthesis.addEventListener("voiceschanged", function () { pickVoice(); });
  }

  var voiceAudio = null;

  function speakWord(word) {
    var i, url;
    for (i = 0; i < VOICE_EXTS.length; i++) {
      url = "voices/" + word + VOICE_EXTS[i];
      if (voiceOk[url] === true) {
        playVoiceFile(url, word);
        return;
      }
    }
    speakTTS(word);
  }

  function playVoiceFile(url, word) {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    try {
      if (voiceAudio) { voiceAudio.pause(); voiceAudio = null; }
      voiceAudio = new Audio(url);
      voiceAudio.play().catch(function () { speakTTS(word); });
    } catch (e) {
      speakTTS(word);
    }
  }

  function probeVoice(word) {
    VOICE_EXTS.forEach(function (ext) {
      var url = "voices/" + word + ext;
      if (voiceOk[url] != null) return;
      var a = new Audio();
      a.preload = "auto";
      a.addEventListener("canplaythrough", function () { voiceOk[url] = true; }, { once: true });
      a.addEventListener("error", function () { voiceOk[url] = false; }, { once: true });
      a.src = url;
    });
  }

  /* ---------- preload ---------- */
  function preloadImage(url) {
    if (!url) return;
    if (imgOk[url] != null) return;
    var im = new Image();
    im.onload = function () { imgOk[url] = true; };
    im.onerror = function () { imgOk[url] = false; };
    im.src = url;
  }

  function preloadVideo(url) {
    if (!url) return;
    if (vidOk[url] != null) return;
    var v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.addEventListener("canplaythrough", function () { vidOk[url] = true; }, { once: true });
    v.addEventListener("loadeddata", function () { if (vidOk[url] == null) vidOk[url] = true; }, { once: true });
    v.addEventListener("error", function () { vidOk[url] = false; }, { once: true });
    v.src = url;
    v.load();
    preloadVideos[url] = v;
  }

  function clipUrls(prefix, key) {
    var base = "img/" + prefix + "-" + key;
    return { videos: [base + ".mp4", base + ".webm"], still: base + ".png" };
  }

  function preloadStage(stage) {
    preloadImage(stage.danger);
    preloadImage(stage.win);
    preloadImage(stage.fail);
    preloadImage(stage.think);
    preloadImage("img/icon-grab.png");
    var keys = ["win", "fail"];
    var k;
    for (k in stage.instantVerbs) {
      if (stage.instantVerbs.hasOwnProperty(k)) keys.push(stage.instantVerbs[k]);
    }
    for (k in stage.pairFails) {
      if (stage.pairFails.hasOwnProperty(k)) keys.push(stage.pairFails[k]);
    }
    keys.forEach(function (key) {
      var u = clipUrls(stage.prefix, key);
      preloadImage(u.still);
      u.videos.forEach(preloadVideo);
    });
    stage.words.forEach(function (item) {
      if (item.pic) preloadImage(item.pic);
      probeVoice(item.w);
    });
    LITTLES.forEach(probeVoice);
    if (stage.prefix === "s1") preloadJourney();
  }

  function preloadJourney() {
    JOURNEY.forEach(function (sc) { preloadImage(sc.img); });
    preloadImage("img/journey/bird-bob.png");
    preloadImage("img/journey/grab-cursor.png");
    preloadImage("img/journey/grab-32.png");
    JOURNEY_WORDS.forEach(function (w) {
      preloadImage(CARD_PIC[w]);
      probeVoice(w);
    });
  }

  function mediaReady(map, url) { return map[url] === true; }

  function firstReadyVideo(urls) {
    var i;
    for (i = 0; i < urls.length; i++) {
      if (mediaReady(vidOk, urls[i])) return urls[i];
    }
    return null;
  }

  /* ---------- scene ---------- */
  function once(fn) {
    var done = false;
    return function () {
      if (done) return;
      done = true;
      fn();
    };
  }

  function hideLayer(el, cut) {
    if (!el) return;
    if (cut) el.classList.add("cut");
    el.classList.remove("on", "smash-zoom");
    el.style.transform = "";
    el.style.transformOrigin = "";
    if (cut) {
      window.requestAnimationFrame(function () { el.classList.remove("cut"); });
    }
  }

  function setBaseDanger(stage) {
    if (imgOk[stage.danger] === false) {
      ph.classList.add("on");
      sceneBase.classList.remove("on");
      return;
    }
    ph.classList.remove("on");
    sceneBase.src = stage.danger;
    sceneBase.alt = "";
    sceneBase.classList.add("on");
  }

  function showStill(url, origin) {
    var incoming = stillOn === stillA ? stillB : stillA;
    var outgoing = stillOn;
    incoming.classList.remove("smash-zoom", "cut");
    incoming.style.transform = "";
    incoming.style.transformOrigin = origin || "50% 40%";
    if (url && imgOk[url] === true) incoming.src = url;
    else if (url && imgOk[url] !== false) incoming.src = url;
    incoming.classList.add("on");
    if (outgoing && outgoing !== incoming) outgoing.classList.remove("on");
    stillOn = incoming;
    hideVideo(false);
    return incoming;
  }

  function hideStills(cut) {
    hideLayer(stillA, cut);
    hideLayer(stillB, cut);
    stillOn = null;
  }

  function hideVideo(cut) {
    if (cut) sceneVideo.classList.add("cut");
    sceneVideo.classList.remove("on");
    sceneVideo.onended = null;
    try { sceneVideo.pause(); } catch (e) {}
    if (cut) {
      window.requestAnimationFrame(function () { sceneVideo.classList.remove("cut"); });
    }
  }

  function snapToDanger() {
    hideStills(true);
    hideVideo(true);
    setBaseDanger(currentStage());
    hideStamp();
  }

  function playVideo(url, onEnded, onFail) {
    sceneVideo.onended = null;
    sceneVideo.controls = false;
    sceneVideo.muted = false;
    sceneVideo.playsInline = true;
    sceneVideo.setAttribute("playsinline", "");
    sceneVideo.src = url;
    try { sceneVideo.currentTime = 0; } catch (e) {}
    sceneVideo.classList.add("on");
    sceneVideo.onended = function () {
      sceneVideo.onended = null;
      if (onEnded) onEnded();
    };
    var p = sceneVideo.play();
    if (p && p.catch) {
      p.catch(function () {
        hideVideo(true);
        if (onFail) onFail();
        else if (onEnded) onEnded();
      });
    }
  }

  function hideStamp() {
    stampEl.className = "stamp hidden";
    stampEl.textContent = "";
  }

  function showStamp(text, kind) {
    stampEl.className = "stamp " + kind;
    stampEl.textContent = text;
  }

  function thinkBeat(stage, gen, then) {
    var layer;
    if (imgOk[stage.think] === true) {
      layer = showStill(stage.think, "50% 40%");
    } else {
      layer = showStill(stage.danger, stage.thinkOrigin || "40% 40%");
    }
    layer.classList.add("smash-zoom");
    later(700, function () {
      if (!alive(gen)) return;
      then();
    });
  }

  function playClip(stage, key, isWin, gen, then) {
    var finish = once(function () {
      if (!alive(gen)) return;
      then();
    });
    var u = clipUrls(stage.prefix, key);
    var vid = firstReadyVideo(u.videos);
    var still = (imgOk[u.still] === true) ? u.still : null;
    if (!still && !isWin && imgOk[stage.fail] === true) still = stage.fail;
    if (!still && isWin && imgOk[stage.win] === true) still = stage.win;
    if (!still && imgOk[stage.fail] === true) still = stage.fail;

    function showClipStill() {
      if (still && imgOk[still] === true) {
        showStill(still, "50% 45%");
        later(isWin ? 3400 : 1900, finish);
      } else {
        later(360, finish);
      }
    }

    if (vid) {
      playVideo(vid, finish, showClipStill);
      later(isWin ? 20000 : 12000, finish);
      return;
    }
    showClipStill();
  }

  function runFailCinema(clipKey) {
    var stage = currentStage();
    var gen = bumpCinema();
    locked = true;
    closeInspect(true);
    screenPlay.classList.add("cinema");
    showStamp("OH NO!", "no");
    speakTTS("Oh no!");

    thinkBeat(stage, gen, function () {
      playClip(stage, clipKey, false, gen, function () {
        if (!alive(gen)) return;
        snapToDanger();
        screenPlay.classList.remove("cinema");
        clearSlots(true);
        locked = false;
        layoutDeck();
      });
    });
  }

  function runWinCinema() {
    var stage = currentStage();
    var gen = bumpCinema();
    locked = true;
    closeInspect(true);
    closeJourneyInspect(true);
    hideHoverPop();
    screenPlay.classList.add("cinema");
    showStamp(stage.success, "yes");
    speakTTS(stage.success);

    playClip(stage, "win", true, gen, function () {
      if (!alive(gen)) return;
      hideStamp();
      screenPlay.classList.remove("cinema");
      try { LWProgress.win("games/save-sam", "stage", { v: stageIndex + 1 }); LWProgress.unit("games/save-sam", "S" + (stageIndex + 1)); } catch (e) {}
      if (stageIndex >= STAGES.length - 1) {
        showScreen("safe");
        speakTTS("Sam is safe!");
      } else {
        stageIndex += 1;
        startStage();
      }
    });
  }

  /* ---------- cards ---------- */
  function artHtml(item) {
    if (item.pic && imgOk[item.pic] !== false) {
      return '<img alt="" src="' + item.pic + '">';
    }
    if (item.w === "grab" && imgOk["img/icon-grab.png"] !== false) {
      return '<img alt="" src="img/icon-grab.png">';
    }
    return ART[item.w] || ART.grab;
  }

  function makeCard(item, index) {
    var card = document.createElement("div");
    card.className = "flashcard in-rail";
    card.setAttribute("data-word", item.w);
    card.setAttribute("data-role", item.role);
    card._item = item;
    card._index = index;

    var spin = document.createElement("div");
    spin.className = "card-spin";

    var back = document.createElement("div");
    back.className = "face back";

    var front = document.createElement("div");
    front.className = "face front";
    front.innerHTML =
      '<button type="button" class="speaker" aria-label="Hear ' + item.w + '">' + SPEAKER_SVG + "</button>" +
      '<div class="art">' + artHtml(item) + "</div>" +
      '<div class="word">' + item.w + "</div>" +
      '<div class="say">' + (item.say || "") + "</div>" +
      '<button type="button" class="use-hit">USE</button>';

    spin.appendChild(back);
    spin.appendChild(front);
    card.appendChild(spin);

    var artImg = front.querySelector(".art img");
    if (artImg) {
      artImg.addEventListener("error", function () {
        artImg.replaceWith(document.createRange().createContextualFragment(ART[item.w] || ART.grab).querySelector("svg"));
      });
    }

    front.querySelector(".speaker").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      speakWord(item.w);
    });
    front.querySelector(".use-hit").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (inspecting === card && inspectReady) useInspected();
    });

    card.addEventListener("click", function (e) {
      if (locked) return;
      if (e.target.closest(".speaker") || e.target.closest(".use-hit")) return;
      if (card.classList.contains("used-ghost")) return;
      if (inspecting === card) return;
      if (inspecting) closeInspect(true);
      inspectCard(card);
    });

    bindInspectDrag(card);
    return card;
  }

  function liveCards() {
    return Array.prototype.slice.call(deckEl.querySelectorAll(".flashcard")).filter(function (c) {
      return !c.classList.contains("used-ghost") && c !== inspecting && c !== journeyInspecting;
    });
  }

  function setCardTransform(card, x, y, rot, scale) {
    card._x = x; card._y = y; card._rot = rot; card._scale = scale;
    card.style.transform =
      "translate3d(" + x + "px," + y + "px,0) rotate(" + rot + "deg) scale(" + scale + ")";
  }

  function railMetrics() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    if (journeyMode) {
      var n = Math.max(1, liveCards().length);
      var cols = 2;
      var rows = Math.ceil(n / cols);
      var topPad = 10;
      var availH = Math.max(160, vh - 20);
      var gapX = 7;
      var gapY = 7;
      var cardW = Math.min(86, Math.max(58, vw * 0.118));
      var cardH = cardW * 1.22;
      var totalH = rows * cardH + (rows - 1) * gapY;
      if (totalH > availH) {
        var s = availH / totalH;
        cardW *= s;
        cardH *= s;
        gapY *= s;
      }
      var totalW = cols * cardW + (cols - 1) * gapX;
      totalH = rows * cardH + (rows - 1) * gapY;
      return {
        cols: cols,
        rows: rows,
        cardW: cardW,
        cardH: cardH,
        gapX: gapX,
        gapY: gapY,
        startX: vw - totalW - 8,
        startY: topPad + Math.max(0, (availH - totalH) * 0.06)
      };
    }
    var tray = $("tray").getBoundingClientRect();
    var n = Math.max(1, liveCards().length);
    var cols = n > 5 ? 2 : 1;
    var rows = Math.ceil(n / cols);
    var topPad = 10;
    var bottom = Math.max(vh * 0.42, tray.top - 10);
    var availH = Math.max(140, bottom - topPad);
    var availW = Math.min(vw * 0.4, cols === 2 ? 176 : 96);
    var gapX = 7;
    var gapY = 7;
    var cardW = Math.min(86, (availW - gapX * (cols - 1)) / cols);
    var cardH = cardW * 1.34;
    var totalH = rows * cardH + (rows - 1) * gapY;
    if (totalH > availH) {
      var s = availH / totalH;
      cardW *= s;
      cardH *= s;
      gapY *= s;
    }
    cardW = Math.max(52, cardW);
    cardH = Math.max(70, cardH);
    var totalW = cols * cardW + (cols - 1) * gapX;
    totalH = rows * cardH + (rows - 1) * gapY;
    return {
      cols: cols,
      rows: rows,
      cardW: cardW,
      cardH: cardH,
      gapX: gapX,
      gapY: gapY,
      startX: vw - totalW - 8,
      startY: topPad + Math.max(0, (availH - totalH) * 0.08)
    };
  }

  function layoutDeck() {
    var cards = liveCards();
    var m = railMetrics();
    var i, card, col, row, x, y, rot;
    for (i = 0; i < cards.length; i++) {
      card = cards[i];
      col = i % m.cols;
      row = Math.floor(i / m.cols);
      x = m.startX + col * (m.cardW + m.gapX);
      y = m.startY + row * (m.cardH + m.gapY);
      rot = (col === 0 ? -2 : 2) + (row % 2 ? 1 : -1);
      card.style.width = m.cardW + "px";
      card.style.height = m.cardH + "px";
      card.style.zIndex = String(20 + i);
      card.classList.add("in-rail");
      card.classList.remove("tucked", "is-inspect", "dragging");
      card.style.pointerEvents = "auto";
      setCardTransform(card, x, y, rot, 1);
    }
  }

  function inspectPos(card) {
    var tw = card ? card.offsetWidth : Math.min(window.innerWidth * 0.64, 280);
    var th = card ? card.offsetHeight : Math.min(window.innerHeight * 0.48, 340);
    var railLeft = railMetrics().startX;
    var x = (window.innerWidth - tw) / 2;
    if (x + tw > railLeft - 8) x = Math.max(6, railLeft - tw - 10);
    var bottom = window.innerHeight;
    if (!journeyMode) {
      var tray = $("tray").getBoundingClientRect();
      if (tray.top) bottom = tray.top;
    }
    return {
      x: x,
      y: Math.max(8, (bottom - th) / 2 - 4)
    };
  }

  function wellRoleAt(x, y) {
    var spots = [
      { role: "verb", el: slotVerb },
      { role: "noun", el: slotNoun },
      { role: "little", el: slotLittle }
    ];
    var i, r, pad;
    for (i = 0; i < spots.length; i++) {
      r = spots[i].el.getBoundingClientRect();
      pad = 10;
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
        return spots[i].role;
      }
    }
    return null;
  }

  function clearWellHints() {
    slotVerb.classList.remove("drop-ok", "drop-no");
    slotNoun.classList.remove("drop-ok", "drop-no");
    slotLittle.classList.remove("drop-ok", "drop-no");
  }

  function hintWells(over) {
    clearWellHints();
    if (over === "little") {
      slotLittle.classList.add("drop-no");
      return;
    }
    if (over === "verb") slotVerb.classList.add("drop-ok");
    else if (over === "noun") slotNoun.classList.add("drop-ok");
  }

  function pulseMatchWells() {
    var pic = !!(inspecting && inspecting._item);
    slotVerb.classList.toggle("pulse", pic && !verbPlaced);
    slotNoun.classList.toggle("pulse", pic && !nounPlaced);
  }

  function snapInspectHome(card) {
    if (!card) return;
    var home = inspectHome || inspectPos();
    card.style.transition = "transform 380ms cubic-bezier(.2,1.15,.28,1)";
    setCardTransform(card, home.x, home.y, 0, 1);
    clearWellHints();
  }

  function bindInspectDrag(card) {
    var dragging = false;
    var moved = false;
    var sx, sy, ox, oy;

    function down(e) {
      if (locked || inspecting !== card || !inspectReady) return;
      if (e.target.closest(".speaker") || e.target.closest(".use-hit")) return;
      e.preventDefault();
      var p = e.touches ? e.touches[0] : e;
      sx = p.clientX;
      sy = p.clientY;
      ox = card._x;
      oy = card._y;
      moved = false;
      dragging = true;
      card.classList.add("dragging");
      if (card.setPointerCapture && e.pointerId != null) card.setPointerCapture(e.pointerId);
    }

    function move(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      var dx = p.clientX - sx;
      var dy = p.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      card.style.transition = "none";
      setCardTransform(card, ox + dx, oy + dy, 0, 1);
      hintWells(wellRoleAt(p.clientX, p.clientY));
    }

    function up(e) {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("dragging");
      var p = (e.changedTouches && e.changedTouches[0]) || e;
      var over = wellRoleAt(p.clientX, p.clientY);
      clearWellHints();
      if (!moved) return;
      if (over === "verb" || over === "noun") {
        useInspected(over);
        return;
      }
      snapInspectHome(card);
    }

    card.addEventListener("pointerdown", down);
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", up);
    card.addEventListener("pointercancel", up);
  }

  function renderDeck() {
    deckEl.innerHTML = "";
    inspecting = null;
    inspectHome = null;
    currentStage().words.forEach(function (item, i) {
      deckEl.appendChild(makeCard(item, i));
    });
  }

  function inspectCard(card) {
    if (locked || inspecting) return;
    inspecting = card;
    inspectReady = false;
    screenPlay.classList.add("holding");
    var r = card.getBoundingClientRect();
    card.classList.add("is-inspect");
    card.classList.remove("in-rail");
    card.style.width = "";
    card.style.height = "";
    card.style.zIndex = "80";
    var tw = card.offsetWidth;
    var th = card.offsetHeight;
    var home = inspectPos(card);
    inspectHome = home;
    card.style.transition = "none";
    setCardTransform(card, r.left, r.top, card._rot || 0, r.width / tw);
    layoutDeck();
    pulseMatchWells();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        card.style.transition = "transform 540ms cubic-bezier(.18,1.15,.28,1)";
        setCardTransform(card, home.x, home.y, 0, 1);
        card.classList.add("flip-flourish");
        later(740, function () { card.classList.remove("flip-flourish"); });
      });
    });
    later(420, function () { inspectReady = true; });
    speakWord(card._item.w);
    buzz();
  }

  function closeInspect(instant) {
    clearWellHints();
    if (!inspecting) {
      screenPlay.classList.remove("holding");
      pulseMatchWells();
      return;
    }
    var card = inspecting;
    inspecting = null;
    inspectReady = false;
    inspectHome = null;
    screenPlay.classList.remove("holding");
    card.classList.remove("is-inspect", "flip-flourish", "dragging");
    card.classList.add("in-rail");
    if (instant) card.style.transition = "none";
    else card.style.transition = "transform 420ms cubic-bezier(.2,1.1,.3,1)";
    layoutDeck();
    pulseMatchWells();
  }

  function useInspected(targetRole) {
    if (!inspecting || locked) return;
    var card = inspecting;
    var item = card._item;
    var well = targetRole;
    if (well !== "verb" && well !== "noun") {
      well = !verbPlaced ? "verb" : "noun";
    }
    var slot = well === "verb" ? slotVerb : slotNoun;
    var dest = slot.getBoundingClientRect();
    var r = card.getBoundingClientRect();
    inspectReady = false;
    inspectHome = null;
    screenPlay.classList.remove("holding");
    clearWellHints();
    card.style.transition = "transform 480ms cubic-bezier(.2,1.05,.3,1)";
    var scale = Math.min(dest.width / r.width, dest.height / r.height) * 0.92;
    setCardTransform(
      card,
      dest.left + dest.width / 2 - r.width * scale / 2,
      dest.top + dest.height / 2 - r.height * scale / 2,
      well === "verb" ? -8 : 6,
      scale
    );
    later(480, function () {
      card.classList.add("used-ghost");
      card.classList.remove("is-inspect", "dragging");
      card.classList.add("in-rail");
      inspecting = null;
      placeCard(item, well);
      layoutDeck();
      pulseMatchWells();
    });
  }

  /* ---------- slots ---------- */
  function fillCardSlot(el, item) {
    if (!item) {
      el.dataset.empty = "true";
      el.innerHTML = "";
      return;
    }
    el.dataset.empty = "false";
    el.classList.remove("pulse");
    el.innerHTML =
      '<div class="well-mini">' + artHtml(item) + '<span class="w">' + item.w + "</span></div>";
  }

  function fillLittleSlot() {
    if (!littlePlaced) {
      slotLittle.dataset.empty = "true";
      slotLittle.innerHTML = "";
      return;
    }
    slotLittle.dataset.empty = "false";
    slotLittle.classList.remove("pulse");
    slotLittle.innerHTML = '<span class="well-chip">' + littlePlaced.w + "</span>";
  }

  function renderSlots() {
    fillCardSlot(slotVerb, verbPlaced);
    fillCardSlot(slotNoun, nounPlaced);
    fillLittleSlot();
  }

  function clearSlots(returnCards) {
    verbPlaced = null;
    nounPlaced = null;
    if (littlePlaced && littlePlaced.chip) {
      littlePlaced.chip.placed = false;
      littlePlaced.chip.el.style.opacity = "1";
      littlePlaced.chip.el.style.pointerEvents = "auto";
    }
    littlePlaced = null;
    if (returnCards) {
      Array.prototype.forEach.call(deckEl.querySelectorAll(".flashcard"), function (c) {
        c.classList.remove("used-ghost", "is-inspect", "dragging");
        c.classList.add("in-rail");
        c.style.transition = "transform 420ms cubic-bezier(.2,1.1,.3,1)";
      });
    }
    renderSlots();
  }

  function placeCard(item, well) {
    if (well !== "verb" && well !== "noun") {
      well = !verbPlaced ? "verb" : "noun";
    }
    if (well === "verb") {
      if (verbPlaced && verbPlaced.w !== item.w) returnCard(verbPlaced.w);
      verbPlaced = item;
    } else {
      if (nounPlaced && nounPlaced.w !== item.w) returnCard(nounPlaced.w);
      nounPlaced = item;
    }
    speakWord(item.w);
    buzz();
    renderSlots();
    afterPlace();
  }

  function placeLittle(chip) {
    if (locked) return;
    if (littlePlaced && littlePlaced.chip && littlePlaced.chip !== chip) {
      littlePlaced.chip.placed = false;
      littlePlaced.chip.el.style.opacity = "1";
      littlePlaced.chip.el.style.pointerEvents = "auto";
    }
    littlePlaced = { w: chip.word, chip: chip };
    chip.placed = true;
    chip.held = false;
    selectedChip = null;
    resetChipHome(chip);
    chip.el.style.opacity = "0";
    chip.el.style.pointerEvents = "none";
    speakWord(chip.word);
    buzz();
    renderSlots();
    afterPlace();
  }

  function resolveOutcome() {
    var stage = currentStage();
    var v = verbPlaced && verbPlaced.w;
    var n = nounPlaced && nounPlaced.w;
    var little = littlePlaced && littlePlaced.w;

    if (!v || !n) return null;
    if (v === stage.verb && n === stage.noun) {
      if (little && little !== "the") return { type: "fail", clip: "fail" };
      return { type: "win" };
    }
    var verbClips = { jump: "fail-jump", swim: "fail-swim", fly: "fail-fly", scream: "fail-scream", run: "fail-run" };
    var clip = (stage.instantVerbs && stage.instantVerbs[v]) || verbClips[v];
    if (clip) return { type: "fail", clip: clip };
    var pair = v + "+" + n;
    if (stage.pairFails[pair]) return { type: "fail", clip: stage.pairFails[pair] };
    return { type: "fail", clip: "fail" };
  }

  function afterPlace() {
    var outcome = resolveOutcome();
    if (!outcome) return;
    locked = true;
    later(380, function () {
      if (outcome.type === "win") runWinCinema();
      else runFailCinema(outcome.clip);
    });
  }

  /* ---------- little words ---------- */
  function trayTop() {
    return $("tray").getBoundingClientRect().top;
  }

  function resetChipHome(chip) {
    var el = chip.el;
    chip.held = false;
    el.classList.remove("held", "wild");
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.transform = "";
    el.style.zIndex = "";
    if (!chip.placed) {
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    }
  }

  function spawnChips() {
    zeroEl.innerHTML = "";
    chips = [];
    selectedChip = null;
    LITTLES.forEach(function (word) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "chip" + (word === "the" ? " chip-the home-the" : "");
      el.textContent = word;
      zeroEl.appendChild(el);
      var chip = {
        word: word,
        el: el,
        held: false,
        placed: false
      };
      bindChip(chip);
      chips.push(chip);
    });
  }

  function slotCenter(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r };
  }

  function nearLittleAt(x, y) {
    var c = slotCenter(slotLittle);
    var dx = x - c.x;
    var dy = y - c.y;
    return (dx * dx + dy * dy) < 70 * 70;
  }

  function bindChip(chip) {
    var el = chip.el;
    var sx, sy, ox, oy, moved;

    function down(e) {
      if (locked || chip.placed) return;
      e.preventDefault();
      var p = e.touches ? e.touches[0] : e;
      var r = el.getBoundingClientRect();
      sx = p.clientX;
      sy = p.clientY;
      ox = r.left;
      oy = r.top;
      moved = false;
      chip.held = true;
      el.classList.add("held");
      el.style.position = "fixed";
      el.style.left = ox + "px";
      el.style.top = oy + "px";
      el.style.width = r.width + "px";
      el.style.transform = "none";
      el.style.zIndex = "40";
      if (el.setPointerCapture && e.pointerId != null) el.setPointerCapture(e.pointerId);
    }

    function move(e) {
      if (!chip.held) return;
      var p = e.touches ? e.touches[0] : e;
      var dx = p.clientX - sx;
      var dy = p.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      var x = ox + dx;
      var y = oy + dy;
      if (nearLittleAt(x + el.offsetWidth / 2, y + el.offsetHeight / 2)) {
        var c = slotCenter(slotLittle);
        x = c.x - el.offsetWidth / 2;
        y = c.y - el.offsetHeight / 2;
      }
      el.style.left = x + "px";
      el.style.top = y + "px";
    }

    function up(e) {
      if (!chip.held) return;
      chip.held = false;
      el.classList.remove("held");
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      if (nearLittleAt(cx, cy)) {
        placeLittle(chip);
        return;
      }
      resetChipHome(chip);
      if (!moved) {
        el.classList.add("wild");
        later(900, function () { el.classList.remove("wild"); });
        if (selectedChip && selectedChip !== chip) selectedChip.el.classList.remove("wild");
        selectedChip = chip;
      }
    }

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  function tick() {
    /* chips stay put in the word box — no float / wander */
  }

  function scoopWords() {
    scoopBtn.classList.remove("whoosh");
    void scoopBtn.offsetWidth;
    scoopBtn.classList.add("whoosh");
    if (littlePlaced && littlePlaced.chip) {
      littlePlaced.chip.placed = false;
      littlePlaced = null;
      renderSlots();
    }
    chips.forEach(function (c) {
      c.placed = false;
      resetChipHome(c);
    });
    selectedChip = null;
    buzz();
  }

  /* ---------- stage life ---------- */
  function paintMarks() {
    var dots = marksEl.querySelectorAll("i");
    var i;
    for (i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("on", i <= stageIndex);
    }
  }

  function startStage() {
    var stage = currentStage();
    bumpCinema();
    locked = false;
    verbPlaced = null;
    nounPlaced = null;
    littlePlaced = null;
    inspecting = null;
    hideStamp();
    screenPlay.classList.remove("cinema", "holding");
    hideStills(true);
    hideVideo(true);
    preloadStage(stage);
    if (STAGES[stageIndex + 1]) preloadStage(STAGES[stageIndex + 1]);
    paintMarks();
    if (stageIndex === 0) {
      startJourney();
      return;
    }
    stopJourney();
    setBaseDanger(stage);
    renderSlots();
    slotVerb.classList.add("pulse");
    slotNoun.classList.add("pulse");
    renderDeck();
    spawnChips();
    layoutDeck();
  }

  function startGame() {
    stageIndex = 0;
    showScreen("play");
    startStage();
  }

  scoopBtn.addEventListener("click", function () {
    if (locked) return;
    scoopWords();
  });

  function returnCard(word) {
    var c = deckEl.querySelector('.flashcard[data-word="' + word + '"]');
    if (!c) return;
    c.classList.remove("used-ghost", "is-inspect", "dragging");
    c.classList.add("in-rail");
    c.style.transition = "transform 420ms cubic-bezier(.2,1.1,.3,1)";
  }

  function onColorWell(role) {
    if (locked) return;
    if (inspecting) {
      if (!inspectReady) return;
      useInspected(role);
      return;
    }
    if (role === "verb" && verbPlaced) {
      var vw = verbPlaced.w;
      verbPlaced = null;
      returnCard(vw);
      renderSlots();
      layoutDeck();
      pulseMatchWells();
    } else if (role === "noun" && nounPlaced) {
      var nw = nounPlaced.w;
      nounPlaced = null;
      returnCard(nw);
      renderSlots();
      layoutDeck();
      pulseMatchWells();
    }
  }

  slotVerb.addEventListener("click", function () { onColorWell("verb"); });
  slotNoun.addEventListener("click", function () { onColorWell("noun"); });

  slotLittle.addEventListener("click", function () {
    if (locked) return;
    if (inspecting) {
      if (inspectReady) snapInspectHome(inspecting);
      return;
    }
    if (littlePlaced && littlePlaced.chip) {
      littlePlaced.chip.placed = false;
      littlePlaced.chip.el.style.opacity = "1";
      littlePlaced.chip.el.style.pointerEvents = "auto";
      littlePlaced = null;
      renderSlots();
      return;
    }
    if (selectedChip && !selectedChip.placed) placeLittle(selectedChip);
  });

  $("btn-start").addEventListener("click", startGame);
  $("btn-again").addEventListener("click", startGame);
  if (location.hash === "#play") startGame();

  window.addEventListener("resize", function () {
    if (screenPlay.classList.contains("hidden")) return;
    layoutDeck();
    if (inspecting) {
      inspectHome = inspectPos(inspecting);
      snapInspectHome(inspecting);
    }
    if (journeyMode) {
      layoutHotspots();
      if (journeyInspecting) {
        inspectHome = inspectPos(journeyInspecting);
        snapInspectHome(journeyInspecting);
      }
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && window.speechSynthesis) {
      try { speechSynthesis.cancel(); } catch (e) {}
    }
  });

  document.addEventListener("touchmove", function (e) {
    if (e.target.closest(".chip") || e.target.closest(".flashcard")) return;
    e.preventDefault();
  }, { passive: false });

  preloadImage("img/sam-title.png");
  preloadImage("img/s3-win.png");
  preloadImage("img/icon-grab.png");
  Object.keys(ICONS).forEach(function (k) { preloadImage(ICONS[k]); });
  /* ---------- journey (stage 1) ---------- */
  function sceneCoverRect() {
    var scene = $("scene");
    var cw = scene.clientWidth || window.innerWidth;
    var ch = scene.clientHeight || window.innerHeight;
    var iw = 1536;
    var ih = 1024;
    var ir = iw / ih;
    var cr = cw / ch;
    var w, h, x, y;
    if (cr > ir) {
      w = cw;
      h = cw / ir;
      x = 0;
      y = (ch - h) / 2;
    } else {
      w = ch * ir;
      h = ch;
      y = 0;
      x = (cw - w) / 2;
    }
    return { x: x, y: y, w: w, h: h };
  }

  function hideHoverPop() {
    hoverPop.classList.add("hidden");
  }

  function showHoverPop(word, clientX, clientY) {
    var img = hoverPop.querySelector("img");
    var lab = hoverPop.querySelector(".hp-word");
    img.src = CARD_PIC[word] || "";
    lab.textContent = word;
    hoverPop.classList.remove("hidden");
    placeHoverPop(clientX, clientY);
  }

  function placeHoverPop(clientX, clientY) {
    var pad = 16;
    var w = hoverPop.offsetWidth || 92;
    var h = hoverPop.offsetHeight || 80;
    var x = clientX + 18;
    var y = clientY + 18;
    if (x + w > window.innerWidth - pad) x = clientX - w - 12;
    if (y + h > window.innerHeight - pad) y = clientY - h - 12;
    if (x < pad) x = pad;
    if (y < pad) y = pad;
    hoverPop.style.left = x + "px";
    hoverPop.style.top = y + "px";
    hoverPop.style.transform = "none";
  }

  function layoutHotspots() {
    if (!journeyMode) return;
    var box = sceneCoverRect();
    var nodes = hotspotsEl.children;
    var i, el, hs;
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      hs = el._hs;
      if (!hs) continue;
      el.style.left = (box.x + hs.x / 100 * box.w) + "px";
      el.style.top = (box.y + hs.y / 100 * box.h) + "px";
      el.style.width = (hs.w / 100 * box.w) + "px";
      el.style.height = (hs.h / 100 * box.h) + "px";
    }
    layoutBirdBob();
  }

  function layoutBirdBob() {
    if (!birdBobbed || journeyScene !== 2) {
      birdBobEl.classList.add("hidden");
      return;
    }
    var box = sceneCoverRect();
    var hs = JOURNEY[2].hotspots.filter(function (h) { return h.id === "bird"; })[0];
    var x = box.x + hs.x / 100 * box.w;
    var y = box.y + hs.y / 100 * box.h;
    var w = hs.w / 100 * box.w;
    var h = hs.h / 100 * box.h;
    var grow = 1.35;
    var nw = w * grow;
    var nh = h * grow;
    birdBobEl.style.left = (x - (nw - w) / 2) + "px";
    birdBobEl.style.top = (y - (nh - h) / 2) + "px";
    birdBobEl.style.width = nw + "px";
    birdBobEl.style.height = nh + "px";
    birdBobEl.src = "img/journey/bird-bob.png";
    birdBobEl.classList.remove("hidden");
  }

  function bindHotspot(el, hs) {
    el.addEventListener("pointerenter", function (e) {
      if (locked || journeyInspecting) return;
      showHoverPop(hs.word, e.clientX, e.clientY);
    });
    el.addEventListener("pointermove", function (e) {
      if (locked || journeyInspecting) return;
      if (hoverPop.classList.contains("hidden")) showHoverPop(hs.word, e.clientX, e.clientY);
      else placeHoverPop(e.clientX, e.clientY);
    });
    el.addEventListener("pointerleave", function () {
      hideHoverPop();
    });
    el.addEventListener("click", function (e) {
      if (locked) return;
      e.preventDefault();
      e.stopPropagation();
      if (hs.click === "next") {
        hideHoverPop();
        nextJourneyScene();
        return;
      }
      if (hs.click === "bird") {
        birdBobbed = true;
        layoutBirdBob();
        speakWord("bird");
        buzz();
        return;
      }
      if (hs.click === "vine") {
        if (grabArmed) {
          hideHoverPop();
          disarmGrab();
          runWinCinema();
          return;
        }
        showHoverPop(hs.word, e.clientX, e.clientY);
        speakWord(hs.word);
        return;
      }
      speakWord(hs.word);
    });
  }

  function buildHotspots(sc) {
    hotspotsEl.innerHTML = "";
    sc.hotspots.forEach(function (hs) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "hotspot";
      el.setAttribute("aria-label", hs.word);
      el._hs = hs;
      bindHotspot(el, hs);
      hotspotsEl.appendChild(el);
    });
    hotspotsEl.classList.remove("hidden");
    layoutHotspots();
  }

  function makeJourneyCard(word, index) {
    var item = { w: word, role: word === "grab" ? "verb" : "noun", pic: CARD_PIC[word], say: "" };
    var card = document.createElement("div");
    card.className = "flashcard in-rail journey-card";
    card.setAttribute("data-word", word);
    card._item = item;
    card._index = index;

    var spin = document.createElement("div");
    spin.className = "card-spin";
    var front = document.createElement("div");
    front.className = "face front";
    front.innerHTML =
      '<div class="art"><img alt="" src="' + item.pic + '"></div>' +
      '<div class="word">' + word + "</div>";
    spin.appendChild(front);
    card.appendChild(spin);

    card.addEventListener("click", function (e) {
      if (locked) return;
      e.preventDefault();
      e.stopPropagation();
      if (journeyInspecting === card) {
        if (word === "grab") armGrab();
        closeJourneyInspect(false);
        return;
      }
      if (journeyInspecting) closeJourneyInspect(true);
      if (word === "grab") armGrab();
      openJourneyInspect(card);
    });
    return card;
  }

  function renderJourneyCards() {
    deckEl.innerHTML = "";
    journeyInspecting = null;
    inspectHome = null;
    JOURNEY_WORDS.forEach(function (w, i) {
      deckEl.appendChild(makeJourneyCard(w, i));
    });
    layoutDeck();
  }

  function openJourneyInspect(card) {
    if (locked || journeyInspecting) return;
    journeyInspecting = card;
    inspectReady = true;
    screenPlay.classList.add("holding");
    hideHoverPop();
    var r = card.getBoundingClientRect();
    card.classList.add("is-inspect");
    card.classList.remove("in-rail");
    card.style.width = "";
    card.style.height = "";
    card.style.zIndex = "80";
    var tw = card.offsetWidth;
    var home = inspectPos(card);
    inspectHome = home;
    card.style.transition = "none";
    setCardTransform(card, r.left, r.top, card._rot || 0, r.width / tw);
    layoutDeck();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        card.style.transition = "transform 540ms cubic-bezier(.18,1.15,.28,1)";
        setCardTransform(card, home.x, home.y, 0, 1);
      });
    });
    speakWord(card._item.w);
    buzz();
  }

  function closeJourneyInspect(instant) {
    if (!journeyInspecting) {
      screenPlay.classList.remove("holding");
      return;
    }
    var card = journeyInspecting;
    journeyInspecting = null;
    inspectHome = null;
    screenPlay.classList.remove("holding");
    card.classList.remove("is-inspect", "dragging");
    card.classList.add("in-rail");
    if (instant) card.style.transition = "none";
    else card.style.transition = "transform 420ms cubic-bezier(.2,1.1,.3,1)";
    layoutDeck();
  }

  function armGrab() {
    grabArmed = true;
    screenPlay.classList.add("grab-on");
    document.body.style.cursor = "url('img/journey/grab-cursor.png') 16 16, url('img/journey/grab-32.png') 16 16, pointer";
    speakWord("grab");
    buzz();
  }

  function disarmGrab() {
    grabArmed = false;
    screenPlay.classList.remove("grab-on");
    document.body.style.cursor = "";
  }

  function showJourneyScene() {
    var sc = JOURNEY[journeyScene];
    hideHoverPop();
    closeJourneyInspect(true);
    ph.classList.remove("on");
    sceneBase.src = sc.img;
    sceneBase.alt = "";
    sceneBase.classList.add("on");
    hideStills(true);
    hideVideo(true);
    buildHotspots(sc);
    fwdBtn.classList.toggle("hidden", !sc.forward);
    if (sc.cards) renderJourneyCards();
    else {
      deckEl.innerHTML = "";
      journeyInspecting = null;
    }
    if (journeyScene !== 2) birdBobbed = birdBobbed && false;
    layoutBirdBob();
  }

  function nextJourneyScene() {
    if (journeyScene >= JOURNEY.length - 1) return;
    journeyScene += 1;
    showJourneyScene();
    buzz();
  }

  function startJourney() {
    journeyMode = true;
    journeyScene = 0;
    grabArmed = false;
    birdBobbed = false;
    journeyInspecting = null;
    disarmGrab();
    screenPlay.classList.add("journey");
    screenPlay.classList.remove("holding");
    zeroEl.innerHTML = "";
    chips = [];
    slotVerb.innerHTML = "";
    slotNoun.innerHTML = "";
    slotLittle.innerHTML = "";
    showJourneyScene();
  }

  function stopJourney() {
    journeyMode = false;
    journeyInspecting = null;
    hideHoverPop();
    disarmGrab();
    screenPlay.classList.remove("journey", "grab-on");
    hotspotsEl.innerHTML = "";
    hotspotsEl.classList.add("hidden");
    birdBobEl.classList.add("hidden");
    fwdBtn.classList.add("hidden");
  }

  fwdBtn.addEventListener("click", function () {
    if (locked || !journeyMode) return;
    nextJourneyScene();
  });

  dimEl.addEventListener("click", function () {
    if (!journeyMode || locked) return;
    if (journeyInspecting) closeJourneyInspect(false);
  });

  preloadStage(STAGES[0]);
  preloadJourney();
  /* no chip drift loop */
})();
