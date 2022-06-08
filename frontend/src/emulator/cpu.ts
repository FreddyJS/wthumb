import compile_assembly, { assert, parseInmediate } from './compiler';

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
  N = 0x80000000,
  Z = 0x40000000,
  C = 0x20000000,
  V = 0x10000000,
}

// const SPREGISTER = 'r13';
// const LRREGISTER = 'r14';
const PCREGISTER = 'r15';

type armCPU_T = {
  regs: { [key: string]: number };
  cpsr: number;
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
    cpsr: 0,
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
      assert(Operation.TOTAL_OPERATIONS === 4, 'Exhaustive handling of operations in execute');
      switch (ins.operation) {
        case Operation.MOV:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;
            const value = isInmediateValue(op2.type) ? parseInmediate(op2) : this.regs[op2.value];

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
              isInmediateValue(op2.type) ? parseInmediate(op2) : this.regs[op2.value]
              :
              isInmediateValue(op3.type) ? parseInmediate(op3) : this.regs[op3.value];

            this.regs[destReg] = sum1 + sum2;
          }
          break;

        case Operation.SUB:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;

            const res1 = op3 === undefined ? this.regs[op1.value] : this.regs[op2.value];
            const res2 = op3 === undefined ?
              isInmediateValue(op2.type) ? parseInmediate(op2) : this.regs[op2.value]
              :
              isInmediateValue(op3.type) ? parseInmediate(op3) : this.regs[op3.value];

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

        default:
          throw new Error('Invalid operation in execute. This should never happen.');
      }
    },
    set_flag(flag: Flags, value: boolean) {
      if (value) {
        // tslint:disable-next-line:no-bitwise
        this.cpsr |= flag;
      } else {
        // tslint:disable-next-line:no-bitwise
        this.cpsr &= ~flag;
      }
    },
  };

  return armCPU;
}

export default defaultCPU;
export type { armCPU_T };
