import { Operation, OperandType, wordToOperation, isLowHighRegister, isInmediateValue, Operand, wordToDirective, Directive } from './types';
import type { Program, Instruction } from './types';


// Object with the symbols defined by the user with .equiv, .eqv y .equ
let symbols: { [key: string]: string } = {}

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

function parseInmediateOperand(operand: Operand): number {
  const radix = operand.value.startsWith('#0x') ? 16 : 10;
  return parseInt(operand.value.slice(1), radix);
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

function compileDirective(line: string) {
  const directive = wordToDirective[line.split(' ')[0]];
  line = line.split(' ').slice(1).join('');

  switch (directive) {
    case Directive.EQUIV:
    case Directive.EQV:
    case Directive.EQU:
      {
        const args = line.split(',');
        if (args.length !== 2) {
          return "Invalid number of args for directive. Expected 2, got " + args.length;
        }

        const [symbol, value] = args;
        if (directive !== Directive.EQU && symbols[symbol] !== undefined) {
          return "Symbol '" + symbol + "' already defined";
        } else if (!/^\d+$/.test(value) && symbols[value] === undefined) {
          return "Value must be a number or another symbol";
        }

        symbols[symbol] = value;
        return
      }
    default:
      throw new Error('Unreachable code in compileDirective. Caused by: ' + directive);
  }
}


function operandToOptype(operand: string): OperandType | undefined {
  // Check by regular expressions the corresponding operand type. If none is found, return undefined.
  let type: OperandType | undefined;
  if (operand === undefined) {
    return undefined;
  }

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

  for (let i = 0; i < args.length; i++) {
    if (symbols[args[i].replace('#', "")] !== undefined) {
      args[i] = '#' + symbols[args[i].replace('#', '')]
    }
  }

  assert(Operation.TOTAL_OPERATIONS === 17, 'Exhaustive handling of operations in lineToInstruction');
  switch (operation) {
    case Operation.MOV: {
      if (args.length !== 2) {
        return 'Invalid number of operands for MOV. Expected 2, got ' + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);

      for (let i = 0; i < args.length; i++) {
        args[i] = args[i] === 'sp' ? 'r13' : args[i];
      }

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for MOV. Expected r[0-15] or sp, got ' + args[0];
      } else if (op2Type === undefined) {
        return 'Invalid operand 2 for MOV. Expected register or #8bit_Inm, got ' + args[1];
      } else if ((op1Type === OperandType.SpRegister || op1Type === OperandType.HighRegister) && isInmediateValue(op2Type)) {
        return 'Invalid operand 2 for MOV. Only low registers allowed with inmediate values';
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
      const op3Type = operandToOptype(args[2]);

      for (let i = 0; i < args.length; i++) {
        args[i] = args[i] === 'sp' ? 'r13' : args[i];
      }

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0];
      } else if (op2Type === undefined) {
        return 'Invalid operand 2 for ADD. Unexpected value: ' + args[1];
      }

      if (args.length === 2) {
        // ADD SHORT FORM
        switch (op1Type) {
          case OperandType.LowRegister:
            if (!isInmediateValue(op2Type) && !isLowHighRegister(op2Type)) {
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
            } else if (!isLowHighRegister(op2Type)) {
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
          args[0] !== args[2] &&
          op1Type !== OperandType.LowRegister && op2Type !== OperandType.LowRegister && op3Type !== OperandType.LowRegister
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
              } else if (!isLowHighRegister(op3Type)) {
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
            if (!isLowHighRegister(op2Type)) {
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
            if (!isLowHighRegister(op2Type)) {
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

    case Operation.SUB: {
      if (args.length !== 2 && args.length !== 3) {
        return 'Invalid number of arguments for SUB. Expected 2 or 3, got ' + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      const op3Type = operandToOptype(args[2]);

      for (let i = 0; i < args.length; i++) {
        args[i] = args[i] === 'sp' ? 'r13' : args[i];
      }

      // Short form
      if (args.length === 2) {
        if (op1Type === undefined || isInmediateValue(op1Type) || op1Type === OperandType.HighRegister) {
          return 'Invalid operand 1 for SUB. Expected r[0-7] or #Inm, got ' + args[0];
        } else if (op2Type === undefined || op2Type === OperandType.HighRegister) {
          return 'Invalid operand 2 for SUB. Expected r[0-7] or #Inm, got ' + args[1];
        }

        // op1Type is a register
        if (op1Type === OperandType.SpRegister) {
          if (!isInmediateValue(op2Type)) {
            return 'Invalid operand 2 for SUB. Expected #Inm, got ' + args[1];
          } else if (isOutOfRange(args[1], 508)) {
            return 'Invalid inmediate for SUB. Number out of range. Expected 0-508 but got ' + args[1];
          } else if (!isAligned(args[1], 4)) {
            return 'Invalid inmediate for SUB. Number not aligned to 4.';
          }

          // CASE: sub sp, #0xFF
          return {
            operation: Operation.SUB,
            name: 'sub',
            operands: [
              { type: op1Type, value: args[0] },
              { type: op2Type, value: args[1] },
            ],
          };
        } else {
          // op1Type is a low register
          if (op2Type === OperandType.LowRegister) {
            // CASE: sub r1, r2
            return {
              operation: Operation.SUB,
              name: 'sub',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
              ],
            };
          } else {
            // CASE: sub r1, #0xFF
            if (isOutOfRange(args[1], 255)) {
              return 'Invalid inmediate for SUB. Number out of range. Expected 0-255 but got ' + args[1];
            }

            return {
              operation: Operation.SUB,
              name: 'sub',
              operands: [
                { type: op1Type, value: args[0] },
                { type: op2Type, value: args[1] },
              ],
            };
          }
        }
      } else {
        // Long form
        if (op1Type === undefined || op1Type === OperandType.HighRegister || isInmediateValue(op1Type)) {
          return 'Invalid operand 1 for SUB. Expected r[0-7] or sp, got ' + args[0];
        }

        // op1Type is a low register
        if (op1Type === OperandType.LowRegister) {
          if (op2Type !== OperandType.LowRegister) {
            return 'Invalid operand 2 for SUB. Expected r[0-7], got ' + args[1];
          } else if (op3Type === undefined || (op3Type !== OperandType.LowRegister && !isInmediateValue(op3Type))) {
            return 'Invalid operand 3 for SUB. Expected r[0-7] or #Inm, got ' + args[2];
          }

          // CASE: sub r1, r2, r3
          return {
            operation: Operation.SUB,
            name: 'sub',
            operands: [
              { type: op1Type, value: args[0] },
              { type: op2Type, value: args[1] },
              { type: op3Type, value: args[2] },
            ],
          };
        } else {
          // op1Type is a sp register
          if (op2Type !== OperandType.SpRegister) {
            return 'Invalid operand 2 for SUB. Expected sp, got ' + args[1];
          } else if (op3Type === undefined || !isInmediateValue(op3Type)) {
            return 'Invalid operand 3 for SUB. Expected #Inm, got ' + args[2];
          }

          if (isOutOfRange(args[2], 508)) {
            return 'Invalid inmediate for SUB. Number out of range. Expected 0-508 but got ' + args[2];
          } else if (!isAligned(args[2], 4)) {
            return 'Invalid inmediate for SUB. Number not aligned to 4.';
          }

          // CASE: sub sp, sp, #0xFF
          return {
            operation: Operation.SUB,
            name: 'sub',
            operands: [
              { type: op1Type, value: args[0] },
              { type: op2Type, value: args[1] },
              { type: op3Type, value: args[2] },
            ],
          };
        }

      }
    }

    case Operation.NEG: {
      if (args.length !== 2) {
        return 'Invalid number of arguments for NEG. Expected 2, got ' + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for NEG. Expected r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for NEG. Expected r[0-15], got ' + args[1];
      }

      // CASE: neg r1, r2
      return {
        operation: Operation.NEG,
        name: 'neg',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.MUL: {
      if (args.length !== 2 && args.length !== 3) {
        return 'Invalid number of arguments for MUL. Expected 2 or 3, got ' + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      const op3Type = operandToOptype(args[2]);

      if (op1Type === undefined || op1Type !== OperandType.LowRegister) {
        return 'Invalid operand 1 for MUL. Expected low register r[0-7], got ' + args[0];
      } else if (op2Type === undefined || op2Type !== OperandType.LowRegister) {
        return 'Invalid operand 2 for MUL. Expected low register r[0-7], got ' + args[1];
      }

      // Short form
      if (args.length === 2) {
        // CASE: mul r1, r2
        return {
          operation: Operation.MUL,
          name: 'mul',
          operands: [
            { type: op1Type, value: args[0] },
            { type: op2Type, value: args[1] },
          ],
        };
      } else {
        // Long form
        if (op3Type === undefined || op3Type !== OperandType.LowRegister) {
          return 'Invalid operand 3 for MUL. Expected r[0-7], got ' + args[2];
        } else if (args[0] !== args[1] && args[0] !== args[2]) {
          return 'Destination register must be the same as one of the source registers for MUL.';
        }

        // CASE: mul r2, r2, r3
        return {
          operation: Operation.MUL,
          name: 'mul',
          operands: [
            { type: op1Type, value: args[0] },
            { type: op2Type, value: args[1] },
            { type: op3Type, value: args[2] },
          ],
        };
      }
    }

    case Operation.CMP: {
      if (args.length !== 2) {
        return "Invalid number of arguments for CMP. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for CMP. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined) {
        return 'Invalid operand 2 for CMP. Expected register r[0-15] or #Inm8, got ' + args[1];
      }

      if (isInmediateValue(op2Type) && isOutOfRange(args[1], 255)) {
        return 'Invalid inmediate for CMP. Number out of range. Expected 0-255 but got ' + args[1];
      }

      // CASE: cmp r1, [r2 | #Inm8]
      return {
        operation: Operation.CMP,
        name: 'cmp',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.CMN: {
      if (args.length !== 2) {
        return "Invalid number of arguments for CMP. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for CMN. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for CMN. Expected register r[0-15], got ' + args[1];
      }

      // CASE: cmn r1, r2
      return {
        operation: Operation.CMN,
        name: 'cmn',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.AND: {
      if (args.length !== 2) {
        return "Invalid number of arguments for AND. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for AND. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for AND. Expected register r[0-15], got ' + args[1];
      }

      // CASE: and r1, r2
      return {
        operation: Operation.AND,
        name: 'and',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.BIC: {
      if (args.length !== 2) {
        return "Invalid number of arguments for BIC. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for BIC. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for BIC. Expected register r[0-15], got ' + args[1];
      }

      // CASE: bic r1, r2
      return {
        operation: Operation.BIC,
        name: 'bic',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.ORR: {
      if (args.length !== 2) {
        return "Invalid number of arguments for ORR. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for ORR. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for ORR. Expected register r[0-15], got ' + args[1];
      }

      // CASE: orr r1, r2
      return {
        operation: Operation.ORR,
        name: 'orr',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.EOR: {
      if (args.length !== 2) {
        return "Invalid number of arguments for EOR. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for EOR. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for EOR. Expected register r[0-15], got ' + args[1];
      }

      // CASE: eor r1, r2
      return {
        operation: Operation.EOR,
        name: 'eor',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.MVN: {
      if (args.length !== 2) {
        return "Invalid number of arguments for MVN. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for MVN. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for MVN. Expected register r[0-15], got ' + args[1];
      }

      // CASE: mvn r1, r2
      return {
        operation: Operation.MVN,
        name: 'mvn',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.TST: {
      if (args.length !== 2) {
        return "Invalid number of arguments for TST. Expected 2, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for TST. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for TST. Expected register r[0-15], got ' + args[1];
      }

      // CASE: tst r1, r2
      return {
        operation: Operation.TST,
        name: 'tst',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
        ],
      };
    }

    case Operation.LSL: {
      if (args.length !== 3) {
        return "Invalid number of arguments for LSL. Expected 3, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      const op3Type = operandToOptype(args[2]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for LSL. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for LSL. Expected register r[0-15], got ' + args[1];
      } else if (op3Type === undefined || (!isLowHighRegister(op3Type) && !isInmediateValue(op3Type))) {
        return 'Invalid operand 3 for LSL. Expected register r[0-15] or #0-31, got ' + args[2];
      } else if (isInmediateValue(op3Type) && isOutOfRange(args[2], 31)) {
        return 'Invalid operand 3 for LSL. Number must be between 0 and 31, got ' + args[2];
      }

      // CASE: lsl r1, r2
      return {
        operation: Operation.LSL,
        name: 'lsl',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
          { type: op3Type, value: args[2] },
        ],
      };
    }

    case Operation.LSR: {
      if (args.length !== 3) {
        return "Invalid number of arguments for LSR. Expected 3, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      const op3Type = operandToOptype(args[2]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for LSR. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for LSR. Expected register r[0-15], got ' + args[1];
      } else if (op3Type === undefined || (!isLowHighRegister(op3Type) && !isInmediateValue(op3Type))) {
        return 'Invalid operand 3 for LSR. Expected register r[0-15] or #0-31, got ' + args[2];
      } else if (isInmediateValue(op3Type) && isOutOfRange(args[2], 31)) {
        return 'Invalid operand 3 for LSR. Number must be between 0 and 31, got ' + args[2];
      }

      // CASE: lsr r1, r2
      return {
        operation: Operation.LSR,
        name: 'lsr',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
          { type: op3Type, value: args[2] },
        ],
      };
    }

    case Operation.ASR: {
      if (args.length !== 3) {
        return "Invalid number of arguments for ASR. Expected 3, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      const op3Type = operandToOptype(args[2]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for ASR. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for ASR. Expected register r[0-15], got ' + args[1];
      } else if (op3Type === undefined || (!isLowHighRegister(op3Type) && !isInmediateValue(op3Type))) {
        return 'Invalid operand 3 for ASR. Expected register r[0-15] or #0-31, got ' + args[2];
      } else if (isInmediateValue(op3Type) && isOutOfRange(args[2], 31)) {
        return 'Invalid operand 3 for ASR. Number must be between 0 and 31, got ' + args[2];
      }

      // CASE: asr r1, r2
      return {
        operation: Operation.ASR,
        name: 'asr',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
          { type: op3Type, value: args[2] },
        ],
      };
    }

    case Operation.ROR: {
      if (args.length !== 3) {
        return "Invalid number of arguments for ROR. Expected 3, got " + args.length;
      }

      const op1Type = operandToOptype(args[0]);
      const op2Type = operandToOptype(args[1]);
      const op3Type = operandToOptype(args[2]);

      if (op1Type === undefined || !isLowHighRegister(op1Type)) {
        return 'Invalid operand 1 for ROR. Expected register r[0-15], got ' + args[0];
      } else if (op2Type === undefined || !isLowHighRegister(op2Type)) {
        return 'Invalid operand 2 for ROR. Expected register r[0-15], got ' + args[1];
      } else if (op3Type === undefined || !isLowHighRegister(op3Type)) {
        return 'Invalid operand 3 for ROR. Expected register r[0-15], got ' + args[2];
      }

      // CASE: ror r1, r2
      return {
        operation: Operation.ROR,
        name: 'ror',
        operands: [
          { type: op1Type, value: args[0] },
          { type: op2Type, value: args[1] },
          { type: op3Type, value: args[2] },
        ],
      };
    }

    default:
      throw new Error('Unreachable code in lineToInstruction');
  }
}

function compileAssembly(source: string): Program {
  const labels: { [key: string]: number } = {};
  const lines = source.split('\n');
  let inTextSection = true;
  const program: Program = {
    ins: [],
    error: undefined,
  }

  for (let i = 0; i < lines.length; i++) {
    // Delete comments and lowercase assembly
    lines[i] = cleanInput(lines[i]);

    // Skip empty lines
    if (lines[i] === '') continue;

    let firstWord = lines[i].split(' ')[0];
    let operation = wordToOperation[firstWord];
    let directive = wordToDirective[firstWord];
    let label = /^\w+:/.test(lines[i]) ? lines[i].split(':')[0] : undefined;

    // If there is a label check if already exists and add if not
    if (label !== undefined && labels[label] !== undefined) {
      program.error = {
        line: i + 1,
        message: 'Label already defined: ' + label,
      }

      break;
    } else if (label !== undefined) {
      labels[label] = i;
      lines[i] = lines[i].slice(label.length + 1).trim();
      while (lines[i].length === 0) {
        // The line is just a label, parse next line
        i++;
      }

      // Clean line and get data again since the line changed
      lines[i] = cleanInput(lines[i]);
      firstWord = lines[i].split(' ')[0];
      operation = wordToOperation[firstWord];
      directive = wordToDirective[firstWord];
    }

    if (operation !== undefined && !inTextSection) {
      program.error = {
        line: i + 1,
        message: "Operations not supported in data section",
      }

      break;
    }

    if (operation !== undefined) {
      const instruction = lineToInstruction(lines[i]);
      if (typeof instruction === 'string') {
        program.error = {
          line: i + 1,
          message: instruction,
        };
  
        break;
      }

      instruction.label = label;
      program.ins.push(instruction);
    } else if (directive !== undefined) {
      if (wordToDirective[firstWord] === Directive.TEXT) {
        inTextSection = true;
        continue;
      } else if (wordToDirective[firstWord] === Directive.DATA) {
        inTextSection = false;
        continue;
      }

      const directive = compileDirective(lines[i]);
      if (typeof directive === 'string') {
        program.error = {
          line: i + 1,
          message: directive,
        }
      }
    } else {
      program.error = {
        line: i + 1,
        message: "Unknown operation: " + firstWord,
      }

      break;
    }

  }

  symbols = {}
  return program;
}

export default compileAssembly;
export { assert, parseInmediateOperand };
