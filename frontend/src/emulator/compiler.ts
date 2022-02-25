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

function strip_comments(source: string) {
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

function strip_empty_lines(source: string) {
  return source
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n');
}

function clean_input(source: string): string {
  return strip_empty_lines(strip_comments(source)).toLowerCase();
}

function operand_to_optype(operand: string): OperandType | string {
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
      // Decimal Inmediate Operand
      return OperandType.DecInmediate;
    } else {
      return 'Invalid inmediate. Expected #0x[0-F] or #[0-9] but got ' + operand;
    }
  } else {
    return 'Invalid operand';
  }
}

function line_to_op(line: string): Instruction | string {
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

      const op1Type = operand_to_optype(operands[0]);
      if (typeof op1Type === 'string') {
        return op1Type;
      }

      const op2Type = operand_to_optype(operands[1]);
      if (typeof op2Type === 'string') {
        return op2Type;
      } else if (
        op1Type === OperandType.HighRegister &&
        (op2Type === OperandType.HexInmediate || op2Type === OperandType.DecInmediate)
      ) {
        return 'Only low registers allowed with inmediate operand';
      } else if (op2Type === OperandType.HexInmediate || op2Type === OperandType.DecInmediate) {
        // MOV only allows 8-bit inmediate values
        const radix = op2Type === OperandType.HexInmediate ? 16 : 10;
        if (parseInt(operands[1].slice(1), radix) > 255) {
          return 'Invalid inmediate value. Inmediate value for MOV must be between 0 and 255';
        }
      }

      return {
        operation,
        operands: [
          { type: op1Type, value: operands[0] },
          { type: op2Type, value: operands[1] },
        ],
      };
    }

    case Operation.ADD: {
      if (operands.length < 2) {
        return 'Invalid number of operands for ADD. Expected 2 or 3, got ' + operands.length;
      }

      const op1Type = operand_to_optype(operands[0]);
      if (typeof op1Type === 'string') {
        return op1Type;
      }

      const op2Type = operand_to_optype(operands[1]);
      if (typeof op2Type === 'string') {
        return op2Type;
      } else if (
        op1Type === OperandType.HighRegister &&
        (op2Type === OperandType.HexInmediate || op2Type === OperandType.DecInmediate)
      ) {
        return 'Only low registers allowed with inmediate operand';
      } else if (op2Type === OperandType.HexInmediate || op2Type === OperandType.DecInmediate) {
        // ADD only allows 8-bit inmediate values for low registers and 7-bit inmediate values for the sp register
        const radix = op2Type === OperandType.HexInmediate ? 16 : 10;
        if (parseInt(operands[1].slice(1), radix) > 255) {
          return 'Invalid inmediate value. Inmediate value for ADD must be between 0 and 255';
        }
      }

      if (operands.length === 3) {
        return 'TODO: ADD with 3 operands';
      }

      return {
        operation,
        operands: [
          { type: op1Type, value: operands[0] },
          { type: op2Type, value: operands[1] },
        ],
      };
    }

    default:
      throw new Error('Unreachable code in line_to_op');
  }
}

function compile_assembly(source: string): Program {
  source = clean_input(source);

  const textSectionIndex = source.indexOf('.text');
  const dataSectionIndex = source.indexOf('.data');
  if (textSectionIndex === -1) {
    return { error: { message: 'Missing .text directive', line: 0, column: 0 }, ins: [] };
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

  const lines = textSection.split('\n');
  const program: Program = {
    ins: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
