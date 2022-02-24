// Custom codemirror legacy-mode for a simplified arm thumb
// Defines rules for the basic keywords, operations and registers

function mkArmThumb() {
  // If an architecture is specified, its initialization function may
  // populate this array with custom parsing functions which will be
  // tried in the event that the standard functions do not find a match.
  var custom: any[] = [];

  // The symbol used to start a line comment changes based on the target
  // architecture.
  // If no architecture is pased in "parserConfig" then only multiline
  // comments will have syntax support.
  var lineCommentStartSymbol = ";";

  // These directives are architecture independent.
  // Machine specific directives should go in their respective
  // architecture initialization function.
  // Reference:
  // http://sourceware.org/binutils/docs/as/Pseudo-Ops.html#Pseudo-Ops
  var directives: { [key: string]: string } = {
    ".text": "meta",
    ".data": "meta",
  };
  directives.syntax = "meta";

  var keywords: { [key: string]: string } = {
    "mov": "keyword",
    "add": "keyword",
  }

  var registers: { [key: string]: string } = {};

  // Reference:
  // http://infocenter.arm.com/help/topic/com.arm.doc.qrc0001l/QRC0001_UAL.pdf
  // http://infocenter.arm.com/help/topic/com.arm.doc.ddi0301h/DDI0301H_arm1176jzfs_r0p7_trm.pdf

  registers.r0  = "variableName.special";
  registers.r1  = "variableName.special";
  registers.r2  = "variableName.special";
  registers.r3  = "variableName.special";
  registers.r4  = "variableName.special";
  registers.r5  = "variableName.special";
  registers.r6  = "variableName.special";
  registers.r7  = "variableName.special";
  registers.r8  = "variableName.special";
  registers.r9  = "variableName.special";
  registers.r10 = "variableName.special";
  registers.r11 = "variableName.special";
  registers.r12 = "variableName.special";

  registers.sp  = "variableName.special";
  registers.lr  = "variableName.special";
  registers.pc  = "variableName.special";
  registers.r13 = registers.sp;
  registers.r14 = registers.lr;
  registers.r15 = registers.pc;

  custom.push(function(ch: any, stream: any) {
    if (ch === '#') {
      stream.eatWhile(/\w/);
      return "number";
    }
  });

  function nextUntilUnescaped(stream: any, end: any) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next === end && !escaped) {
        return false;
      }
      escaped = !escaped && next === "\\";
    }
    return escaped;
  }

  function clikeComment(stream: any, state: any) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (ch === "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch === "*");
    }
    return "comment";
  }

  return {
    startState: function() {
      return {
        tokenize: null
      };
    },

    token: function(stream: any, state: any) {
      if (state.tokenize) {
        return state.tokenize(stream, state);
      }

      if (stream.eatSpace()) {
        return null;
      }

      var style, cur, ch = stream.next();

      if (ch === "/") {
        if (stream.eat("*")) {
          state.tokenize = clikeComment;
          return clikeComment(stream, state);
        }
      }

      if (ch === lineCommentStartSymbol) {
        stream.skipToEnd();
        return "comment";
      }

      if (ch === '"') {
        nextUntilUnescaped(stream, '"');
        return "string";
      }

      if (ch === '.') {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        style = directives[cur];
        return style || null;
      }

      if (ch === '=') {
        stream.eatWhile(/\w/);
        return "tag";
      }

      if (ch === '{') {
        return "bracket";
      }

      if (ch === '}') {
        return "bracket";
      }

      if (/\d/.test(ch)) {
        if (ch === "0" && stream.eat("x")) {
          stream.eatWhile(/[0-9a-fA-F]/);
          return "number";
        }
        stream.eatWhile(/\d/);
        return "number";
      }

      if (/\w/.test(ch)) {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        if (stream.eat(":")) {
          return 'tag';
        } else if (keywords[cur]) {
          return 'keyword';
        }
        cur = stream.current().toLowerCase();
        style = registers[cur];
        return style || null;
      }

      for (var i = 0; i < custom.length; i++) {
        style = custom[i](ch, stream, state);
        if (style) {
          return style;
        }
      }
    },

    languageData: {
      commentTokens: {
        line: lineCommentStartSymbol,
        block: {open: "/*", close: "*/"}
      }
    }
  };
}

const armThumb = mkArmThumb();

export default armThumb;