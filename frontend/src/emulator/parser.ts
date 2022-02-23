/**
 * ARM Thumb Assembly Parser for TypeScript
 */

import CPU_CONFIG from "./armthumb";

export enum OperandType {
    LowRegister,
    HighRegister,
    Inmediate,
}

type Operand = {
    type: OperandType, // register, high-register, inmediate-value
    value: string,
}

type Instruction = {
    "operation": string,
    "operands": Operand[],
}

function isValidRegister(reg: string): boolean {
    return reg.toLowerCase().charAt(0) === 'r' && parseInt(reg.slice(1)) < CPU_CONFIG.total_registers;
}

function isValidInmediate(imm: string, bits: number): boolean {
    // Inmediate values must be prefixed with '#' in hexadecimal (#0x01) or decimal (#1)
    if (imm.startsWith("#0x")) {
        return parseInt(imm.slice(3), 16) < (1 << bits);
    } else if (imm.startsWith("#")) {
        return parseInt(imm.slice(1), 10) < (1 << bits);
    } else {
        return false;
    }
}

function parse_line(line: string) {
    const indx = line.indexOf(" ") !== -1 ? line.indexOf(" ") : line.length;
    const operation = line.substring(0, indx).trim();
    const args = line.substring(indx + 1).split(",").map(arg => arg.trim());

    let instruction: Instruction = {} as Instruction;
    switch (operation) {
        case "str":
            {
                if (args.length !== 2) {
                    throw new Error("[emul] Invalid number of arguments for 'str' operation");
                }

                if (!isValidRegister(args[0])) {
                    throw new Error("[emul] First argument of 'str' operation must be a register (Rd) between 0 and " + (CPU_CONFIG.total_registers -1) + ", but it is '" + args[0] + "'");
                }

                let second_op_type = OperandType.LowRegister;
                let second_op_value = args[1];
                if (isValidRegister(args[1])) {
                    second_op_type = OperandType.LowRegister;
                } else if (isValidInmediate(args[1], 8)) {
                    second_op_value = args[1].startsWith("#0x") ? args[1] : "#0x" + args[1].slice(1);
                    second_op_type = OperandType.Inmediate;
                } else {
                    throw new Error("[emul] Second argument of 'str' operation must be a register (Rn) or an inmediate value prefixed with '#', but it is '" + args[1] + "'");
                }

                instruction = {
                    "operation": operation,
                    "operands": [
                        { "type": OperandType.LowRegister, "value": args[0] },
                        { "type": second_op_type, "value": second_op_value }
                    ]
                };

            } break;
        
        case 'mov':
            {
                if (args.length !== 2) {
                    throw new Error("[emul] Invalid number of arguments for 'mov' operation");
                }

                if (!isValidRegister(args[0])) {
                    throw new Error("[emul] First argument of 'mov' operation must be a register (Rd), but it is '" + args[0] + "'");
                }
    
                let second_op_type = OperandType.LowRegister;
                let second_op_value = args[1];

                if (isValidRegister(args[1])) {
                    second_op_type = OperandType.LowRegister;
                } else if (isValidInmediate(args[1], 8)) {
                    second_op_value = args[1].startsWith("#0x") ? args[1] : "#0x" + parseInt(args[1].slice(1), 10).toString(16);
                    second_op_type = OperandType.Inmediate;
                } else {
                    throw new Error("[emul] Second argument of 'mov' operation must be a register (Rn) or an inmediate value '#8bit_Imm', but it is '" + args[1] + "'");
                }

                instruction = {
                    "operation": operation,
                    "operands": [
                        { "type": OperandType.LowRegister, "value": args[0] },
                        { "type": second_op_type, "value": second_op_value }
                    ]
                };
            } break;

        default:
            throw new Error(`[emul] Unknown operation: ${operation}`);
    }

    return instruction;
}

export const lines_to_ops = (lines: string) => {
    const split_lines = lines.split("\n");
    let ops = [];
    for (let i = 0; i < split_lines.length; i++) {
        let line = split_lines[i].trim();
        if (line !== "") {
            ops.push(parse_line(line));
        }
    }
    return ops;
}

export type {Instruction, Operand};
