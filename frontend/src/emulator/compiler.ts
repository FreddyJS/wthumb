import { Operation, OperandType, wordToOperation } from './types';
import type { Program, Instruction } from './types';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

function isLowHighRegister(type: OperandType): boolean {
  return type === OperandType.LowRegister || type === OperandType.HighRegister;
}

function isInmediateValue(type: OperandType): boolean {
  return type === OperandType.HexInmediate || type === OperandType.DecInmediate;
}

function isOutOfRange(inmediate: string, max: number): boolean {
  const radix = inmediate.startsWith('#0x') ? 16 : 10;
  const num = parseInt(inmediate.slice(1), radix);

  return num > max;
}

function isAligned(addr: string, size: number): boolean {
  const radix = addr.startsWith('#0x') ? 16 : 10;
  const num = parseInt(addr.slice(1), radix);

  return num % size === 0;
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

function cleanInput(source: string): string {
  return stripComments(source).toLowerCase();
}

function operandToOptype(operand: string): OperandType | undefined {
  // Check by regular expressions the corresponding operand type. If none is found, return undefined.
  let type: OperandType | undefined;

  if (/^r\d+$/.test(operand)) {
    const reg = parseInt(operand.slice(1), 10);
    type = reg < 8 ? OperandType.LowRegister : reg < 16 ? OperandType.HighRegister : undefined;
  } else if (/^sp$/.test(operand)) {
    type = OperandType.SpRegister;
  } else if (/^#0x[0-9a-f]+$/.test(operand) || /^#\d+$/.test(operand)) {
    type = operand.startsWith('#0x') ? OperandType.HexInmediate : OperandType.DecInmediate;
  }

  return type;
}

function lineToInstruction(line: string): Instruction | string {
  const words = line.split(' ');
  const args = words
    .slice(1)
    .join(' ')
    .split(',')
    .map((operand) => operand.trim());

  const operation = wordToOperation[words[0]];
  if (operation === undefined) {
    return 'Unknown operation: ' + words[0];
  }

  assert(Operation.TOTAL_OPERATIONS === 2, 'Exhaustive handling of operations in line_to_op');
  switch (operation) {
    case Operation.MOV: {
      if (args.length !== 2) {
        return 'Invalid number of operands for MOV. Expected 2, got ' + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for MOV. Expected register, got ' + args[0];
      } else if (op2Type === undefined || (!isLowHighRegister(op2Type) && !isInmediateValue(op2Type))) {
        return 'Invalid operand 2 for MOV. Expected register or #8bit_Inm, got ' + args[1];
      }

      if (isInmediateValue(op2Type)) {
        if (isOutOfRange(args[1], 255)) {
          return 'Invalid inmediate for MOV. Number out of range. Expected 0-255 but got ' + args[1];
        } else if (op1Type === OperandType.HighRegister) {
          return 'Invalid register for MOV. Only low registers are allowed with inmediate values';
        }
      }

      // CASE: MOV r1, [Rs | #0xFF]
      return {
        operation: Operation.MOV,
        name: 'mov',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.ADD: {
      if (args.length !== 2 && args.length !== 3) {
        return 'Invalid number of operands for ADD';
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || (!isLowHighRegister(op1Type) && op1Type !== OperandType.SpRegister)) {
        return 'Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0];
      } else if (op2Type === undefined) {
        return 'Invalid operand 2 for ADD. Unexpected value: ' + args[1];
      }

      if (args.length === 2) {
        // ADD SHORT FORM
        switch (op1Type) {
          case OperandType.LowRegister:
            if (!isInmediateValue(op2Type) && !isLowHighRegister(op2Type) && op2Type !== OperandType.SpRegister) {
              return 'Invalid operand 2 for ADD. Expected #Inm, r[0-15] or sp, got ' + args[1];
            } else if (isInmediateValue(op2Type) && isOutOfRange(args[1], 255)) {
              return 'Invalid inmediate for ADD. Number out of range. Expected 0-255 but got ' + args[1];
            }

            // CASE: ADD r1, [Rs | #Inm | sp]
            return {
              operation: Operation.ADD,
              name: 'add',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
              ],
            };

          case OperandType.HighRegister:
            if (isInmediateValue(op2Type)) {
              return 'Invalid operand 2 for ADD. Only low registers are allowed with inmediate values';
            } else if (!isLowHighRegister(op2Type) && op2Type !== OperandType.SpRegister) {
              return 'Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1];
            }

            return {
              operation: Operation.ADD,
              name: 'add',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
              ],
            };

          case OperandType.SpRegister:
            if (!isInmediateValue(op2Type) && !isLowHighRegister(op2Type)) {
              return 'Invalid operand 2 for ADD. Expected r[0-15] or #Inm, got ' + args[1];
            } else if (isInmediateValue(op2Type)) {
              if (isOutOfRange(args[1], 508)) {
                return 'Invalid inmediate for ADD. Number out of range. Expected 0-508 but got ' + args[1];
              } else if (!isAligned(args[1], 4)) {
                return 'Invalid inmediate for ADD. Number not multiple of 4. Expected 0-508 but got ' + args[1];
              }
            }

            // CASE: ADD sp, [Rs | #0xFF]
            return {
              operation: Operation.ADD,
              name: 'add',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
              ],
            };

          default:
            return 'Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0];
        }
      } else {
        // ADD LONG FORM
        const op3Type = operandToOptype(args[2]);

        if (op3Type === undefined) {
          return 'Invalid operand 3 for ADD. Expected register or #Inm, got ' + args[2];
        } else if (
          (op1Type === OperandType.HighRegister || op2Type === OperandType.HighRegister) &&
          isInmediateValue(op3Type)
        ) {
          return 'Invalid register for ADD. Only low registers are allowed with inmediate values';
        } else if (
          (isLowHighRegister(op3Type) || op3Type === OperandType.SpRegister) &&
          args[0] !== args[1] &&
          args[0] !== args[2]
        ) {
          return 'Destiny must overlap one source register';
        }

        // op1Type and op2Type are registers, op3Type is an inmediate or register
        switch (op1Type) {
          case OperandType.LowRegister:
            if (op2Type === OperandType.LowRegister) {
              if (isInmediateValue(op3Type)) {
                const maxValue = args[0] === args[1] ? 255 : 7;
                if (isOutOfRange(args[2], maxValue)) {
                  return (
                    'Invalid inmediate for ADD. Number out of range. Expected 0-' + maxValue + ' but got ' + args[2]
                  );
                }
              } else if (!isLowHighRegister(op3Type) && op3Type !== OperandType.SpRegister) {
                return 'Invalid operand 3 for ADD. Expected r[0-15], sp or #8bit_Inm, got ' + args[2];
              }
            } else if (op2Type === OperandType.SpRegister) {
              if (isInmediateValue(op3Type)) {
                if (isOutOfRange(args[2], 1020)) {
                  return 'Invalid inmediate for ADD. Number out of range. Expected 0-1020 but got ' + args[2];
                }
              } else {
                return 'Invalid operand 3 for ADD. Expected #Inm, got ' + args[2];
              }
            } else if (op2Type !== OperandType.HighRegister) {
              return 'Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1];
            }

            // CASE: ADD r1, r2, [#0xFF | r3]
            return {
              operation: Operation.ADD,
              name: 'add',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
                { type: op3Type, value: args[2] },
              ],
            };

          case OperandType.HighRegister:
            if (!isLowHighRegister(op2Type) && op2Type !== OperandType.SpRegister) {
              return 'Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1];
            } else if (!isLowHighRegister(op3Type)) {
              return 'Invalid operand 3 for ADD. Expected r[0-15], got ' + args[2];
            }

            return {
              operation: Operation.ADD,
              name: 'add',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
                { type: op3Type, value: args[2] },
              ],
            };

          case OperandType.SpRegister:
            if (!isLowHighRegister(op2Type) && op2Type !== OperandType.SpRegister) {
              return 'Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1];
            } else if (isInmediateValue(op3Type)) {
              if (isOutOfRange(args[2], 508)) {
                return 'Invalid inmediate for ADD. Number out of range. Expected 0-508 but got ' + args[2];
              }
            } else if (!isLowHighRegister(op3Type)) {
              return 'Invalid operand 3 for ADD. Expected r[0-15] or #Inm, got ' + args[2];
            }

            return {
              operation: Operation.ADD,
              name: 'add',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
                { type: op3Type, value: args[2] },
              ],
            };

          default:
            return 'Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0];
        }
      }
    }

    default:
      throw new Error('Unreachable code in line_to_op');
  }
}

