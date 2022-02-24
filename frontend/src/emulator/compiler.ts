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

const str_to_op: { [key: string]: Operation } = {
  'mov': Operation.MOV,
  'add': Operation.ADD,
}

enum OperandType {
  LowRegister,
  HighRegister,
  HexInmediate,
  DecInmediate,
}

type CompilerError = {
  message: string,
  line: number,
  column: number,
}

type Operand = {
  type: OperandType,
  value: string,
}

type Instruction = {
  operation: Operation,
  operands: Operand[],
}

type Program = {
  error?: CompilerError,
  ins: Instruction[],
}

function operand_to_optype(operand: string): OperandType | string {
  if (operand.startsWith('r')) {
    // Register Operand
    const reg = parseInt(operand.slice(1));
    if (reg >= 0 && reg <= 7) {
      return OperandType.LowRegister;
    } else if (reg >= 8 && reg <= 15) {
      return OperandType.HighRegister;
    }

    return "Invalid register. Expected r[0-7] or r[8-15] but got " + reg;
  } else if (operand.startsWith('#')) {
    if (operand.startsWith('#0x')) {
      if (isNaN(operand.slice(1) as any)) {
        return "Invalid hexadecimal inmediate. Expected 0x[0-9a-fA-F] but got " + operand.slice(1);
      }
      return OperandType.HexInmediate;
    } else if (!isNaN(operand.slice(1) as any)) {
      // Decimal Inmediate Operand
      return OperandType.DecInmediate;
    } else {
      return "Invalid inmediate. Expected #0x[0-F] or #[0-9] but got " + operand;
    }
  } else {
    return "Invalid operand";
  }
}

function line_to_op(line: string): Instruction | string {
  const words = line.split(' ');
  const operands = words.slice(1).join(' ').split(',').map((operand) => operand.trim());

  const operation = str_to_op[words[0]];
  if (operation === undefined) {
    return "Unknown operation: " + words[0];
  }

  assert(Operation.TOTAL_OPERATIONS === 2, "Exhaustive handling of operations in line_to_op");
  switch (operation) {
    case Operation.MOV:
      {
        if (operands.length !== 2) {
          return "Invalid number of operands for MOV. Expected 2, got " + operands.length;
        }

        const op1_type = operand_to_optype(operands[0]);
        if (typeof op1_type === 'string') {
          return op1_type;
        }

        const op2_type = operand_to_optype(operands[1]);
        if (typeof op2_type === 'string') {
          return op2_type;
        } else if (op1_type === OperandType.HighRegister && (op2_type === OperandType.HexInmediate || op2_type === OperandType.DecInmediate)) {
          return "Only low registers allowed with inmediate operand";
        } else if (op2_type === OperandType.HexInmediate || op2_type === OperandType.DecInmediate) {
          // MOV only allows 8-bit inmediate values
          if (parseInt(operands[1].slice(1)) > 255) {
            return "Invalid inmediate value. Inmediate value for MOV must be between 0 and 255";
          }
        }

        return {
          operation: operation,
          operands: [ { type: op1_type, value: operands[0] }, { type: op2_type, value: operands[1] } ],
        };
      };

    case Operation.ADD: {
      if (operands.length < 2) {
        return "Invalid number of operands for ADD. Expected 2 or 3, got " + operands.length;
      }

      const op1_type = operand_to_optype(operands[0]);
      if (typeof op1_type === 'string') {
        return op1_type;
      }

      const op2_type = operand_to_optype(operands[1]);
      if (typeof op2_type === 'string') {
        return op2_type;
      } else if (op1_type === OperandType.HighRegister && (op2_type === OperandType.HexInmediate || op2_type === OperandType.DecInmediate)) {
        return "Only low registers allowed with inmediate operand";
      } else if (op2_type === OperandType.HexInmediate || op2_type === OperandType.DecInmediate) {
        // ADD only allows 8-bit inmediate values for low registers and 7-bit inmediate values for the sp register
        if (parseInt(operands[1].slice(1)) > 255) {
          return "Invalid inmediate value. Inmediate value for ADD must be between 0 and 255";
        }
      }

      if (operands.length === 3) {
        return "TODO: ADD with 3 operands";
      }

      return {
        operation: operation,
        operands: [ { type: op1_type, value: operands[0] }, { type: op2_type, value: operands[1] } ],
      };
    };

    default:
      throw new Error("Unreachable code in line_to_op");
  }
}

function compile_assembly(source: string): Program {
  const lines = source.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const program: Program = {
    ins: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].split(';').length > 0 ? lines[i].split(';')[0].trim() : lines[i];
    if (line.length === 0) {
      continue;
    }

    const op = line_to_op(line);
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