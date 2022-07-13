import { dataDirectives, directiveToWord, operationToWord, wordToDirective } from "emulator/types";

// Custom codemirror legacy-mode for a simplified arm thumb
// Defines rules for the basic keywords, operations and registers

// If an architecture is specified, its initialization function may
// populate this array with custom parsing functions which will be
// tried in the event that the standard functions do not find a match.
var custom: any[] = [];

// The symbol used to start a line comment changes based on the target
// architecture.
// If no architecture is pased in "parserConfig" then only multiline
// comments will have syntax support.
var lineCommentStartSymbol = ";";
var secLineCommentStartSymbol = "@"

// These directives are architecture independent.
// Machine specific directives should go in their respective
// architecture initialization function.
// Reference:
// http://sourceware.org/binutils/docs/as/Pseudo-Ops.html#Pseudo-Ops

var directives: { [key: string]: string } = {}
// Fill directives automatically using the directiveToWord object in emulator/types.ts
for (let i = 0; i < Object.keys(directiveToWord).length; i++) {
  directives[directiveToWord[i]] = "meta";
  if (dataDirectives.find((el) => el === wordToDirective[directiveToWord[i]])) {
    directives[directiveToWord[i]] = "number";
  }
}

var keywords: { [key: string]: string } = {}
// Fill keywords automatically using the operationToWord object in emulator/types.ts
for (let i = 0; i < Object.keys(operationToWord).length; i++) {
  keywords[operationToWord[i]] = "keyword";
}

var registers: { [key: string]: string } = {};

// Reference:
// http://infocenter.arm.com/help/topic/com.arm.doc.qrc0001l/QRC0001_UAL.pdf
// http://infocenter.arm.com/help/topic/com.arm.doc.ddi0301h/DDI0301H_arm1176jzfs_r0p7_trm.pdf

registers.r0 = "atom";
registers.r1 = "atom";
registers.r2 = "atom";
registers.r3 = "atom";
registers.r4 = "atom";
registers.r5 = "atom";
registers.r6 = "atom";
registers.r7 = "atom";
registers.r8 = "atom";
registers.r9 = "atom";
registers.r10 = "atom";
registers.r11 = "atom";
registers.r12 = "atom";

registers.sp = "atom";
registers.lr = "atom";
registers.pc = "atom";
registers.r13 = registers.sp;
registers.r14 = registers.lr;
registers.r15 = registers.pc;

custom.push(function (ch: any, stream: any) {
  stream.eatWhile(/\S/);
  return undefined;
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

export const armthumb: any = {
  // startState: function(indentUnit: number) {
  //   return {
  //     tokenize: null
  //   };
  // },

  token: function (stream: any, state: any) {
    // if (state.tokenize) {
    //   return state.tokenize(stream, state);
    // }

    if (stream.eatSpace()) {
      return null;
    }

    var style, cur, ch = stream.next();

    // Single line comment
    if (ch === lineCommentStartSymbol || ch === secLineCommentStartSymbol) {
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
      style = directives[cur];
      if (style) {
        return style;
      }
    }

    // Separator ,
    if (ch === ',' || ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      stream.eatWhile(/\w/);
      return "contentSeparator";
    }

    // Hexadecimal and decimal numbers. #0xff | #255
    if (ch === "#") {
      if (stream.match("0x")) {
        stream.eat("0");
        stream.eat("x");
        stream.eatWhile(/[0-9a-fA-F]/);
        return "number";
      } else if (stream.eatWhile(/\d/)) {
        return "number";
      }
    }

    // CPU Registers
    if (ch === 'r') {
      stream.eatWhile(/[0-9]/);
      cur = stream.current().toLowerCase();
      if (registers[cur]) {
        return registers[cur];
      }
    } else if (ch === 's') {
      stream.eatWhile(/\w/);
      cur = stream.current().toLowerCase();
      if (cur === 'sp') {
        return registers.sp;
      }
    } else if (ch === 'l') {
      stream.eatWhile(/\w/);
      cur = stream.current().toLowerCase();
      if (cur === 'lr') {
        return registers.lr;
      }
    } else if (ch === 'p') {
      stream.eatWhile(/\w/);
      cur = stream.current().toLowerCase();
      if (cur === 'pc') {
        return registers.pc;
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
