enum Operation {
  MOV,
  ADD,
  SUB,
  MUL,
  TOTAL_OPERATIONS,
}

const wordToOperation: { [key: string]: Operation } = {
  mov: Operation.MOV,
  add: Operation.ADD,
  sub: Operation.SUB,
  mul: Operation.MUL,
};

const operationToWord: { [key: number]: string } = {
  [Operation.MOV]: 'mov',
  [Operation.ADD]: 'add',
  [Operation.SUB]: 'sub',
  [Operation.MUL]: 'mul',
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
