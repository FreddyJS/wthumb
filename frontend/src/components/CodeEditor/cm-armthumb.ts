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

  registers.r0  = "atom";
  registers.r1  = "atom";
  registers.r2  = "atom";
  registers.r3  = "atom";
  registers.r4  = "atom";
  registers.r5  = "atom";
  registers.r6  = "atom";
  registers.r7  = "atom";
  registers.r8  = "atom";
  registers.r9  = "atom";
  registers.r10 = "atom";
  registers.r11 = "atom";
  registers.r12 = "atom";

  registers.sp  = "atom";
  registers.lr  = "atom";
  registers.pc  = "atom";
  registers.r13 = registers.sp;
  registers.r14 = registers.lr;
  registers.r15 = registers.pc;

  custom.push(function(ch: any, stream: any) {
    return null;
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
      
      // Single line comment
      if (ch === lineCommentStartSymbol) {
        stream.skipToEnd();
        return "comment";
      }

      // String literal
      if (ch === '"') {
        nextUntilUnescaped(stream, '"');
        return "string";
      }

      // .directive words
      if (ch === '.') {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        return directives[cur];
      }

      // Separator ,
      if (ch === ',') {
        stream.eatWhile(/\w/);
        return "contentSeparator";
      }

      // Hexadecimal and decimal numbers. #0xff | #255
      if (ch === "#") {
        if (stream.eat("0") && stream.eat("x")) {
          stream.eatWhile(/[0-9a-fA-F]/);
          return "number";
        }
        stream.eatWhile(/\d/);
        return "number";
      }

      // CPU Registers
      if (ch === 'r') {
        stream.eatWhile(/[0-9]/);
        cur = stream.current().toLowerCase();
        if (registers[cur]) {
          return registers[cur];
        } else {
          return "invalid";
        }
      }

      // Words. Tags (labels) and keywords (instructions).
      if (/\w/.test(ch)) {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        if (stream.eat(":")) {
          return 'tag';
        } else if (keywords[cur]) {
          return 'keyword';
        }

        return null;
      }

      // Execute custom parsing function if it exists
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
        // TODO: search if gas syntax supports multiline comments
        // block: {open: "/*", close: "*/"}
      }
    }
  };
}

const gasArmThumb = mkArmThumb();

export default gasArmThumb;