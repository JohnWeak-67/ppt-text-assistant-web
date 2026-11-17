"use strict";
(() => {
  // ../ppt-rule-engine/src/types.ts
  var RULE_METAS = {
    LEADING_SPACE: {
      ruleId: "LEADING_SPACE",
      severity: "error",
      defaultEnabled: true,
      description: "\u6BB5\u9996\u7A7A\u683C"
    },
    TRAILING_SPACE: {
      ruleId: "TRAILING_SPACE",
      severity: "hint",
      defaultEnabled: true,
      description: "\u6BB5\u5C3E\u7A7A\u683C"
    },
    CONSECUTIVE_SPACE: {
      ruleId: "CONSECUTIVE_SPACE",
      severity: "error",
      defaultEnabled: true,
      description: "\u8FDE\u7EED\u7A7A\u683C"
    },
    LINE_BREAK_LEADING_SPACE: {
      ruleId: "LINE_BREAK_LEADING_SPACE",
      severity: "error",
      defaultEnabled: true,
      description: "\u624B\u52A8\u6362\u884C\u540E\u884C\u9996\u7A7A\u683C"
    },
    CJK_ABNORMAL_SPACE: {
      ruleId: "CJK_ABNORMAL_SPACE",
      severity: "warning",
      defaultEnabled: true,
      description: "\u4E2D\u6587\u95F4\u5F02\u5E38\u7A7A\u683C"
    },
    WORD_SPLIT_BY_SPACE: {
      ruleId: "WORD_SPLIT_BY_SPACE",
      severity: "hint",
      defaultEnabled: false,
      description: "\u82F1\u6587\u5355\u8BCD\u88AB\u7A7A\u683C\u62C6\u5F00"
    },
    SPACE_BEFORE_PUNCTUATION: {
      ruleId: "SPACE_BEFORE_PUNCTUATION",
      severity: "hint",
      defaultEnabled: true,
      description: "\u6807\u70B9\u524D\u7A7A\u683C"
    },
    MIXED_WIDTH_SPACE: {
      ruleId: "MIXED_WIDTH_SPACE",
      severity: "hint",
      defaultEnabled: true,
      description: "\u5168\u89D2/\u534A\u89D2\u7A7A\u683C\u6DF7\u7528"
    },
    INVISIBLE_CHAR: {
      ruleId: "INVISIBLE_CHAR",
      severity: "hint",
      defaultEnabled: true,
      description: "\u5236\u8868\u7B26/\u4E0D\u53EF\u89C1\u5B57\u7B26"
    }
  };
  var RULE_IDS = Object.keys(RULE_METAS);

  // ../ppt-rule-engine/src/titleCase.ts
  var DEFAULT_MINOR_WORDS = [
    // articles
    "a",
    "an",
    "the",
    // coordinating conjunctions
    "and",
    "but",
    "or",
    "nor",
    "for",
    "so",
    "yet",
    // prepositions
    "of",
    "in",
    "on",
    "at",
    "to",
    "from",
    "by",
    "with",
    "about",
    "above",
    "across",
    "after",
    "against",
    "along",
    "amid",
    "among",
    "around",
    "as",
    "before",
    "behind",
    "below",
    "beneath",
    "beside",
    "between",
    "beyond",
    "during",
    "except",
    "inside",
    "into",
    "like",
    "near",
    "onto",
    "out",
    "over",
    "past",
    "per",
    "since",
    "than",
    "through",
    "till",
    "toward",
    "under",
    "until",
    "up",
    "upon",
    "via",
    "within",
    "without"
  ];
  var DEFAULT_PROTECTED_WORDS = {
    ai: "AI",
    api: "API",
    aws: "AWS",
    css: "CSS",
    chatgpt: "ChatGPT",
    ebay: "eBay",
    fifa: "FIFA",
    gitlab: "GitLab",
    github: "GitHub",
    gpt: "GPT",
    html: "HTML",
    iaas: "IaaS",
    ios: "iOS",
    ipad: "iPad",
    iphone: "iPhone",
    ipod: "iPod",
    json: "JSON",
    js: "JS",
    macos: "macOS",
    nasa: "NASA",
    nato: "NATO",
    paas: "PaaS",
    ppt: "PPT",
    pptx: "PPTX",
    saas: "SaaS",
    sdk: "SDK",
    sql: "SQL",
    ui: "UI",
    unesco: "UNESCO",
    ux: "UX",
    xml: "XML"
  };
  var SPLIT_DELIMITERS = /* @__PURE__ */ new Set(["-", ":", "/"]);
  function isSplitDelimiter(c) {
    return SPLIT_DELIMITERS.has(c) || /\s/.test(c);
  }
  function isWordChar(c) {
    return /[\p{L}\p{N}'’]/u.test(c);
  }
  function matchProtected(s, i) {
    const rest = s.slice(i);
    let m;
    if (m = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S*/i.exec(rest)) return trimTrailingPunct(m[0]);
    if (m = /^[a-z0-9._%+-]+@\S+/i.exec(rest)) return trimTrailingPunct(m[0]);
    if (m = /^[a-z]:[\\/]\S*/i.exec(rest)) return trimTrailingPunct(m[0]);
    if (m = /^\\\\\S*/.exec(rest)) return trimTrailingPunct(m[0]);
    if (m = /^[a-z](?:\.[a-z])+\.?/i.exec(rest)) return m[0];
    if (m = /^\d+(?:[.,]\d+)*/.exec(rest)) return m[0];
    return "";
  }
  var TRAILING_PUNCT_RE = /[.,;:!?)\]}\"'”’》」』）】]+$/;
  function trimTrailingPunct(s) {
    return s.replace(TRAILING_PUNCT_RE, "");
  }
  function tokenize(input) {
    const tokens = [];
    const n = input.length;
    let i = 0;
    while (i < n) {
      const prot = matchProtected(input, i);
      if (prot) {
        tokens.push({ kind: "protected", value: prot });
        i += prot.length;
        continue;
      }
      const c = input[i];
      if (isSplitDelimiter(c)) {
        tokens.push({ kind: "delim", value: c });
        i += 1;
        continue;
      }
      if (isWordChar(c)) {
        let j2 = i;
        while (j2 < n && isWordChar(input[j2])) j2 += 1;
        tokens.push({ kind: "word", value: input.slice(i, j2) });
        i = j2;
        continue;
      }
      let j = i;
      while (j < n && !isWordChar(input[j]) && !isSplitDelimiter(input[j])) j += 1;
      tokens.push({ kind: "punct", value: input.slice(i, j) });
      i = j;
    }
    return tokens;
  }
  function capitalizeFirst(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  function capitalizeFirstLowerRest(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  function toLowerSet(words) {
    const s = /* @__PURE__ */ new Set();
    for (const w of words) s.add(w.toLowerCase());
    return s;
  }
  function toProtectedMap(p) {
    const m = /* @__PURE__ */ new Map();
    if (p instanceof Map) {
      for (const [k, v] of p) m.set(k.toLowerCase(), v);
    } else {
      for (const k of Object.keys(p)) m.set(k.toLowerCase(), p[k]);
    }
    return m;
  }
  function lookupProtected(word, map) {
    const lower = word.toLowerCase();
    const exact = map.get(lower);
    if (exact !== void 0) return exact;
    const m = /^(.+)(['’]s)$/.exec(lower);
    if (m) {
      const stem = map.get(m[1]);
      if (stem !== void 0) return stem + word.slice(m[1].length);
    }
    return void 0;
  }
  function transformWord(word, ctx) {
    const protectedWord = lookupProtected(word, ctx.protectedMap);
    if (protectedWord !== void 0) return protectedWord;
    if (word.startsWith("'") || word.startsWith("\u2019")) {
      return ctx.forceCap ? capitalizeFirst(word) : word.toLowerCase();
    }
    if (ctx.forceCap) {
      return ctx.forceLower ? capitalizeFirstLowerRest(word) : capitalizeFirst(word);
    }
    if (ctx.minor.has(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return ctx.forceLower ? capitalizeFirstLowerRest(word) : capitalizeFirst(word);
  }
  function toTitleCase(input, options = {}) {
    if (input.length === 0) return input;
    const minor = toLowerSet(options.minorWords ?? DEFAULT_MINOR_WORDS);
    const protectedMap = toProtectedMap(options.protectedWords ?? DEFAULT_PROTECTED_WORDS);
    const hyphenStrategy = options.hyphenStrategy ?? "chicago";
    const capFirst = options.capitalizeFirstWord ?? true;
    const capLast = options.capitalizeLastWord ?? true;
    const capAfterColon = options.capitalizeAfterColon ?? true;
    const forceLower = options.forceLowercase ?? false;
    const tokens = tokenize(input);
    const wordIndices = [];
    for (let k = 0; k < tokens.length; k += 1) {
      if (tokens[k].kind === "word" || tokens[k].kind === "protected") wordIndices.push(k);
    }
    const firstIdx = wordIndices[0];
    const lastIdx = wordIndices[wordIndices.length - 1];
    let pendingCap = false;
    const out = [];
    for (let k = 0; k < tokens.length; k += 1) {
      const t = tokens[k];
      if (t.kind === "delim") {
        if (t.value === ":" && capAfterColon) pendingCap = true;
        else if (t.value === "-" && hyphenStrategy === "ap") pendingCap = true;
        out.push(t.value);
        continue;
      }
      if (t.kind === "punct") {
        out.push(t.value);
        continue;
      }
      const isFirst = k === firstIdx;
      const isLast = k === lastIdx;
      const forceCap = isFirst && capFirst || isLast && capLast || pendingCap;
      out.push(
        t.kind === "protected" ? t.value : transformWord(t.value, { minor, protectedMap, forceLower, forceCap })
      );
      pendingCap = false;
    }
    return out.join("");
  }

  // ../ppt-rule-engine/src/spaceRules.ts
  var SPACE_HALF = " ";
  var SPACE_NBSP = "\xA0";
  var SPACE_FULL = "\u3000";
  function isSpace(c) {
    return c === SPACE_HALF || c === SPACE_NBSP || c === SPACE_FULL;
  }
  function isHan(c) {
    const code = c.charCodeAt(0);
    return code >= 13312 && code <= 19903 || // CJK Extension A
    code >= 19968 && code <= 40959 || // CJK Unified Ideographs
    code >= 63744 && code <= 64255;
  }
  function isInvisible(c) {
    const code = c.charCodeAt(0);
    if (code === 127) return true;
    if (code < 32 && code !== 10 && code !== 13 && code !== 11) return true;
    return code === 173 || code === 8203 || code === 8204 || code === 8205 || code === 8288 || code === 65279;
  }
  var CLOSING_PUNCT = /* @__PURE__ */ new Set([
    ".",
    ",",
    ";",
    ":",
    "!",
    "?",
    "\u2026",
    ")",
    "]",
    "}",
    "\u3002",
    "\uFF0C",
    "\u3001",
    "\uFF1B",
    "\uFF1A",
    "\uFF01",
    "\uFF1F",
    "\uFF09",
    "\u3011",
    "\u300B",
    "\u300D",
    "\u300F",
    "\u3009",
    "\u3015"
  ]);
  var CJK_PUNCT = /* @__PURE__ */ new Set([
    "\u3002",
    "\uFF0C",
    "\u3001",
    "\uFF1B",
    "\uFF1A",
    "\uFF01",
    "\uFF1F",
    "\u2026",
    "\uFF08",
    "\uFF09",
    "\u3010",
    "\u3011",
    "\u300A",
    "\u300B",
    "\u300C",
    "\u300D",
    "\u300E",
    "\u300F",
    "\u3008",
    "\u3009",
    "\u3014",
    "\u3015",
    "\u3016",
    "\u3017",
    "\u3018",
    "\u3019",
    "\u301A",
    "\u301B",
    "\u201C",
    "\u201D",
    "\u2018",
    "\u2019",
    "\uFE50",
    "\uFE51",
    "\uFE52",
    "\uFE54",
    "\uFE55",
    "\uFE56",
    "\uFE57"
  ]);
  function splitParagraphs(text) {
    const out = [];
    let start = 0;
    let index = 1;
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === "\v") {
        out.push({ content: text.slice(start, i), start, index });
        index += 1;
        start = i + 1;
      }
    }
    out.push({ content: text.slice(start), start, index });
    return out;
  }
  function paragraphIndexOf(text, offset) {
    let p = 1;
    for (let i = 0; i < offset; i += 1) if (text[i] === "\v") p += 1;
    return p;
  }
  var CONTEXT_BEFORE = 15;
  var CONTEXT_AFTER = 15;
  function escapeContext(s) {
    return s.replace(/\r\n/g, "\u21B5").replace(/\u000B/g, "\xB6").replace(/[\r\n]/g, "\u21B5").replace(/\t/g, "\u2192").replace(/[\u200b\u200c\u200d\u2060\ufeff\u00ad]/g, "\xB7");
  }
  function makeContext(text, offset, length) {
    const start = Math.max(0, offset - CONTEXT_BEFORE);
    const end = Math.min(text.length, offset + length + CONTEXT_AFTER);
    const frag = escapeContext(text.slice(start, end));
    return `${start > 0 ? "..." : ""}${frag}${end < text.length ? "..." : ""}`;
  }
  function detectLeadingSpace(text) {
    const issues = [];
    for (const p of splitParagraphs(text)) {
      let j = 0;
      while (j < p.content.length && isSpace(p.content[j])) j += 1;
      if (j > 0) {
        issues.push({
          paragraphIndex: p.index,
          charOffset: p.start,
          charLength: j,
          ruleId: "LEADING_SPACE",
          context: makeContext(text, p.start, j),
          severity: "error"
        });
      }
    }
    return issues;
  }
  function detectTrailingSpace(text) {
    const issues = [];
    for (const p of splitParagraphs(text)) {
      let j = p.content.length;
      while (j > 0 && isSpace(p.content[j - 1])) j -= 1;
      if (j < p.content.length) {
        issues.push({
          paragraphIndex: p.index,
          charOffset: p.start + j,
          charLength: p.content.length - j,
          ruleId: "TRAILING_SPACE",
          context: makeContext(text, p.start + j, p.content.length - j),
          severity: "hint"
        });
      }
    }
    return issues;
  }
  function detectConsecutiveSpace(text) {
    const issues = [];
    let i = 0;
    while (i < text.length) {
      if (isSpace(text[i])) {
        let j = i;
        while (j < text.length && isSpace(text[j])) j += 1;
        if (j - i >= 2) {
          issues.push({
            paragraphIndex: paragraphIndexOf(text, i),
            charOffset: i,
            charLength: j - i,
            ruleId: "CONSECUTIVE_SPACE",
            context: makeContext(text, i, j - i),
            severity: "error"
          });
        }
        i = j;
      } else {
        i += 1;
      }
    }
    return issues;
  }
  function detectLineBreakLeadingSpace(text) {
    const issues = [];
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === "\r" || c === "\n") {
        let breakEnd = i + 1;
        if (c === "\r" && text[i + 1] === "\n") breakEnd = i + 2;
        let j = breakEnd;
        while (j < text.length && isSpace(text[j])) j += 1;
        if (j > breakEnd) {
          issues.push({
            paragraphIndex: paragraphIndexOf(text, breakEnd),
            charOffset: breakEnd,
            charLength: j - breakEnd,
            ruleId: "LINE_BREAK_LEADING_SPACE",
            context: makeContext(text, breakEnd, j - breakEnd),
            severity: "error"
          });
        }
        i = breakEnd;
      } else {
        i += 1;
      }
    }
    return issues;
  }
  function detectCjkAbnormalSpace(text) {
    const issues = [];
    let i = 1;
    while (i < text.length) {
      if (!isSpace(text[i])) {
        i += 1;
        continue;
      }
      const previousChar = text[i - 1];
      let j = i;
      while (j < text.length && isSpace(text[j])) j += 1;
      const spaceLength = j - i;
      const betweenHanCharacters = isHan(previousChar) && j < text.length && isHan(text[j]);
      const afterChinesePunctuation = CJK_PUNCT.has(previousChar) && spaceLength === 1;
      if (betweenHanCharacters || afterChinesePunctuation) {
        issues.push({
          paragraphIndex: paragraphIndexOf(text, i),
          charOffset: i,
          charLength: spaceLength,
          ruleId: "CJK_ABNORMAL_SPACE",
          context: makeContext(text, i, spaceLength),
          severity: "warning"
        });
      }
      i = j;
    }
    return issues;
  }
  function detectWordSplitBySpace(text, dictionary) {
    if (!dictionary) return [];
    const issues = [];
    const re = /([A-Za-z]{2,}) ([A-Za-z]{2,})/g;
    let m;
    while (m = re.exec(text)) {
      const joined = (m[1] + m[2]).toLowerCase();
      const known = typeof dictionary === "function" ? dictionary(joined) : dictionary.has(joined);
      if (known) {
        const offset = m.index + m[1].length;
        issues.push({
          paragraphIndex: paragraphIndexOf(text, offset),
          charOffset: offset,
          charLength: 1,
          ruleId: "WORD_SPLIT_BY_SPACE",
          context: makeContext(text, offset, 1),
          severity: "hint"
        });
      }
    }
    return issues;
  }
  function detectSpaceBeforePunctuation(text) {
    const issues = [];
    for (let i = 0; i < text.length - 1; i += 1) {
      if (isSpace(text[i]) && CLOSING_PUNCT.has(text[i + 1])) {
        issues.push({
          paragraphIndex: paragraphIndexOf(text, i),
          charOffset: i,
          charLength: 1,
          ruleId: "SPACE_BEFORE_PUNCTUATION",
          context: makeContext(text, i, 1),
          severity: "hint"
        });
      }
    }
    return issues;
  }
  function detectMixedWidthSpace(text) {
    const issues = [];
    for (const p of splitParagraphs(text)) {
      let hasHalf = false;
      let hasFull = false;
      for (const c of p.content) {
        if (c === SPACE_HALF) hasHalf = true;
        else if (c === SPACE_FULL) hasFull = true;
      }
      if (hasHalf && hasFull) {
        for (let k = 0; k < p.content.length; k += 1) {
          if (p.content[k] === SPACE_FULL) {
            issues.push({
              paragraphIndex: p.index,
              charOffset: p.start + k,
              charLength: 1,
              ruleId: "MIXED_WIDTH_SPACE",
              context: makeContext(text, p.start + k, 1),
              severity: "hint"
            });
          }
        }
      }
    }
    return issues;
  }
  function detectInvisibleChar(text) {
    const issues = [];
    let i = 0;
    while (i < text.length) {
      if (isInvisible(text[i])) {
        let j = i;
        while (j < text.length && isInvisible(text[j])) j += 1;
        issues.push({
          paragraphIndex: paragraphIndexOf(text, i),
          charOffset: i,
          charLength: j - i,
          ruleId: "INVISIBLE_CHAR",
          context: makeContext(text, i, j - i),
          severity: "hint"
        });
        i = j;
      } else {
        i += 1;
      }
    }
    return issues;
  }
  var DETECTORS = {
    LEADING_SPACE: (t) => detectLeadingSpace(t),
    TRAILING_SPACE: (t) => detectTrailingSpace(t),
    CONSECUTIVE_SPACE: (t) => detectConsecutiveSpace(t),
    LINE_BREAK_LEADING_SPACE: (t) => detectLineBreakLeadingSpace(t),
    CJK_ABNORMAL_SPACE: (t) => detectCjkAbnormalSpace(t),
    WORD_SPLIT_BY_SPACE: (t, o) => detectWordSplitBySpace(t, o.dictionary),
    SPACE_BEFORE_PUNCTUATION: (t) => detectSpaceBeforePunctuation(t),
    MIXED_WIDTH_SPACE: (t) => detectMixedWidthSpace(t),
    INVISIBLE_CHAR: (t) => detectInvisibleChar(t)
  };
  function resolveEnabled(options) {
    const en = {};
    for (const id of RULE_IDS) en[id] = RULE_METAS[id].defaultEnabled;
    if (options?.enabled) {
      for (const id of RULE_IDS) {
        const v = options.enabled[id];
        if (v !== void 0) en[id] = v;
      }
    }
    return en;
  }
  function scanText(input, options) {
    const en = resolveEnabled(options);
    const opts = options ?? {};
    const textIssues = [];
    for (const id of RULE_IDS) {
      if (!en[id]) continue;
      textIssues.push(...DETECTORS[id](input.text, opts));
    }
    return textIssues.map((ti) => ({
      slideIndex: input.slideIndex,
      slideId: input.slideId,
      shapeId: input.shapeId,
      shapeName: input.shapeName,
      ...ti
    }));
  }
  function scanTexts(inputs, options) {
    return inputs.flatMap((input) => scanText(input, options));
  }

  // src/taskpane.ts
  var $ = (id) => document.getElementById(id);
  async function getSelectedText() {
    let text = null;
    await PowerPoint.run(async (context) => {
      const range = context.presentation.getSelectedTextRangeOrNullObject();
      range.load("text");
      await context.sync();
      if (!range.isNullObject && range.text) text = range.text;
    });
    return text;
  }
  async function convertSelection() {
    let converted = null;
    await PowerPoint.run(async (context) => {
      const range = context.presentation.getSelectedTextRangeOrNullObject();
      range.load("text");
      await context.sync();
      if (range.isNullObject || !range.text) return;
      converted = toTitleCase(range.text);
      if (converted !== range.text) {
        range.text = converted;
        await context.sync();
      }
    });
    return converted;
  }
  async function collectInputs() {
    const inputs = [];
    await PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load("items");
      await context.sync();
      for (let i = 0; i < slides.items.length; i++) {
        const slide = slides.items[i];
        slide.load("id");
        slide.shapes.load("items");
        await context.sync();
        for (const shape of slide.shapes.items) {
          try {
            const tf = shape.textFrame;
            tf.load("hasText");
            shape.load("id,name");
            await context.sync();
            if (!tf.hasText) continue;
            tf.textRange.load("text");
            await context.sync();
            inputs.push({
              slideIndex: i + 1,
              slideId: slide.id,
              shapeId: shape.id,
              shapeName: shape.name,
              text: tf.textRange.text
              // \v=段落，\r/\n=软换行
            });
          } catch {
          }
        }
      }
    });
    return inputs;
  }
  async function locate(issue) {
    if (!issue.slideId) return;
    await PowerPoint.run(async (context) => {
      context.presentation.setSelectedSlides([issue.slideId]);
      const slide = context.presentation.slides.getItem(issue.slideId);
      const shape = slide.shapes.getItem(issue.shapeId);
      shape.textFrame.textRange.getSubstring(issue.charOffset, issue.charLength).setSelected();
      await context.sync();
    });
  }
  function renderIssues(issues) {
    const list = $("issues");
    list.innerHTML = "";
    $("scan-summary").textContent = issues.length ? `\u53D1\u73B0 ${issues.length} \u4E2A\u7591\u4F3C\u95EE\u9898\uFF08\u70B9\u51FB\u6761\u76EE\u5B9A\u4F4D\uFF09` : "\u672A\u53D1\u73B0\u95EE\u9898";
    for (const issue of issues) {
      const li = document.createElement("li");
      li.className = `issue ${issue.severity}`;
      li.textContent = `\u7B2C${issue.slideIndex}\u9875 \xB7 ${issue.shapeName || issue.shapeId} \xB7 \u7B2C${issue.paragraphIndex}\u6BB5 \xB7 ${issue.ruleId}`;
      li.title = issue.context;
      li.addEventListener("click", () => {
        void locate(issue);
      });
      list.appendChild(li);
    }
  }
  async function refreshSelectionStatus() {
    const text = await getSelectedText();
    const btn = $("btn-convert");
    if (text === null || text === "") {
      $("sel-status").textContent = "\u672A\u9009\u4E2D\u6587\u672C";
      btn.disabled = true;
      $("preview").textContent = "\u9009\u4E2D\u6587\u672C\u540E\u8FD9\u91CC\u663E\u793A\u8F6C\u6362\u9884\u89C8";
    } else {
      $("sel-status").textContent = "\u5DF2\u9009\u4E2D";
      btn.disabled = false;
      $("preview").textContent = toTitleCase(text);
    }
  }
  Office.onReady(() => {
    const docUrl = Office.context && Office.context.document ? Office.context.document.url : "";
    $("doc-name").textContent = "\u5F53\u524D\uFF1A" + (docUrl ? docUrl.split("/").pop() : "\u672A\u547D\u540D");
    void refreshSelectionStatus();
    $("btn-convert").addEventListener("click", async () => {
      const converted = await convertSelection();
      if (converted === null) {
        $("sel-status").textContent = "\u672A\u9009\u4E2D\u6587\u672C\uFF0C\u8BF7\u5148\u5728\u5E7B\u706F\u7247\u91CC\u9009\u4E2D\u6807\u9898";
      } else {
        $("preview").textContent = converted;
        $("sel-status").textContent = "\u5DF2\u8F6C\u6362";
      }
    });
    $("btn-scan").addEventListener("click", async () => {
      $("scan-summary").textContent = "\u626B\u63CF\u4E2D\u2026";
      try {
        renderIssues(scanTexts(await collectInputs()));
      } catch (e) {
        $("scan-summary").textContent = "\u626B\u63CF\u5931\u8D25\uFF1A" + String(e);
      }
    });
    $("btn-clear").addEventListener("click", () => renderIssues([]));
  });
})();
