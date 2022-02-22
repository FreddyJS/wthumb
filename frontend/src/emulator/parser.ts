
type Operand = {
    type: string, // register, literal, address
    value: string,
}

type Instruction = {
    "operation": string,
    "operands_n": number,
    "operands": Operand[],
}

const instructions: { [key: string]: Instruction } = {
    "str": {
        "operation": "str",
        "operands_n": 2,
        "operands": [
            {
                "type": "register",
                "value": "",
            },
            {
                "type": "register",
                "value": "",
            },
        ],
    }
}

function parse_line(line: string) {
    const tokens = line.split(" ");
    const operation = tokens[0];
    const args = tokens.slice(1);

    const template = instructions[operation];
    if (!template) {
        throw new Error("Unknown instruction: " + operation);
    }

    let instruction: Instruction = {
        "operation": operation,
        "operands_n": template.operands_n,
        "operands": [],
    };

    for (let i = 0; i < template.operands.length; i++) {
        const operand = template.operands[i];
        const value = args[i].toLowerCase();
        instruction.operands.push({
            "type": operand.type,
            "value": value
        });
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