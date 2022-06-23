import { Operation, OperandType, wordToOperation, Operand, wordToDirective, Directive, dataDirectives, directiveToWord, operationToWord } from './types';
import type { Program, Instruction } from './types';

import { argToOperandType, assert, inmediateInRange, isAligned, isInmediateType, isRegisterType } from './utils';


// Global variables used by the compiler
let program: Program = { ins: [], error: undefined }
let symbols: { [key: string]: string } = {}
let memory: number[] = []
let memByteIndex = 0

function _throwCompilerError(error: string, line: number | undefined) {
  line = line === undefined ? 0 : line;
  program.error = {
    message: error,
    line: line,
  }
}

const throwCompilerError = (error: string) => {
  _throwCompilerError(error, undefined);
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
  return stripComments(source);
}

/**
 * Compiles a line directive. If the directive creates a symbol will be pushed to the symbols array
 * The data directives will push to the memory the bytes requested
 * @param line 
 * @returns 
 */
function compileDirective(line: string) {
  let directive = wordToDirective[line.split(' ')[0]];
  line = line.split(' ').slice(1).join(' ').trim();

  assert(Directive.TOTAL_DIRECTIVES === 15, 'Exhaustive handling of directives in compileDirective');
  switch (directive) {
    case Directive.EQUIV:
    case Directive.EQV:
    case Directive.EQU:
    case Directive.SET:
      {
        const args = line.split(',').map((arg) => arg.trim().toLowerCase());
        if (args.length !== 2) {
          return throwCompilerError('Invalid number of args for directive. Expected 2, got ' + args.length);
        }

        // Directive.EQV = Directive.EQUIV
        directive = directive === Directive.EQV ? Directive.EQUIV : directive;
        // Directive.SET = Directive.EQU
        directive = directive === Directive.SET ? Directive.EQU : directive;

        const [symbol, value] = args;
        if (directive !== Directive.EQU && symbols[symbol] !== undefined) {
          return throwCompilerError('Symbol \'' + symbol + '\' already defined');
        } else if (!/^\d+$/.test(value) && symbols[value] === undefined) {
          return throwCompilerError('Value must be a number or another symbol');
        }

        symbols[symbol] = value;
      } break;

    case Directive.BYTE:
    case Directive.HWORD:
    case Directive.WORD:
    case Directive.QUAD:
      {
        const args = line.split(',').map((arg) => arg.trim());
        if (args.length === 0) {
          return throwCompilerError('No value provided for the .byte directive');
        }

        let bytesToSave = 1;
        let savedBytes = 0;
        if (directive === Directive.HWORD) {
          bytesToSave = 2;
        } else if (directive === Directive.WORD) {
          bytesToSave = 4;
        } else if (directive === Directive.QUAD) {
          bytesToSave = 8;
        }

        for (let i = 0; i < args.length; i++) {
          // TODO: numbers bigger than 0xFFFFFFFF may cause problems
          // Tested with 0xFFFFFFFFFFFFFFFF and it doesn't load correctly
          let value = Number(args[i]);
          if (value === undefined) {
            return throwCompilerError('Invalid value \'' + args[i] + '\' for the' + directiveToWord[directive] + 'directive');
          }

          while (savedBytes !== bytesToSave) {
            const memIndex = Math.floor(memByteIndex / 4);
            const shifts = (memByteIndex % 4) * 8;
            const byte = value & 0xFF;

            memory[memIndex] = (memory[memIndex] | (byte << shifts)) >>> 0
            value = value >>> 8;
            memByteIndex++;
            savedBytes++;
          }

          savedBytes = 0;
        }
      } break;

    case Directive.SPACE:
      {
        const args = line.split(' ').map((arg) => arg.trim());
        if (args.length !== 1) {
          return throwCompilerError('Invalid number of arguments for SPACE. Expected 1');
        }

        const N = Number(args[0]);
        for (let i = 0; i < N; i++) {
          const memIndex = Math.floor(memByteIndex / 4);
          const shifts = (memByteIndex % 4) * 8;
          memory[memIndex] = (memory[memIndex] | (0x00 << shifts)) >>> 0
          memByteIndex++;
        }
      } break;

    case Directive.ALIGN:
    case Directive.BALIGN:
      {
        const args = line.split(' ');
        if (args.length !== 1) {
          return throwCompilerError('Invalid number of arguments for ALIGN. Expected 1');
        }

        const N = Number(args[0]);
        const base = directive === Directive.BALIGN ? N : 2 ** N;
        if (N === undefined) {
          return throwCompilerError('Invalid value for alignment');
        } else if (directive === Directive.ALIGN && N > 15) {
          return throwCompilerError('Invalid value for ALIGN argument. Expected number 0-15');
        } else if (directive === Directive.BALIGN && ((Math.log2(N) % 1) !== 0)) {
          return throwCompilerError('Invalid value for BALIGN argument. Number not a power of 2');
        }

        while ((memByteIndex % base) !== 0) {
          memByteIndex++;
        }
      } break;

    case Directive.ASCII:
    case Directive.ASCIZ:
      {
        if (!/^"\w+(\s+\w+)*"$/.test(line)) {
          return throwCompilerError('Invalid string value. Use "Hello"');
        }

        const str = line.replace('"', '').replace('"', '');

        for (let i = 0; i < str.length; i++) {
          const memIndex = Math.floor(memByteIndex / 4);
          const shifts = (memByteIndex % 4) * 8;

          memory[memIndex] = (memory[memIndex] | (str.charCodeAt(i) << shifts)) >>> 0;
          memByteIndex++;
        }

        if (directive === Directive.ASCIZ) {
          const memIndex = Math.floor(memByteIndex / 4);
          const shifts = (memByteIndex % 4) * 8;
          memory[memIndex] = (memory[memIndex] | (0x00 << shifts)) >>> 0;
          memByteIndex++;
        }
      } break;

    default:
      throw new Error('Unreachable code in compileDirective. Caused by: ' + directive);
  }
}

