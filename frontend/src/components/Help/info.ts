import { Operation } from "emulator";

const operationsInfo: { [key: string]: { example: string, description: string} } = {
    mov: {
        example: 'mov Rd, #Inm8',
        description: 'Moves the value of the right operand into the destiny register (rD)'
    },
    add: {
        example: 'add Rd, Rn, Rm',
        description: 'Moves the result of the sum of the right operands into the destiny register'
    },
    sub: {
        example: 'sub Rd, Rn, Rm',
        description: 'Moves the result of the substraction of the right operands into the destiny register'
    },
    neg: {
        example: 'neg Rd, Rn',
        description: 'Negates the right operand value and stores it in the destiny register'
    },
    mul: {
        example: 'mul Rd, Rm, Rd',
        description: 'Moves the result of the multiplication to the destiny register, only low registers allowed'
    },
    cmp: {
        example: 'cmp Rn, Rm',
        description: 'Substracts r1 to r0 and sets the corresponding flags. Not change the register values'
    },
    cmn: {
        example: 'cmn Rn, Rm',
        description: 'Adds r1 to r0 and sets the corresponding flags. Not change the register values'
    },
    and: {
        example: 'and Rd, Rm',
        description: 'Moves the result of the AND to the destiny register'
    },
    bic: {
        example: 'bic Rd, Rm',
        description: 'Moves the result of the AND NOT to the destiny register'
    },
    orr: {
        example: 'orr Rd, Rm',
        description: 'Moves the result of the OR to the destiny register'
    },
    eor: {
        example: 'eor Rd, Rm',
        description: 'Moves the result of the XOR to the destiny register'
    },
    mvn: {
        example: 'mvn Rd, Rm',
        description: 'Moves the result of the NOT to the destiny register'
    },
    tst: {
        example: 'tst Rd, Rm',
        description: 'Moves the result of the NOT to the destiny register'
    },
    lsl: {
        example: 'lsl Rd, Rm, #Shift',
        description: 'Moves the value of the register Rm shifted to the left #Shift times'
    },
    lsr: {
        example: 'lsr Rd, Rm, #Shift',
        description: 'Moves the value of the register Rm shifted to the left #Shift times'
    },
    asr: {
        example: 'asr Rd, Rm, #Shift',
        description: 'Arithmetic shift to the right. Stores the value in the destiny register'
    },
    ror: {
        example: 'ror Rd, Rm, #Shift',
        description: 'Cyclic shift to the right. Stores the value in the destiny register'
    },
    ldr: {
        example: 'ldr Rd, [Rn, #Inm]',
        description: 'Loads a word from the memory address Rm + #Inm in the destiny register'
    },
    ldrh: {
        example: 'ldrh Rd, [Rn, #Inm]',
        description: 'Loads a half-word from the memory address Rm + #Inm in the destiny register'
    },
    ldrb: {
        example: 'ldrb Rd, [Rn, #Inm]',
        description: 'Loads a byte from the memory address Rm + #Inm in the destiny register'
    },
    ldrsh: {
        example: 'ldrsh Rd, [Rn, #Inm]',
        description: 'Loads a signed (bits 31:16 = bit 15) half-word from the memory address Rm + #Inm in the destiny register'
    },
    ldrsb: {
        example: 'ldrsb Rd, [Rn, #Inm]',
        description: 'Loads a signed (bits 31:16 = bit 15) byte from the memory address Rm + #Inm in the destiny register'
    },
    str: {
        example: 'str Rd, [Rn, #Inm]',
        description: 'Stores the value of the register Rd into the memory address Rn + #Inm'
    },
    strh: {
        example: 'strh Rd, [Rn, #Inm]',
        description: 'Stores a the lower 16 bits of the register Rd into the memory address Rn + #Inm'
    },
    strb: {
        example: 'strb Rd, [Rn, #Inm]',
        description: 'Stores a the lower 8 bits of the register Rd into the memory address Rn + #Inm'
    },
    push: {
        example: 'push {r0, r1}',
        description: 'Stores the values of the registers into the stack memory zone'
    },
    pop: {
        example: 'push {r1, r0}',
        description: 'Loads the top values of the stack into the registers'
    },
    b: {
        example: 'b{condition} label',
        description: 'Jumps to the program address of the label (PC = label) if the condition is true or not exists'
    },
    bl: {
        example: 'bl label',
        description: 'Long jump to the program address of the label, LR = PC + 2 (return address) and PC = label'
    },
    wfi: {
        example: 'wfi',
        description: 'Stops the execution of the cpu'
    },
  };

  export { operationsInfo };