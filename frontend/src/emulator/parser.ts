const instructions: any = {
    "str": {
        "name": "str",
        "operands": [
            {
                "type": "register",
                "name": "Rd",
                "value": undefined
            },
            {
                "type": "register",
                "name": "Rb",
                "value": undefined
            }
        ],
        "description": "Store word from register Rd to memory at address Rb",
        "examples": [
            {
                "input": "str r1, r2",
                "output": "r1 = r2"
            }
        ]
    },
}


function parse_line(line: string) {
    const tokens = line.split(" ");
    const command = tokens[0];
    const args = tokens.slice(1);

    const template = instructions[command];
    if (!template) {
        throw new Error("Unknown instruction: " + command);
    }

    let instruction: any = {
        "name": command,
        "operands": [],
        "description": "",
        "examples": []
    };

    for (let i = 0; i < template.operands.length; i++) {
        const operand = template.operands[i];
        const value = args[i];
        instruction.operands.push({
            "type": operand.type,
            "name": operand.name,
            "value": value
        });
    }

    return instruction;
}

export const lines_to_ops = (lines: string[]) => {
    let ops = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        let instruction = parse_line(line);
        ops.push(instruction);
    }
    return ops;
}