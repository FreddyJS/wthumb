enum Operation {
  MOV,
  ADD,
  SUB,
  NEG,
  MUL,
  CMP,
  CMN,
  AND,
  BIC,
  ORR,
  EOR,
  MVN,
  TST,
  TOTAL_OPERATIONS,
}

const wordToOperation: { [key: string]: Operation } = {
  mov: Operation.MOV,
  add: Operation.ADD,
  sub: Operation.SUB,
  neg: Operation.NEG,
  mul: Operation.MUL,
  cmp: Operation.CMP,
  cmn: Operation.CMN,
  and: Operation.AND,
  bic: Operation.BIC,
  orr: Operation.ORR,
  eor: Operation.EOR,
  mvn: Operation.MVN,
  tst: Operation.TST,
};

const operationToWord: { [key: number]: string } = {
  [Operation.MOV]: 'mov',
  [Operation.ADD]: 'add',
  [Operation.SUB]: 'sub',
  [Operation.NEG]: 'neg',
  [Operation.MUL]: 'mul',
  [Operation.CMP]: 'cmp',
  [Operation.CMN]: 'cmn',
  [Operation.AND]: 'and',
  [Operation.BIC]: 'bic',
  [Operation.ORR]: 'orr',
  [Operation.EOR]: 'eor',
  [Operation.MVN]: 'mvn',
  [Operation.TST]: 'tst',
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

type Program = {
  error?: CompilerError;
  ins: Instruction[];
};

function isLowHighRegister(type: OperandType): boolean {
  return type === OperandType.LowRegister || type === OperandType.HighRegister || type === OperandType.SpRegister;
}

function isInmediateValue(type: OperandType): boolean {
  return type === OperandType.HexInmediate || type === OperandType.DecInmediate;
}

export { Operation, OperandType, wordToOperation, operationToWord, isLowHighRegister, isInmediateValue };
export type { CompilerError, Operand, Instruction, Program };