/**
 * Compiles a line into a Instruction object and push it to the program.ins array
 * @param line 
 * @returns 
 */
function compileInstruction(line: string) {
  const words = line.split(' ');
  const args = words
    .slice(1)
    .join(' ')
    .split(',')
    .map((operand) => operand.trim());

  const operation = wordToOperation[words[0]];
  if (operation === undefined) {
    return throwCompilerError('Unknown operation: ' + words[0]);
  }

  for (let i = 0; i < args.length; i++) {
    if (symbols[args[i].replace('#', "")] !== undefined) {
      args[i] = '#' + symbols[args[i].replace('#', '')]
    }
  }

  let instruction: Instruction = {
    operation: operation,
    name: operationToWord[operation],
    operands: [],
    break: false,
  }

  assert(Operation.TOTAL_OPERATIONS === 17, 'Exhaustive handling of operations in lineToInstruction');
  switch (operation) {
    case Operation.MOV: {
      // CASE: MOV r1, [Rs | #0xFF]
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of operands for MOV. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for MOV. Expected r[0-15] or sp, got ' + args[0]);
      } else if (op2Type === undefined) {
        return throwCompilerError('Invalid operand 2 for MOV. Expected register or #8bit_Inm, got ' + args[1]);
      } else if ((op1Type === OperandType.SpRegister || op1Type === OperandType.HighRegister) && isInmediateType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for MOV. Only low registers allowed with inmediate values');
      }

      if (isInmediateType(op2Type)) {
        if (!inmediateInRange(args[1], 255)) {
          return throwCompilerError('Invalid inmediate for MOV. Number out of range. Expected 0-255 but got ' + args[1]);
        } else if (op1Type === OperandType.HighRegister) {
          return throwCompilerError('Invalid register for MOV. Only low registers are allowed with inmediate values');
        }
      }
    } break;

    case Operation.ADD: {
      if (args.length !== 2 && args.length !== 3) {
        return throwCompilerError('Invalid number of operands for ADD');
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0]);
      } else if (op2Type === undefined) {
        return throwCompilerError('Invalid operand 2 for ADD. Unexpected value: ' + args[1]);
      }

      if (args.length === 2) {
        // ADD SHORT FORM
        switch (op1Type) {
          case OperandType.LowRegister:
            // CASE: ADD r1, [Rs | #Inm | sp]
            if (!isInmediateType(op2Type) && !isRegisterType(op2Type)) {
              return throwCompilerError('Invalid operand 2 for ADD. Expected #Inm, r[0-15] or sp, got ' + args[1]);
            } else if (isInmediateType(op2Type) && !inmediateInRange(args[1], 255)) {
              return throwCompilerError('Invalid inmediate for ADD. Number out of range. Expected 0-255 but got ' + args[1]);
            }
            break;

          case OperandType.HighRegister:
            if (isInmediateType(op2Type)) {
              return throwCompilerError('Invalid operand 2 for ADD. Only low registers are allowed with inmediate values');
            } else if (!isRegisterType(op2Type)) {
              return throwCompilerError('Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1]);
            }
            break;

          case OperandType.SpRegister:
            // CASE: ADD sp, [Rs | #0xFF]
            if (!isInmediateType(op2Type) && !isRegisterType(op2Type)) {
              return throwCompilerError('Invalid operand 2 for ADD. Expected r[0-15] or #Inm, got ' + args[1]);
            } else if (isInmediateType(op2Type)) {
              if (!inmediateInRange(args[1], 508)) {
                return throwCompilerError('Invalid inmediate for ADD. Number out of range. Expected 0-508 but got ' + args[1]);
              } else if (!isAligned(args[1], 4)) {
                return throwCompilerError('Invalid inmediate for ADD. Number not multiple of 4. Expected 0-508 but got ' + args[1]);
              }
            }
            break;

          default:
            return throwCompilerError('Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0]);
        }
      } else {
        // ADD LONG FORM
        if (op3Type === undefined) {
          return throwCompilerError('Invalid operand 3 for ADD. Expected register or #Inm, got ' + args[2]);
        } else if (
          (op1Type === OperandType.HighRegister || op2Type === OperandType.HighRegister) &&
          isInmediateType(op3Type)
        ) {
          return throwCompilerError('Invalid register for ADD. Only low registers are allowed with inmediate values');
        } else if (
          (isRegisterType(op3Type) || op3Type === OperandType.SpRegister) &&
          args[0] !== args[1] &&
          args[0] !== args[2] &&
          op1Type !== OperandType.LowRegister && op2Type !== OperandType.LowRegister && op3Type !== OperandType.LowRegister
        ) {
          return throwCompilerError('Destiny must overlap one source register');
        }

        // op1Type and op2Type are registers, op3Type is an inmediate or register
        switch (op1Type) {
          case OperandType.LowRegister:
            // CASE: ADD r1, r2, [#0xFF | r3]
            if (op2Type === OperandType.LowRegister) {
              if (isInmediateType(op3Type)) {
                const maxValue = args[0] === args[1] ? 255 : 7;
                if (!inmediateInRange(args[2], maxValue)) {
                  return throwCompilerError('Invalid inmediate for ADD. Number out of range. Expected 0-' + maxValue + ' but got ' + args[2]);
                }
              } else if (!isRegisterType(op3Type)) {
                return throwCompilerError('Invalid operand 3 for ADD. Expected r[0-15], sp or #8bit_Inm, got ' + args[2]);
              }
            } else if (op2Type === OperandType.SpRegister) {
              if (isInmediateType(op3Type)) {
                if (!inmediateInRange(args[2], 1020)) {
                  return throwCompilerError('Invalid inmediate for ADD. Number out of range. Expected 0-1020 but got ' + args[2]);
                }
              } else {
                return throwCompilerError('Invalid operand 3 for ADD. Expected #Inm, got ' + args[2]);
              }
            } else if (op2Type !== OperandType.HighRegister) {
              return throwCompilerError('Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1]);
            }
            break;

          case OperandType.HighRegister:
            if (!isRegisterType(op2Type)) {
              return throwCompilerError('Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1]);
            } else if (!isRegisterType(op3Type)) {
              return throwCompilerError('Invalid operand 3 for ADD. Expected r[0-15], got ' + args[2]);
            }
            break;

          case OperandType.SpRegister:
            if (!isRegisterType(op2Type)) {
              return throwCompilerError('Invalid operand 2 for ADD. Expected r[0-15] or sp, got ' + args[1]);
            } else if (isInmediateType(op3Type)) {
              if (!inmediateInRange(args[2], 508)) {
                return throwCompilerError('Invalid inmediate for ADD. Number out of range. Expected 0-508 but got ' + args[2]);
              }
            } else if (!isRegisterType(op3Type)) {
              return throwCompilerError('Invalid operand 3 for ADD. Expected r[0-15] or #Inm, got ' + args[2]);
            }
            break;

          default:
            return throwCompilerError('Invalid operand 1 for ADD. Expected r[0-15] or sp, got ' + args[0]);
        }
      }
    } break;

    case Operation.SUB: {
      if (args.length !== 2 && args.length !== 3) {
        return throwCompilerError('Invalid number of arguments for SUB. Expected 2 or 3, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || isInmediateType(op1Type) || op1Type === OperandType.HighRegister) {
        return throwCompilerError('Invalid operand 1 for SUB. Expected r[0-7] or #Inm, got ' + args[0]);
      } else if (op2Type === undefined || op2Type === OperandType.HighRegister) {
        return throwCompilerError('Invalid operand 2 for SUB. Expected r[0-7] or #Inm, got ' + args[1]);
      }

      // Short form. op1Type is always a low register or sp
      if (args.length === 2) {
        if (op1Type === OperandType.SpRegister) {
          // CASE: sub sp, #0xFF
          if (!isInmediateType(op2Type)) {
            return throwCompilerError('Invalid operand 2 for SUB. Expected #Inm, got ' + args[1]);
          } else if (!inmediateInRange(args[1], 508)) {
            return throwCompilerError('Invalid inmediate for SUB. Number out of range. Expected 0-508 but got ' + args[1]);
          } else if (!isAligned(args[1], 4)) {
            return throwCompilerError('Invalid inmediate for SUB. Number not aligned to 4.');
          }
        } else {
          // op1Type is a low register
          // CASE: sub r1, [r2 | #0xFF]
          if (isInmediateType(op2Type)) {
            if (!inmediateInRange(args[1], 255)) {
              return throwCompilerError('Invalid inmediate for SUB. Number out of range. Expected 0-255 but got ' + args[1]);
            }
          }
        }
      } else {
        // Long form
        if (op1Type === OperandType.LowRegister) {
          // CASE: sub r1, r2, [r3 | #0xFF]
          if (op2Type !== OperandType.LowRegister) {
            return throwCompilerError('Invalid operand 2 for SUB. Expected r[0-7], got ' + args[1]);
          } else if (op3Type === undefined || (op3Type !== OperandType.LowRegister && !isInmediateType(op3Type))) {
            return throwCompilerError('Invalid operand 3 for SUB. Expected r[0-7] or #Inm, got ' + args[2]);
          }
        } else {
          // op1Type is a sp register
          // CASE: sub sp, sp, #0xFF
          if (op2Type !== OperandType.SpRegister) {
            return throwCompilerError('Invalid operand 2 for SUB. Expected sp, got ' + args[1]);
          } else if (op3Type === undefined || !isInmediateType(op3Type)) {
            return throwCompilerError('Invalid operand 3 for SUB. Expected #Inm, got ' + args[2]);
          }

          if (!inmediateInRange(args[2], 508)) {
            return throwCompilerError('Invalid inmediate for SUB. Number out of range. Expected 0-508 but got ' + args[2]);
          } else if (!isAligned(args[2], 4)) {
            return throwCompilerError('Invalid inmediate for SUB. Number not aligned to 4.');
          }
        }
      }
    } break;

    case Operation.NEG: {
      // CASE: neg r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for NEG. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for NEG. Expected r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for NEG. Expected r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.MUL: {
      if (args.length !== 2 && args.length !== 3) {
        return throwCompilerError('Invalid number of arguments for MUL. Expected 2 or 3, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || op1Type !== OperandType.LowRegister) {
        return throwCompilerError('Invalid operand 1 for MUL. Expected low register r[0-7], got ' + args[0]);
      } else if (op2Type === undefined || op2Type !== OperandType.LowRegister) {
        return throwCompilerError('Invalid operand 2 for MUL. Expected low register r[0-7], got ' + args[1]);
      }

      if (args.length === 3) {
        // Long form
        if (op3Type === undefined || op3Type !== OperandType.LowRegister) {
          return throwCompilerError('Invalid operand 3 for MUL. Expected r[0-7], got ' + args[2]);
        } else if (args[0] !== args[1] && args[0] !== args[2]) {
          return throwCompilerError('Destination register must be the same as one of the source registers for MUL.');
        }
      }
    } break;

    case Operation.CMP: {
      // CASE: cmp r1, [r2 | #Inm8]
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for CMP. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for CMP. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined) {
        return throwCompilerError('Invalid operand 2 for CMP. Expected register r[0-15] or #Inm8, got ' + args[1]);
      }

      if (isInmediateType(op2Type) && !inmediateInRange(args[1], 255)) {
        return throwCompilerError('Invalid inmediate for CMP. Number out of range. Expected 0-255 but got ' + args[1]);
      }
    } break;

    case Operation.CMN: {
      // CASE: cmn r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for CMP. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for CMN. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for CMN. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.AND: {
      // CASE: and r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for AND. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for AND. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for AND. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.BIC: {
      // CASE: bic r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for BIC. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for BIC. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for BIC. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.ORR: {
      // CASE: orr r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for ORR. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for ORR. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for ORR. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.EOR: {
      // CASE: eor r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for EOR. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for EOR. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for EOR. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.MVN: {
      // CASE: mvn r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for MVN. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for MVN. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for MVN. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.TST: {
      // CASE: tst r1, r2
      if (args.length !== 2) {
        return throwCompilerError('Invalid number of arguments for TST. Expected 2, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for TST. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for TST. Expected register r[0-15], got ' + args[1]);
      }
    } break;

    case Operation.LSL: {
      // CASE: lsl r1, r2, #Inm
      if (args.length !== 3) {
        return throwCompilerError('Invalid number of arguments for LSL. Expected 3, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for LSL. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for LSL. Expected register r[0-15], got ' + args[1]);
      } else if (op3Type === undefined || (!isRegisterType(op3Type) && !isInmediateType(op3Type))) {
        return throwCompilerError('Invalid operand 3 for LSL. Expected register r[0-15] or #0-31, got ' + args[2]);
      } else if (isInmediateType(op3Type) && !inmediateInRange(args[2], 31)) {
        return throwCompilerError('Invalid operand 3 for LSL. Number must be between 0 and 31, got ' + args[2]);
      }
    } break;

    case Operation.LSR: {
      // CASE: lsr r1, r2, #Inm
      if (args.length !== 3) {
        return throwCompilerError('Invalid number of arguments for LSR. Expected 3, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for LSR. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for LSR. Expected register r[0-15], got ' + args[1]);
      } else if (op3Type === undefined || (!isRegisterType(op3Type) && !isInmediateType(op3Type))) {
        return throwCompilerError('Invalid operand 3 for LSR. Expected register r[0-15] or #0-31, got ' + args[2]);
      } else if (isInmediateType(op3Type) && !inmediateInRange(args[2], 31)) {
        return throwCompilerError('Invalid operand 3 for LSR. Number must be between 0 and 31, got ' + args[2]);
      }
    } break;

    case Operation.ASR: {
      // CASE: asr r1, r2, #Inm
      if (args.length !== 3) {
        return throwCompilerError('Invalid number of arguments for ASR. Expected 3, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for ASR. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for ASR. Expected register r[0-15], got ' + args[1]);
      } else if (op3Type === undefined || (!isRegisterType(op3Type) && !isInmediateType(op3Type))) {
        return throwCompilerError('Invalid operand 3 for ASR. Expected register r[0-15] or #0-31, got ' + args[2]);
      } else if (isInmediateType(op3Type) && !inmediateInRange(args[2], 31)) {
        return throwCompilerError('Invalid operand 3 for ASR. Number must be between 0 and 31, got ' + args[2]);
      }
    } break;

    case Operation.ROR: {
      // CASE: ror r1, r2, #Inm
      if (args.length !== 3) {
        return throwCompilerError('Invalid number of arguments for ROR. Expected 3, got ' + args.length);
      }

      const op1Type = argToOperandType(args[0]);
      const op2Type = argToOperandType(args[1]);
      const op3Type = argToOperandType(args[2]);

      if (op1Type === undefined || !isRegisterType(op1Type)) {
        return throwCompilerError('Invalid operand 1 for ROR. Expected register r[0-15], got ' + args[0]);
      } else if (op2Type === undefined || !isRegisterType(op2Type)) {
        return throwCompilerError('Invalid operand 2 for ROR. Expected register r[0-15], got ' + args[1]);
      } else if (op3Type === undefined || !isRegisterType(op3Type)) {
        return throwCompilerError('Invalid operand 3 for ROR. Expected register r[0-15], got ' + args[2]);
      }
    } break;

    default:
      throw new Error('Unreachable code in lineToInstruction');
  }

  for (let i = 0; i < args.length; i++) {
    const operandType = argToOperandType(args[i]);
    if (operandType === undefined) {
      return throwCompilerError("Unexpected error in the compiler");
    }

    const operand: Operand = {
      type: operandType,
      value: args[i] === "sp" ? "r13" : args[i],
    }
    instruction.operands.push(operand);
  }

  program.ins.push(instruction);
}

function compileAssembly(source: string): [Program, number[]] {
  const labels: { [key: string]: number } = {};
  const lines = source.split('\n');
  let inTextSection = true;

  for (let i = 0; i < lines.length; i++) {
    // Delete comments and lowercase assembly
    lines[i] = cleanInput(lines[i]);

    // Skip empty lines
    if (lines[i] === '') continue;

    let firstWord = lines[i].split(' ')[0].toLowerCase();
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
    } else if (directive !== undefined && inTextSection && dataDirectives.find((el) => el === directive)) {
      program.error = {
        line: i + 1,
        message: "Data directives not supported in text section",
      }

      break;
    }

    if (operation !== undefined) {
      compileInstruction(lines[i].toLowerCase());
      if (label !== undefined) {
        program.ins[program.ins.length - 1].label = label;
      }

      // Stop compilation if an error occured
      if (program.error !== undefined) {
        program.error.line = i + 1;
        break;
      }
    } else if (directive !== undefined) {
      if (wordToDirective[firstWord] === Directive.TEXT) {
        inTextSection = true;
        lines[i] = lines[i].replace(".text", "");
        i--;
        continue;
      } else if (wordToDirective[firstWord] === Directive.DATA) {
        inTextSection = false;
        lines[i] = lines[i].replace(".data", "");
        i--;
        continue;
      }

      compileDirective(lines[i]);

      // Stop compilation if an error occured
      if (program.error !== undefined) {
        program.error.line = i + 1;
        break;
      }
    } else {
      program.error = {
        line: i + 1,
        message: "Unknown operation: " + firstWord,
      }

      break;
    }

  }

  const retMemory = [...memory];
  const retProgram = { ...program };

  resetCompiler();
  return [retProgram, retMemory];
}

function resetCompiler() {
  program = { ins: [], error: undefined }
  memByteIndex = 0;
  symbols = {}
  memory = []
}

export default compileAssembly;
