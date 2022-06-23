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
  } else if (/^sp$/.test(operand)) {
    type = OperandType.SpRegister;
  } else if (/^#0x[0-9a-f]+$/.test(operand) || /^#\d+$/.test(operand)) {
    type = operand.startsWith('#0x') ? OperandType.HexInmediate : OperandType.DecInmediate;
  }

  return type;
}

/**
 * Checks if the given type is a register type
 * @param type OperandType to check
 * @returns true if it's a register
 */
function isRegisterType(type: OperandType): boolean {
  return type === OperandType.LowRegister || type === OperandType.HighRegister || type === OperandType.SpRegister;
}

/**
 * Checks if the given type is an inmediate type
 * @param type OperandType to check
 * @returns true if it's an inmediate
 */
function isInmediateType(type: OperandType): boolean {
  return type === OperandType.DecInmediate || type === OperandType.HexInmediate;
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
 * Checks if a string number is aligned to a size
 * @param addr string in inmediate, hex or dec format 
 * @param size size to be aligned
 * @returns true if aligned
 */
function isAligned(addr: string, size: number): boolean {
  return parseInt(addr.replace('#', '')) % size === 0;
}

export { assert, argToOperandType, isRegisterType, isInmediateType, inmediateInRange, inmediateOperandNumber, isAligned }