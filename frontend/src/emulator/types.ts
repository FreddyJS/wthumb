// CPU Operations
enum Operation {
  // Arithmetic operations
  MOV,
  ADD,
  SUB,
  NEG,
  MUL,
  CMP,
  CMN,

  // Logical operations
  AND,
  BIC,
  ORR,
  EOR,
  MVN,
  TST,

  // Shift operations
  LSL,
  LSR,
  ASR,
  ROR,
  TOTAL_OPERATIONS,
}

const wordToOperation: { [key: string]: Operation } = {
  // Arithmetic operations
  mov: Operation.MOV,
  add: Operation.ADD,
  sub: Operation.SUB,
  neg: Operation.NEG,
  mul: Operation.MUL,
  cmp: Operation.CMP,
  cmn: Operation.CMN,

  // Logical operations
  and: Operation.AND,
  bic: Operation.BIC,
  orr: Operation.ORR,
  eor: Operation.EOR,
  mvn: Operation.MVN,
  tst: Operation.TST,

  // Shift operations
  lsl: Operation.LSL,
  lsr: Operation.LSR,
  asr: Operation.ASR,
  ror: Operation.ROR,
};

const operationToWord: { [key: number]: string } = {
  // Arithmetic operations
  [Operation.MOV]: 'mov',
  [Operation.ADD]: 'add',
  [Operation.SUB]: 'sub',
  [Operation.NEG]: 'neg',
  [Operation.MUL]: 'mul',
  [Operation.CMP]: 'cmp',
  [Operation.CMN]: 'cmn',

  // Logical operations
  [Operation.AND]: 'and',
  [Operation.BIC]: 'bic',
  [Operation.ORR]: 'orr',
  [Operation.EOR]: 'eor',
  [Operation.MVN]: 'mvn',
  [Operation.TST]: 'tst',

  // Shift operations
  [Operation.LSL]: 'lsl',
  [Operation.LSR]: 'lsr',
  [Operation.ASR]: 'asr',
  [Operation.ROR]: 'ror',
};

enum OperandType {
  LowRegister,
  HighRegister,
  SpRegister,
  HexInmediate,
  DecInmediate,
}

type CompilerError = {
  message: string;
  line: number;
};

type Operand = {
  type: OperandType;
  value: string;
};

type Instruction = {
  operation: Operation;
  name: string;
  operands: Operand[];
  label?: string;
};

// Assembler directives
enum Directive {
  ALIGN,
  BALIGN,
  ASCII,
  ASCIZ,
  TEXT,
  DATA,
  BYTE,
  HWORD,
  WORD,
  QUAD,
  SPACE,
  EQUIV,
  EQV,
  EQU,
  SET,
  TOTAL_DIRECTIVES,
}

const dataDirectives: Directive[] = [
  Directive.ALIGN, Directive.BALIGN,
  Directive.ASCII, Directive.ASCIZ,
  Directive.BYTE, Directive.HWORD,
  Directive.WORD, Directive.QUAD,
  Directive.SPACE
]

const wordToDirective: { [key: string]: Directive } = {
  ".align": Directive.ALIGN,
  ".balign": Directive.BALIGN,
  ".ascii": Directive.ASCII,
  ".asciz": Directive.ASCIZ,
  ".text": Directive.TEXT,
  ".data": Directive.DATA,
  ".byte": Directive.BYTE,
  ".hword": Directive.HWORD,
  ".word": Directive.WORD,
  ".quad": Directive.QUAD,
  ".space": Directive.SPACE,
  ".equiv": Directive.EQUIV,
  ".eqv": Directive.EQUIV,
  ".equ": Directive.EQU,
  ".set": Directive.SET,
}

const directiveToWord: { [key: number]: string } = {
  [Directive.ALIGN]: ".align",
  [Directive.BALIGN]: ".balign",
  [Directive.ASCII]: ".ascii",
  [Directive.ASCIZ]: ".asciz",
  [Directive.TEXT]: ".text",
  [Directive.DATA]: ".data",
  [Directive.BYTE]: ".byte",
  [Directive.HWORD]: ".hword",
  [Directive.WORD]: ".word",
  [Directive.QUAD]: ".quad",
  [Directive.SPACE]: ".space",
  [Directive.EQUIV]: ".equiv",
  [Directive.EQV]: ".eqv",
  [Directive.EQU]: ".equ",
  [Directive.SET]: ".set",
}

// Program
type Program = {
  error?: CompilerError;
  ins: Instruction[];
};

export { Operation, OperandType, Directive, wordToOperation, operationToWord, wordToDirective, directiveToWord, dataDirectives };
export type { CompilerError, Operand, Instruction, Program };