function compile_text_section(textSection: string): Program {
  const labels: { [key: string]: number } = {};
  const lines = textSection.split('\n');
  const program: Program = {
    error: undefined,
    ins: [],
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.length === 0) {
      continue;
    }

    let label: string | undefined;
    if (/^\w+:/.test(line)) {
      // A label exists in this line
      label = line.split(':')[0];
      if (labels[label] !== undefined) {
        program.error = {
          line: i + 1,
          message: 'The symbol `' + label + '` is already defined',
        }
        return program;
      }

      labels[label] = i;
      line = line.slice(label.length + 1).trim();
      while (line.length === 0) {
        // The line is just a label, parse next line
        line = lines[++i];
      }
    }

    const op = lineToInstruction(line);
    if (typeof op === 'string') {
      program.error = {
        line: i + 1,
        message: op,
      };

      return program;
    } else {
      op.label = label;
      program.ins.push(op);
    }
  }

  return program;
}

function compile_assembly(source: string): Program {
  const textSectionIndex = source.indexOf('.text');
  const dataSectionIndex = source.indexOf('.data');
  if (textSectionIndex === -1) {
    return { error: { message: 'Missing .text directive', line: 0 }, ins: [] };
  }

  let textSection = '';
  let dataSection = '';
  if (dataSectionIndex === -1) {
    // No data section in assembly, no memory needed
    textSection = source.slice(textSectionIndex + 5);
  } else if (dataSectionIndex < textSectionIndex) {
    // Data section is before text section
    textSection = source.slice(textSectionIndex + 5);
    dataSection = source.slice(dataSectionIndex + 5, textSectionIndex);
  } else {
    // Data section is after text section
    textSection = source.slice(textSectionIndex + 5, dataSectionIndex);
    dataSection = source.slice(dataSectionIndex + 5);
  }

  textSection = cleanInput(textSection);
  dataSection = cleanInput(dataSection);

  const program: Program = compile_text_section(textSection);
  void dataSection;

  return program;
}

export default compile_assembly;
export { assert };
