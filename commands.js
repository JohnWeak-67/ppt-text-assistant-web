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

  // src/commands.ts
  Office.actions.associate("titleCase.convert", async (event) => {
    try {
      await PowerPoint.run(async (context) => {
        const range = context.presentation.getSelectedTextRangeOrNullObject();
        range.load("text");
        await context.sync();
        if (!range.isNullObject && range.text) {
          const converted = toTitleCase(range.text);
          if (converted !== range.text) {
            range.text = converted;
            await context.sync();
          }
        }
      });
    } finally {
      event.completed();
    }
  });
})();
