const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

enum Operation {
  MOV,
  ADD,
  TOTAL_OPERATIONS,
}

const dictStringToOperation: { [key: string]: Operation } = {
  mov: Operation.MOV,
  add: Operation.ADD,
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
  column: number;
};

type Operand = {
  type: OperandType;
  value: string;
};

type Instruction = {
  operation: Operation;
  operands: Operand[];
};

type Program = {
  error?: CompilerError;
  ins: Instruction[];
};

function isGeneralRegisterType(type: OperandType): boolean {
  return type === OperandType.LowRegister || type === OperandType.HighRegister;
}

function isInmediateType(type: OperandType): boolean {
  return type === OperandType.HexInmediate || type === OperandType.DecInmediate;
}

function stripComments(source: string) {
  return source
    .split('\n')
    .map((line) => {
      let commentIndex = line.indexOf(';');
      commentIndex = commentIndex === -1 ? line.indexOf('@') : commentIndex;
      if (commentIndex === -1) {
        return line.trim();
      } else {
        return line.slice(0, commentIndex).trim();
      }
    })
    .join('\n');
}

function stripEmptyLines(source: string) {
  return source
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n');
}

function cleanInput(source: string): string {
  return stripEmptyLines(stripComments(source)).toLowerCase();
}

function operandToOptype(operand: string): OperandType | string {
  if (operand.startsWith('r')) {
    // Register Operand
    const reg = parseInt(operand.slice(1), 10);
    if (reg >= 0 && reg <= 7) {
      return OperandType.LowRegister;
    } else if (reg >= 8 && reg <= 15) {
      return OperandType.HighRegister;
    }

    return 'Invalid register. Expected r[0-7] or r[8-15] but got r' + reg;
  } else if (operand.startsWith('#')) {
    if (operand.startsWith('#0x')) {
      if (isNaN(operand.slice(1) as any)) {
        return 'Invalid hexadecimal inmediate. Expected 0x[0-9a-fA-F] but got ' + operand;
      }
      return OperandType.HexInmediate;
    } else if (!isNaN(operand.slice(1) as any)) {
      return OperandType.DecInmediate;
    } else {
      return 'Invalid inmediate. Expected #0x[0-F] or #[0-9] but got ' + operand;
    }
  } else if (operand === 'sp') {
    return OperandType.SpRegister;
  } else {
    return 'Invalid operand';
  }
}

