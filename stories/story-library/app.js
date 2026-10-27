(function () {
  "use strict";

  const STORE_KID = "storyLibrary.kid";
  const STORE_MODE = "storyLibrary.mode";

  const els = {
    title: document.getElementById("screen-title"),
    library: document.getElementById("screen-library"),
    book: document.getElementById("screen-book"),
    kidGrid: document.getElementById("kid-grid"),
    libBg: document.getElementById("lib-bg"),
    librarian: document.getElementById("librarian"),
    readerKid: document.getElementById("reader-kid"),
    shelf: document.getElementById("book-shelf"),
    modeStudent: document.getElementById("mode-student"),
    modeLibrarian: document.getElementById("mode-librarian"),
    changeKid: document.getElementById("btn-change-kid"),
    backLib: document.getElementById("btn-library"),
    progress: document.getElementById("page-progress"),
    libInset: document.getElementById("lib-inset"),
    wordBtn: document.getElementById("btn-wordcard"),
    pageArt: document.getElementById("page-art"),
    artImg: document.getElementById("art-img"),
    artPh: document.getElementById("art-ph"),
    storyText: document.getElementById("story-text"),
    hopper: document.getElementById("hopper"),
    bookEl: document.getElementById("book"),
    bookFrame: document.getElementById("book-frame"),
    prev: document.getElementById("btn-prev"),
    next: document.getElementById("btn-next"),
    toast: document.getElementById("toast"),
    cardOverlay: document.getElementById("card-overlay"),
    cardWord: document.getElementById("card-word"),
    cardDef: document.getElementById("card-def"),
    cardEx: document.getElementById("card-ex"),
    closeCard: document.getElementById("btn-close-card"),
    artOverlay: document.getElementById("art-overlay"),
    artFull: document.getElementById("art-full-img"),
    artCap: document.getElementById("art-full-cap"),
    closeArt: document.getElementById("btn-close-art")
  };

  const state = {
    kidId: localStorage.getItem(STORE_KID) || null,
    mode: localStorage.getItem(STORE_MODE) === "librarian" ? "librarian" : "student",
    page: 0,
    wordIndex: 0,
    words: [],
    toastTimer: 0
  };

  function showScreen(name) {
    els.title.hidden = name !== "title";
    els.library.hidden = name !== "library";
    els.book.hidden = name !== "book";
  }

  function kidById(id) {
    return KIDS.find((k) => k.id === id) || null;
  }

  function probeImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(false);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  const imgCache = Object.create(null);

  function loadImg(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function punchCream(img, crop) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    function isBg(i) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
      const sat = max ? (max - min) / max : 0;
      const lum = (r + g + b) / 3;
      return lum > 208 && sat < 0.24 && r + 6 >= g && g + 10 >= b;
    }
    const seen = new Uint8Array(w * h);
    const stack = [];
    function push(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (seen[p]) return;
      if (!isBg(p * 4)) return;
      seen[p] = 1;
      stack.push(p);
    }
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const p = stack.pop();
      d[p * 4 + 3] = 0;
      const x = p % w;
      const y = (p / w) | 0;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
    ctx.putImageData(imageData, 0, 0);
    if (!crop) return canvas.toDataURL("image/png");
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 16) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX <= minX) return canvas.toDataURL("image/png");
    const pad = 6;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d").drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
    return out.toDataURL("image/png");
  }

  function preparedUrl(src, punch, crop) {
    const pre = punch && window.__SL_CUT && window.__SL_CUT[(crop ? "c:" : "") + src];
    if (pre) return Promise.resolve(pre);
    const key = (punch ? "p:" : "r:") + (crop ? "c:" : "") + src;
    if (!imgCache[key]) {
      imgCache[key] = loadImg(src).then((img) => {
        if (!img) return null;
        return punch ? punchCream(img, crop) : src;
      });
    }
    return imgCache[key];
  }

  function stripPunct(raw) {
    return raw
      .replace(/^[^\p{L}\p{N}]+/u, "")
      .replace(/[^\p{L}\p{N}]+$/u, "")
      .replace(/[’']/g, "'");
  }

  function vocabMatch(core) {
    const c = stripPunct(core).toLowerCase();
    if (!c) return null;
    for (const v of VOCAB) {
      const w = v.word.toLowerCase();
      if (c === w) return v;
      if (c === w + "s" || c === w + "es") return v;
      if (c === w + "ed" || c === w + "d") return v;
      if (c === w + "ing") return v;
    }
    return null;
  }

  /* ----- Title / kids ----- */
  function renderKids() {
    els.kidGrid.innerHTML = "";
    KIDS.forEach((kid) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kid-card" + (state.kidId === kid.id ? " is-selected" : "");
      btn.setAttribute("role", "listitem");
      btn.innerHTML =
        '<span class="kid-portrait">' +
        '<span class="art"></span>' +
        '<span class="ph"><span class="ph-kid"></span></span>' +
        "</span><b></b>";
      btn.querySelector("b").textContent = kid.name;
      const phKid = btn.querySelector(".ph-kid");
      phKid.style.setProperty("--skin", kid.skin);
      phKid.style.setProperty("--hair", kid.hair);
      phKid.style.setProperty("--shirt", kid.shirt);
      const portrait = btn.querySelector(".kid-portrait");
      const art = btn.querySelector(".art");
      preparedUrl(kid.src, true).then((url) => {
        if (url) art.style.backgroundImage = "url('" + url + "')";
        else portrait.classList.add("no-img");
      });
      btn.addEventListener("click", () => pickKid(kid.id));
      els.kidGrid.appendChild(btn);
    });
  }

  function pickKid(id) {
    state.kidId = id;
    localStorage.setItem(STORE_KID, id);
    renderKids();
    window.setTimeout(() => enterLibrary(), 180);
  }

  /* ----- Library ----- */
  function setMode(mode) {
    state.mode = mode === "librarian" ? "librarian" : "student";
    localStorage.setItem(STORE_MODE, state.mode);
    els.modeStudent.classList.toggle("is-on", state.mode === "student");
    els.modeLibrarian.classList.toggle("is-on", state.mode === "librarian");
  }

  function paintReaderSprite() {
    const kid = kidById(state.kidId);
    const art = els.readerKid.querySelector(".sprite-art");
    const fb = els.readerKid.querySelector(".kid-fallback");
    els.readerKid.classList.remove("has-img");
    if (!kid) return;
    fb.style.setProperty("--skin", kid.skin);
    fb.style.setProperty("--hair", kid.hair);
    fb.style.setProperty("--shirt", kid.shirt);
    preparedUrl(kid.src, true).then((url) => {
      if (url) {
        art.style.backgroundImage = "url('" + url + "')";
        els.readerKid.classList.add("has-img");
      }
    });
  }

  function renderShelf() {
    els.shelf.innerHTML = "";
    SHELF_BOOKS.forEach((book) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-tile" + (book.unlocked ? " unlocked" : " locked");
      btn.style.setProperty("--tint", book.tint);
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-label", book.title + (book.unlocked ? "" : ", coming soon"));
      btn.innerHTML =
        (book.unlocked ? "" : '<span class="lock" aria-hidden="true">🔒</span>') +
        '<span class="spine-title"></span>';
      btn.querySelector(".spine-title").textContent = book.title;
      if (book.unlocked && book.cover) {
        probeImage(book.cover).then((ok) => {
          if (ok) btn.style.backgroundImage = "url('" + book.cover + "')";
          else btn.classList.add("no-cover");
        });
      }
      btn.addEventListener("click", () => {
        if (!book.unlocked) {
          showToast("Coming soon");
          return;
        }
        btn.classList.add("opening");
        window.setTimeout(() => {
          btn.classList.remove("opening");
          openBook();
        }, 280);
      });
      els.shelf.appendChild(btn);
    });
  }

  function enterLibrary() {
    if (!state.kidId) {
      showScreen("title");
      return;
    }
    showScreen("library");
    setMode(state.mode);
    paintReaderSprite();
    probeImage("assets/library-background.png").then((ok) => {
      els.libBg.classList.toggle("no-img", !ok);
    });
    const libArt = els.librarian.querySelector(".sprite-art");
    preparedUrl("assets/librarian.png", true).then((url) => {
      if (url) {
        libArt.style.backgroundImage = "url('" + url + "')";
        els.librarian.classList.add("has-img");
      } else {
        els.librarian.classList.remove("has-img");
      }
    });
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 1800);
  }

  /* ----- Book ----- */
  function tokenize(text) {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map((p) => {
      const parts = [];
      const re = /(\s+)|([^\s]+)/g;
      let m;
      while ((m = re.exec(p))) {
        if (m[1]) {
          if (m[1].includes("\n")) parts.push({ type: "br" });
          else parts.push({ type: "space", text: m[1] });
        } else {
          const raw = m[2];
          const core = stripPunct(raw);
          parts.push({
            type: "word",
            text: raw,
            core: core,
            vocab: vocabMatch(core)
          });
        }
      }
      return parts;
    });
  }

  function renderPage() {
    const page = STORY.pages[state.page];
    els.progress.textContent = "Page " + page.n + " of " + STORY.pages.length;
    els.prev.disabled = state.page === 0;
    els.next.disabled = state.page === STORY.pages.length - 1;
    els.artPh.setAttribute("data-label", page.artLabel);
    els.pageArt.classList.add("no-art");
    els.artImg.style.backgroundImage = "";
    probeImage(page.art).then((ok) => {
      if (state.page !== STORY.pages.indexOf(page)) return;
      if (ok) {
        els.artImg.style.backgroundImage = "url('" + page.art + "')";
        els.pageArt.classList.remove("no-art");
      }
    });

    const tokens = tokenize(page.text);
    els.storyText.innerHTML = "";
    state.words = [];
    tokens.forEach((para) => {
      const p = document.createElement("p");
      para.forEach((t) => {
        if (t.type === "space") {
          p.appendChild(document.createTextNode(t.text));
        } else if (t.type === "br") {
          p.appendChild(document.createElement("br"));
        } else {
          const span = document.createElement("span");
          span.className = "word" + (t.vocab ? " vocab" : "");
          span.textContent = t.text;
          span.dataset.index = String(state.words.length);
          if (t.vocab) span.dataset.vocab = t.vocab.word;
          span.addEventListener("click", () => hopTo(Number(span.dataset.index)));
          p.appendChild(span);
          state.words.push({ el: span, vocab: t.vocab || null });
        }
      });
      els.storyText.appendChild(p);
    });

    state.wordIndex = 0;
    window.requestAnimationFrame(() => hopTo(0, true));
    updateChrome();
  }

  function currentWord() {
    return state.words[state.wordIndex] || null;
  }

  function updateChrome() {
    const w = currentWord();
    const has = !!(w && w.vocab);
    els.wordBtn.disabled = !has;
    els.wordBtn.classList.toggle("is-lit", has);
    els.libInset.hidden = state.mode !== "librarian";
  }

  function wordBox(el) {
    const a = el.getBoundingClientRect();
    return {
      left: a.left,
      top: a.top,
      width: a.width,
      height: a.height,
      cx: a.left + a.width / 2,
      midY: a.top
    };
  }

  function placeHopper(instant) {
    const w = currentWord();
    if (!w) return;
    const parent = els.hopper.offsetParent || els.bookEl;
    const pref = parent.getBoundingClientRect();
    const r = w.el.getBoundingClientRect();
    const x = r.left + r.width / 2 - pref.left - 11;
    const y = r.top - pref.top - 18;
    els.hopper.style.setProperty("--x", x + "px");
    els.hopper.style.setProperty("--y", y + "px");
    els.hopper.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    els.hopper.classList.add("is-on");
    if (!instant) {
      els.hopper.classList.remove("bounce");
      void els.hopper.offsetWidth;
      els.hopper.classList.add("bounce");
    }
  }

  function gatherLines() {
    const lines = [];
    state.words.forEach((w, i) => {
      const box = wordBox(w.el);
      let line = lines.find((l) => Math.abs(l.top - box.midY) < 8);
      if (!line) {
        line = { top: box.midY, items: [] };
        lines.push(line);
      }
      line.items.push({ i: i, cx: box.cx });
    });
    lines.sort((a, b) => a.top - b.top);
    return lines;
  }

  function pageRead() {
    try { window.LWProgress && LWProgress.unit("stories/story-library", "p" + STORY.pages[state.page].n, STORY.pages.length); } catch (e) {}
  }

  function hopTo(index, instant) {
    if (!state.words.length) return;
    index = Math.max(0, Math.min(state.words.length - 1, index));
    if (index === state.words.length - 1 && state.page === STORY.pages.length - 1) pageRead(); // reached the last word of the last page
    state.words.forEach((w) => w.el.classList.remove("current"));
    state.wordIndex = index;
    const w = state.words[index];
    w.el.classList.add("current");
    w.el.scrollIntoView({ block: "nearest", inline: "nearest" });
    placeHopper(instant);
    updateChrome();
  }

  function moveWord(dir) {
    if (dir === "left") hopTo(state.wordIndex - 1);
    if (dir === "right") hopTo(state.wordIndex + 1);
    if (dir === "up" || dir === "down") {
      const lines = gatherLines();
      const cur = wordBox(state.words[state.wordIndex].el);
      let lineI = lines.findIndex((l) => l.items.some((it) => it.i === state.wordIndex));
      if (lineI < 0) return;
      const nextI = dir === "up" ? lineI - 1 : lineI + 1;
      if (nextI < 0 || nextI >= lines.length) return;
      const target = lines[nextI].items.reduce((best, it) => {
        return Math.abs(it.cx - cur.cx) < Math.abs(best.cx - cur.cx) ? it : best;
      });
      hopTo(target.i);
    }
  }

  function turnPage(delta) {
    const next = state.page + delta;
    if (next < 0 || next >= STORY.pages.length) return;
    els.bookEl.classList.remove("flip-next", "flip-prev");
    void els.bookEl.offsetWidth;
    els.bookEl.classList.add(delta > 0 ? "flip-next" : "flip-prev");
    if (delta > 0) pageRead(); // turning forward = this page was read (ring on the library card)
    state.page = next;
    renderPage();
  }

  function openWordCard() {
    const w = currentWord();
    if (!w || !w.vocab) return;
    els.cardWord.textContent = w.vocab.word;
    els.cardDef.textContent = w.vocab.def;
    els.cardEx.textContent = "“" + w.vocab.example + "”";
    els.cardOverlay.hidden = false;
    els.closeCard.focus();
  }

  function closeWordCard() {
    els.cardOverlay.hidden = true;
  }

  function openArt() {
    const page = STORY.pages[state.page];
    els.artFull.style.backgroundImage = els.pageArt.classList.contains("no-art")
      ? ""
      : "url('" + page.art + "')";
    if (els.pageArt.classList.contains("no-art")) {
      els.artFull.style.backgroundImage = getComputedStyle(els.artPh).backgroundImage;
    }
    els.artCap.textContent = page.artLabel;
    els.artOverlay.hidden = false;
  }

  function closeArt() {
    els.artOverlay.hidden = true;
  }

  function openBook() {
    showScreen("book");
    state.page = 0;
    els.libInset.hidden = state.mode !== "librarian";
    probeImage("assets/open-book-frame.png").then((ok) => {
      els.bookFrame.classList.toggle("has-img", ok);
      els.bookEl.classList.toggle("has-frame", ok);
      if (ok) els.bookFrame.style.backgroundImage = "url('assets/open-book-frame.png')";
    });
    preparedUrl("assets/librarian.png", true).then((url) => {
      const inset = els.libInset.querySelector(".inset-art");
      if (url) inset.style.backgroundImage = "url('" + url + "')";
    });
    preparedUrl("assets/hopper-ball.png", true, true).then((url) => {
      if (url) {
        els.hopper.classList.add("has-img");
        els.hopper.style.backgroundImage = "url('" + url + "')";
      }
    });
    renderPage();
  }

  /* ----- Events ----- */
  function onKey(e) {
    if (els.book.hidden) return;
    if (!els.cardOverlay.hidden) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        closeWordCard();
      }
      return;
    }
    if (!els.artOverlay.hidden) {
      if (e.key === "Escape") closeArt();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveWord("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveWord("right");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveWord("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveWord("down");
    } else if (e.key === "Enter") {
      e.preventDefault();
      openWordCard();
    } else if (e.key === "PageDown" || e.key === "]") {
      e.preventDefault();
      turnPage(1);
    } else if (e.key === "PageUp" || e.key === "[") {
      e.preventDefault();
      turnPage(-1);
    } else if (e.key === "Escape") {
      showScreen("library");
    }
  }

  function bind() {
    els.changeKid.addEventListener("click", () => {
      showScreen("title");
      renderKids();
    });
    els.modeStudent.addEventListener("click", () => setMode("student"));
    els.modeLibrarian.addEventListener("click", () => setMode("librarian"));
    els.librarian.addEventListener("click", () => {
      setMode("librarian");
      openBook();
    });
    els.backLib.addEventListener("click", () => enterLibrary());
    els.prev.addEventListener("click", () => turnPage(-1));
    els.next.addEventListener("click", () => turnPage(1));
    els.wordBtn.addEventListener("click", openWordCard);
    els.closeCard.addEventListener("click", closeWordCard);
    els.cardOverlay.addEventListener("click", (e) => {
      if (e.target === els.cardOverlay) closeWordCard();
    });
    els.pageArt.addEventListener("click", openArt);
    els.closeArt.addEventListener("click", closeArt);
    els.artOverlay.addEventListener("click", (e) => {
      if (e.target === els.artOverlay) closeArt();
    });
    document.querySelectorAll(".dpad-btn").forEach((btn) => {
      btn.addEventListener("click", () => moveWord(btn.dataset.dir));
    });
    document.addEventListener("keydown", onKey);
    els.storyText.addEventListener("scroll", () => {
      if (!els.book.hidden) placeHopper(true);
    });
    window.addEventListener("resize", () => {
      if (!els.book.hidden) placeHopper(true);
    });
  }

  function init() {
    bind();
    renderKids();
    renderShelf();
    setMode(state.mode);
    if (state.kidId && kidById(state.kidId)) enterLibrary();
    else showScreen("title");
  }

  init();
})();
