import compile_assembly, { assert, parseInmediateOperand } from './compiler';

import { Operation, OperandType, Program, isInmediateValue } from './types';
import type { Instruction } from './types';

const defaultMemorySize = 64;
const defaultStackSize = 64;
const maxUnsignedValue = 4294967295;
const maxPositiveValue = 2147483647;
const maxNegativeValue = -2147483648;

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
  loadAssembly: (assembly: string) => void;
  execute: (ins: Instruction) => void;
  setFlag: (flag: Flags, value: boolean) => void;
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
    loadAssembly(assembly: string) {
      const compiled = compile_assembly(assembly);
      if (compiled.error) {
        throw new Error(compiled.error.message);
      }
      this.program = compiled.ins;
    },
    execute(ins: Instruction) {
      assert(Operation.TOTAL_OPERATIONS === 13, 'Exhaustive handling of operations in execute');
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
              this.setFlag(Flags.Z, value === 0);
              this.setFlag(Flags.N, value > maxPositiveValue);
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

            if (sum1 + sum2 > maxUnsignedValue) {
              this.regs[destReg] = sum1 + sum2 - maxUnsignedValue - 1;
              this.setFlag(Flags.C, true);
            } else {
              this.regs[destReg] = sum1 + sum2;
            }
            if (
              (op1.type === OperandType.LowRegister && op2.type === OperandType.LowRegister) ||
              isInmediateValue(op2.type)
            ) {
              this.setFlag(Flags.Z, this.regs[destReg] === 0);
              this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
              this.setFlag(Flags.V, sum1 <= maxPositiveValue && sum1 + sum2 > maxPositiveValue);
            }
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

            var carry = false;
            if (res1 - res2 < 0) {
              this.regs[destReg] = maxUnsignedValue - Math.abs(res1 - res2) + 1;
            } else {
              this.regs[destReg] = res1 - res2;
              carry = true;
            }

            if (op1.type !== OperandType.SpRegister) {
              this.setFlag(Flags.Z, this.regs[destReg] === 0);
              this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
              this.setFlag(Flags.C, carry);
              this.setFlag(Flags.V, res1 > maxPositiveValue && res1 - res2 <= maxPositiveValue);
            }
          }
          break;

        case Operation.NEG:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;
            const value = this.regs[op2.value] === 0 ? 0 : maxUnsignedValue - this.regs[op2.value] + 1;

            this.regs[destReg] = value;

            this.setFlag(Flags.Z, value === 0);
            this.setFlag(Flags.C, value === 0);
            this.setFlag(Flags.N, value > maxPositiveValue);
            // TODO: V flag
          }
          break;

        case Operation.MUL:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;

            const mul1 = op3 === undefined ? this.regs[op1.value] : this.regs[op2.value];
            const mul2 = op3 === undefined ? this.regs[op2.value] : this.regs[op3.value];

            let value = 0;
            for (let i = 0; i < mul2; i++) {
              value += mul1;
              if (value > maxUnsignedValue) {
                value -= maxUnsignedValue + 1;
              }
            }
            this.regs[destReg] = value;
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
          }
          break;

        case Operation.CMP:
          {
            const [op1, op2] = ins.operands;
            const cmp1 = this.regs[op1.value];
            const cmp2 = isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value];
            const value = cmp1 - cmp2;

            this.setFlag(Flags.Z, value === 0);
            this.setFlag(Flags.N, value > maxPositiveValue || value < 0);
            this.setFlag(Flags.C, value < 0);
            // TODO: How to update the V flag?
          }
          break;

        case Operation.CMN:
          {
            const [op1, op2] = ins.operands;
            const cmp1 = this.regs[op1.value];
            const cmp2 = isInmediateValue(op2.type) ? parseInmediateOperand(op2) : this.regs[op2.value];

            this.setFlag(Flags.Z, cmp1 === - cmp2);
            this.setFlag(Flags.N, cmp1 + cmp2 > maxPositiveValue);
            this.setFlag(Flags.C, cmp1 + cmp2 > maxUnsignedValue);
            this.setFlag(Flags.V, cmp1 <= maxPositiveValue && cmp1 + cmp2 > maxPositiveValue);
          }
          break;

        case Operation.AND:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            this.regs[destReg] = this.regs[destReg] & this.regs[op2.value];
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
          }
          break;

        case Operation.BIC:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            this.regs[destReg] = this.regs[destReg] & (~this.regs[op2.value] >>> 0);
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
          }
          break;

        case Operation.ORR:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            this.regs[destReg] = this.regs[destReg] | this.regs[op2.value];
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
          }
          break;

        case Operation.EOR:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            this.regs[destReg] = this.regs[destReg] ^ this.regs[op2.value];
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
          }
          break;

        case Operation.MVN:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            this.regs[destReg] = ~this.regs[op2.value] >>> 0;
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
          }
          break;

        case Operation.TST:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            const value = this.regs[destReg] & this.regs[op2.value];
            this.setFlag(Flags.Z, value === 0);
            this.setFlag(Flags.N, value > maxPositiveValue);
          }
          break;

        default:
          throw new Error('Invalid operation in execute. This should never happen.');
      }
    },
    setFlag(flag: Flags, value: boolean) {
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
