enum Operation {
  MOV,
  ADD,
  TOTAL_OPERATIONS,
}

const wordToOperation: { [key: string]: Operation } = {
  mov: Operation.MOV,
  add: Operation.ADD,
};

const operationToWord: { [key: number]: string } = {
  [Operation.MOV]: 'mov',
  [Operation.ADD]: 'add',
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

export { Operation, OperandType, wordToOperation, operationToWord };
export type { CompilerError, Operand, Instruction, Program };
