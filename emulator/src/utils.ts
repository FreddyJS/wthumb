import { Operand, OperandType } from "./types";


/**
 * Throws an error with the given message if condition is false
 * @param condition Condition that should be true
 * @param message Error message if false
 */
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

/**
 * Checks if a word is a valid operand (argument) and returns the type
 * @param operand Word to convert to OperandType
 * @returns The OperandType or undefined
 */
function argToOperandType(operand: string): OperandType | undefined {
  // Check by regular expressions the corresponding operand type. If none is found, return undefined.
  let type: OperandType | undefined;
  if (operand === undefined) {
    return undefined;
  }

  if (/^r\d+$/.test(operand)) {
    const reg = parseInt(operand.slice(1), 10);
    type = reg < 8 ? OperandType.LowRegister : reg < 16 ? OperandType.HighRegister : undefined;
    if (reg === 13) {
      type = OperandType.SpRegister;
    } else if (reg === 14) {
      type = OperandType.LrRegister;
    } else if (reg === 15) {
      type = OperandType.PcRegister;
    }
  } else if (/^sp$/.test(operand)) {
    type = OperandType.SpRegister;
  } else if (/^lr$/.test(operand)) {
    type = OperandType.LrRegister;
  } else if (/^pc$/.test(operand)) {
    type = OperandType.PcRegister;
  } else if (/^#0x[0-9a-f]+$/.test(operand) || /^#\d+$/.test(operand)) {
    type = operand.startsWith('#0x') ? OperandType.HexInmediate : OperandType.DecInmediate;
  } else if (/^\[\s*(r\d+|sp)\s*,\s*(#|#0x)\d+\s*\]$/.test(operand)) {
    // [rN | sp, #0x04 | #124]
    type = OperandType.IndirectValue;
  } else if (/^\[\s*r\d+\s*,\s*r\d+\s*\]$/.test(operand)) {
    type = OperandType.IndirectValue;
  } else if (/^\[\s*r\d+\s*\]$/.test(operand)) {
    type = OperandType.IndirectValue;
  } else if (operand.startsWith('{') && operand.endsWith('}')) {
    operand = operand.replace('{', '').replace('}', '');
    const regs = operand.split(',');
    for (let i = 0; i < regs.length; i++) {
      if (!/^r\d+$/.test(regs[i].trim())) {
        return type;
      }
    }

    type = OperandType.RegisterList;
  } else if (/^(#|=)\w+$/.test(operand)) {
    type = OperandType.Label;
  }

  return type;
}

/**
 * Checks if the given type is a register type
 * @param type OperandType to check
 * @returns true if it's a register
 */
function isRegisterType(type: OperandType): boolean {
  return type === OperandType.LowRegister || type === OperandType.HighRegister || type === OperandType.SpRegister || type === OperandType.LrRegister || type === OperandType.PcRegister;
}

function isHighRegister(type: OperandType): boolean {
  return type === OperandType.HighRegister || type === OperandType.SpRegister || type === OperandType.LrRegister || type === OperandType.PcRegister;
}

/**
 * Checks if the given type is an inmediate type
 * @param type OperandType to check
 * @returns true if it's an inmediate
 */
function isInmediateType(type: OperandType | undefined): boolean {
  return type === undefined ? false : type === OperandType.DecInmediate || type === OperandType.HexInmediate;
}

/**
 * Checks if the given word is a valid inmediate and it's in range
 * @param inmediate word to check
 * @param maxValue max numeric value
 * @returns true if valid
 */
function inmediateInRange(inmediate: string, maxValue: number): boolean {
  const type = argToOperandType(inmediate);

  // Return false if is not a valid inmediate value
  if (type === undefined || !isInmediateType(type)) {
    return false;
  }

  if (parseInt(inmediate.replace('#', '')) > maxValue) {
    return false;
  }

  return true;
}

/**
 * Returns the numeric value of an operand. Must be an inmediate operand.
 * Check if it is with @isInmediateType(operand.type)
 * @param operand Inmediate Operand
 * @returns 
 */
function inmediateOperandNumber(operand: Operand): number {
  return parseInt(operand.value.replace('#', ''));
}

/**
 * Returns a tuple with first and second values of a indirect operand [r1, r2 | #1] as Operand objects
 * @param operand Operand to get values. It's type must be IndirectValue
 * @returns Tuple with [value1, value2]
 */
function indirectOperandValues(operand: Operand): [Operand, Operand] {
  const value1 = operand.value.split(',')[0].replace('[', '').replace(']', '').trim();
  let value2 = operand.value.split(',')[1];
  if (value2 === undefined) {
    value2 = '#0';
  } else {
    value2 = value2.replace(']', '').trim();
  }

  const value1Type = argToOperandType(value1);
  const value2Type = argToOperandType(value2);

  if (value1Type === undefined || value2Type === undefined) {
    throw new Error('Compiler error, this is not a valid Operand with type IndirectValue');
  }

  const op1: Operand = {
    type: value1Type,
    value: value1,
  }
  const op2: Operand = {
    type: value2Type,
    value: value2,
  }

  return [op1, op2]
}

/**
 * Checks if a string number is aligned to a size
 * @param addr string in inmediate, hex or dec format 
 * @param size size to be aligned
 * @returns true if aligned
 */
function isAligned(addr: string, size: number): boolean {
  return parseInt(addr.replace('#', '')) % size === 0;
}

export { assert, argToOperandType, isRegisterType, isHighRegister, isInmediateType, inmediateInRange, inmediateOperandNumber, indirectOperandValues, isAligned }