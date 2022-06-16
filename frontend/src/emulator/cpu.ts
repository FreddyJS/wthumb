import compile_assembly, { assert, parseInmediateOperand } from './compiler';

import { Operation, OperandType, Program, isInmediateValue } from './types';
import type { Instruction } from './types';

const defaultMemorySize = 64;
const defaultStackSize = 64;
const defaultRegs = {
  // General purpose registers
  r0: 0x00,
  r1: 0x00,
  r2: 0x00,
  r3: 0x00,
  r4: 0x00,
  r5: 0x00,
  r6: 0x00,
  r7: 0x00,
  r8: 0x00,
  r9: 0x00,
  r10: 0x00,
  r11: 0x00,
  r12: 0x00,
  r13: 0x00,
  r14: 0x00,
  r15: 0x00,
};

enum Flags {
  N,
  Z,
  C,
  V
}

// const SPREGISTER = 'r13';
// const LRREGISTER = 'r14';
const PCREGISTER = 'r15';

type armCPU_T = {
  regs: { [key: string]: number };
  z: boolean;
  n: boolean;
  c: boolean;
  v: boolean;
  memory: number[];
  stack: number[];
  program: Instruction[];

  // Methods
  run: () => void;
  step: () => void;
  reset: () => void;
  load: (program: Program) => void;
  load_assembly: (assembly: string) => void;
  execute: (ins: Instruction) => void;
  set_flag: (flag: Flags, value: boolean) => void;
};

type cpuProps = {
  memorySize?: number;
  stackSize?: number;
};

function defaultCPU(props: cpuProps = { memorySize: defaultMemorySize, stackSize: defaultStackSize }): armCPU_T {
  const armCPU: armCPU_T = {
    regs: { ...defaultRegs },
    z: false,
    n: false,
    c: false,
    v: false,
    memory: new Array(props.memorySize).fill(0),
    stack: new Array(props.stackSize).fill(0),
    program: [],

    // Methods
    run() {
      for (const ins of this.program) {
        this.execute(ins);
        this.regs[PCREGISTER] += 2;
      }
    },
    step() {
      if (this.regs[PCREGISTER] / 2 >= this.program.length) {
        console.log('Program finished');
        return;
      }

      this.execute(this.program[this.regs[PCREGISTER] / 2]);
      this.regs[PCREGISTER] += 2;
    },
    reset() {
      this.regs = { ...defaultRegs };
      this.memory = new Array(defaultMemorySize).fill(0);
      this.stack = new Array(defaultStackSize).fill(0);
      this.program = [];
    },
    load(program: Program) {
      // TODO: Copy the program memory to the CPU memory
      this.program = program.ins;
    },
    load_assembly(assembly: string) {
      const compiled = compile_assembly(assembly);
      if (compiled.error) {
        throw new Error(compiled.error.message);
      }
      this.program = compiled.ins;
    },
    execute(ins: Instruction) {
      assert(Operation.TOTAL_OPERATIONS === 6, 'Exhaustive handling of operations in execute');
      switch (ins.operation) {
        case Operation.MOV:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;
            const value = isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value];

            this.regs[destReg] = value;
            if (
              (op1.type === OperandType.LowRegister && op2.type === OperandType.LowRegister) ||
              isInmediateValue(op2.type)
            ) {
              this.set_flag(Flags.Z, value === 0);
              // tslint:disable-next-line:no-bitwise
              this.set_flag(Flags.N, (value & 0x80000000) !== 0);
            }
          }
          break;

        case Operation.ADD:
          {
            // TODO: Add support for other types of registers (pc, sp)
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;

            const sum1 = op3 === undefined ? this.regs[op1.value] : this.regs[op2.value];
            const sum2 = op3 === undefined ?
              isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value]
              :
              isInmediateValue(op3.type) ? parseInmediateOperand(op3) : this.regs[op3.value];

            this.regs[destReg] = sum1 + sum2;
          }
          break;

        case Operation.SUB:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;

            const res1 = op3 === undefined ? this.regs[op1.value] : this.regs[op2.value];
            const res2 = op3 === undefined ?
              isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value]
              :
              isInmediateValue(op3.type) ? parseInmediateOperand(op3) : this.regs[op3.value];

            this.regs[destReg] = res1 - res2;
          }
          break;

        case Operation.MUL:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;

            const mul1 = op3 === undefined ? this.regs[op1.value] : this.regs[op2.value];
            const mul2 = op3 === undefined ? this.regs[op2.value] : this.regs[op3.value];

            this.regs[destReg] = mul1 * mul2;
          }
          break;

        case Operation.CMP:
          {
            const [op1, op2] = ins.operands;
            const cmp1 = this.regs[op1.value];
            const cmp2 = isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value];

            this.set_flag(Flags.Z, cmp1 === cmp2);
            this.set_flag(Flags.N, cmp2 > cmp1);
          }
          break;

        case Operation.CMN:
          {
            const [op1, op2] = ins.operands;
            const cmp1 = this.regs[op1.value];
            const cmp2 = isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value];

            this.set_flag(Flags.Z, cmp1 === - cmp2);
            this.set_flag(Flags.N, cmp1 + cmp2 < 0);
          }
          break;

        default:
          throw new Error('Invalid operation in execute. This should never happen.');
      }
    },
    set_flag(flag: Flags, value: boolean) {
      switch (flag) {
        case Flags.Z:
          this.z = value;
          break;
        case Flags.N:
          this.n = value;
          break;
        case Flags.C:
          this.c = value;
          break;
        case Flags.V:
          this.v = value;
          break;
        default:
          throw new Error('Invalid flag in set_flag. This should never happen.');
      }
    },
  };

  return armCPU;
}

export default defaultCPU;
export type { armCPU_T };