function lineToInstruction(line: string): Instruction | string {
  const words = line.split(' ');
  const operands = words
    .slice(1)
    .join(' ')
    .split(',')
    .map((operand) => operand.trim());

  const operation = dictStringToOperation[words[0]];
  if (operation === undefined) {
    return 'Unknown operation: ' + words[0];
  }

  assert(Operation.TOTAL_OPERATIONS === 2, 'Exhaustive handling of operations in line_to_op');
  switch (operation) {
    case Operation.MOV: {
      if (operands.length !== 2) {
        return 'Invalid number of operands for MOV. Expected 2, got ' + operands.length;
      }

      const op1Type = operandToOptype(operands[0]);
      const op2Type = operandToOptype(operands[1]);
      if (typeof op1Type === 'string') {
        return op1Type;
      } else if (typeof op2Type === 'string') {
        return op2Type;
      }

      if (isGeneralRegisterType(op1Type)) {
        if (isGeneralRegisterType(op2Type)) {
          // CASE: MOV r1, r2
          return {
            operation: Operation.MOV,
            operands: [
              { type: op1Type, value: operands[0] },
              { type: op2Type, value: operands[1] },
            ],
          };
        } else if (isInmediateType(op2Type)) {
          const radix = op2Type === OperandType.HexInmediate ? 16 : 10;
          const value = parseInt(operands[1].slice(1), radix);
          if (value < 0 || value > 255) {
            // MOV allows only 8-bit values
            return 'Invalid inmediate for MOV. Expected 0x[0-F] or [0-9] between 0 and 255 but got ' + operands[1];
          } else if (op1Type === OperandType.HighRegister) {
            // MOV allows only low registers with immediate values
            return 'Invalid register for MOV. Only low registers are allowed with inmediate values';
          }

          // CASE: MOV r1, #0xFF
          return {
            operation: Operation.MOV,
            operands: [
              { type: op1Type, value: operands[0] },
              { type: op2Type, value: operands[1] },
            ],
          };
        } else {
          return 'Invalid operand for MOV. Expected r[0-7] or #[0-9a-fA-F] but got ' + operands[1];
        }
      } else {
        return 'Invalid operand for MOV. Expected r[0-7] or r[8-15] but got ' + operands[0];
      }
    }

    case Operation.ADD: {
      if (operands.length < 2) {
        return 'Invalid number of operands for ADD. Expected 2 or 3, got ' + operands.length;
      }

      const op1Type = operandToOptype(operands[0]);
      const op2Type = operandToOptype(operands[1]);
      if (typeof op1Type === 'string') {
        return op1Type;
      } else if (typeof op2Type === 'string') {
        return op2Type;
      }

      if (isGeneralRegisterType(op1Type)) {
        if (isGeneralRegisterType(op2Type)) {
          // The 2 first operands are general registers (high or low). The third one should be an immediate value if exists.

          if (operands.length === 3) {
            const op3Type = operandToOptype(operands[2]);
            if (typeof op3Type === 'string') {
              return op3Type;
            } else if (op2Type === OperandType.HighRegister) {
              return 'Invalid register for ADD. Only low registers are allowed with inmediate values';
            }

            if (isInmediateType(op3Type)) {
              // CASE: ADD r1, r2, #0x0
              return {
                operation: Operation.ADD,
                operands: [
                  { type: op1Type, value: operands[0] },
                  { type: op2Type, value: operands[1] },
                  { type: op3Type, value: operands[2] },
                ],
              };
            } else {
              return 'Invalid operand for ADD. Expected r[0-7] or r[8-15] but got ' + operands[2];
            }
          } else if (operands.length === 2) {
            // CASE: ADD r1, r2
            return {
              operation: Operation.ADD,
              operands: [
                { type: op1Type, value: operands[0] },
                { type: op2Type, value: operands[1] },
              ],
            };
          } else {
            return 'Invalid number of operands for ADD. Expected 2 or 3, got ' + operands.length;
          }
        } else if (isInmediateType(op2Type)) {
          const radix = op2Type === OperandType.HexInmediate ? 16 : 10;
          if (parseInt(operands[1].slice(1), radix) > 255) {
            // ADD only allows 8-bit inmediate values
            return 'Invalid inmediate value. Inmediate value for ADD must be between 0 and 255';
          } else if (op1Type === OperandType.HighRegister) {
            return 'Only low registers allowed with inmediate operand';
          }

          // CASE: ADD r1, #0x0
          return {
            operation: Operation.ADD,
            operands: [
              { type: op1Type, value: operands[0] },
              { type: op2Type, value: operands[1] },
            ],
          };
        } else {
          return 'Invalid operand for ADD. Expected r[0-7] or r[8-15] but got ' + operands[1];
        }
      } else if (op1Type === OperandType.SpRegister) {
        if (isInmediateType(op2Type)) {
          const radix = op2Type === OperandType.HexInmediate ? 16 : 10;
          if (parseInt(operands[1].slice(1), radix) > 127) {
            return 'Invalid inmediate value. Inmediate value for ADD sp, #7bit_Imm must be between -128 and 127';
          }
        } else {
          return 'Invalid operand for ADD sp, #7bit_Imm. Expected #[0-9] or #0x[0-F] but got ' + operands[1];
        }

        // CASE: ADD sp, #7bit_Imm
        return {
          operation,
          operands: [
            { type: op1Type, value: operands[0] },
            { type: op2Type, value: operands[1] },
          ],
        };
      } else {
        return 'Invalid operand for ADD. Expected r[0-7] or r[8-15] or sp but got ' + operands[0];
      }
    }

    default:
      throw new Error('Unreachable code in line_to_op');
  }
}

function compile_assembly(source: string): Program {
  source = cleanInput(source);

  const textSectionIndex = source.indexOf('.text');
  const dataSectionIndex = source.indexOf('.data');
  if (textSectionIndex === -1) {
    return { error: { message: 'Missing .text directive', line: 0, column: 0 }, ins: [] };
  }

  let textSection = '';
  if (dataSectionIndex === -1) {
    // No data section in assembly, no memory needed
    textSection = source.slice(textSectionIndex + 5);
  } else if (dataSectionIndex < textSectionIndex) {
    // Data section is before text section
    textSection = source.slice(textSectionIndex + 5);
  } else {
    // Data section is after text section
    textSection = source.slice(textSectionIndex + 5, dataSectionIndex);
  }

  const lines = textSection.split('\n');
  const program: Program = {
    ins: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length === 0) {
      continue;
    }

    const op = lineToInstruction(line);
    if (typeof op === 'string') {
      program.error = { message: op, line: i, column: 0 };
      return program;
    } else {
      program.ins.push(op);
    }
  }

  return program;
}

export default compile_assembly;
export { Operation, OperandType, assert };
export type { Instruction };
