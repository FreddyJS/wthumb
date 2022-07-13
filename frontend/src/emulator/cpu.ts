import compileAssembly from './compiler';

import type { Instruction } from './types';
import { Operation, OperandType, Program, CompilerError } from './types';
import { assert, indirectOperandValues, inmediateOperandNumber, isInmediateType } from './utils';

const defaultMemorySize = 64;
const defaultStackSize = 64;
const maxUnsignedValue = 4294967295;
const maxPositiveValue = 2147483647;
const maxNegativeValue = -2147483648;

const defaultRegs = {
  // General purpose registers
  r0: 0x00, r1: 0x00, r2: 0x00, r3: 0x00,
  r4: 0x00, r5: 0x00, r6: 0x00, r7: 0x00,
  r8: 0x00, r9: 0x00, r10: 0x00, r11: 0x00,
  r12: 0x00, r13: 0x00, r14: 0x00, r15: 0x00,
};

enum Flags {
  N,
  Z,
  C,
  V
}

const SPREGISTER = 'r13';
const LRREGISTER = 'r14';
const PCREGISTER = 'r15';

type armCPU_T = {
  regs: { [key: string]: number };
  z: boolean;
  n: boolean;
  c: boolean;
  v: boolean;
  memory: number[];
  memSize: number;
  stackSize: number;
  program: Instruction[];
  error?: CompilerError;

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
  memorySize: number;
  stackSize: number;
};

function defaultCPU(props: cpuProps = { memorySize: defaultMemorySize, stackSize: defaultStackSize }): armCPU_T {
  const armCPU: armCPU_T = {
    regs: { ...defaultRegs },
    z: false,
    n: false,
    c: false,
    v: false,
    memory: new Array(props.memorySize + props.stackSize).fill(0),
    memSize: props.memorySize,
    stackSize: props.stackSize,
    program: [],
    error: undefined,

    // Methods
    run() {
      for (let i = this.regs[PCREGISTER] / 2; i < this.program.length; i++) {
        const ins = this.program[i];
        if (ins.operation === Operation.WFI) {
          // End of execution
          return;
        }

        const currentPC = this.regs[PCREGISTER];

        if (ins.break === true) {
          ins.break = false;
          return;
        }

        this.execute(ins);
        if (currentPC !== this.regs[PCREGISTER]) {
          // The instruction modified the PC Register, should not increment it cause its a jump
          i = (this.regs[PCREGISTER] / 2) - 1;
        } else {
          this.regs[PCREGISTER] += 2;
        }
      }
    },
    step() {
      if (this.regs[PCREGISTER] / 2 >= this.program.length || this.program[this.regs[PCREGISTER] / 2].operation === Operation.WFI) {
        console.log('Program finished');
        return;
      }

      const ins = this.program[this.regs[PCREGISTER] / 2];
      const currentPC = this.regs[PCREGISTER];

      this.execute(ins);
      if (currentPC === this.regs[PCREGISTER]) {
        this.regs[PCREGISTER] += 2;
      }
    },
    reset() {
      this.memory = new Array(this.memSize + this.stackSize).fill(0);
      this.regs = { ...defaultRegs };
      this.regs['r13'] = this.memSize * 4;
      this.error = undefined;
      this.program = [];

      this.setFlag(Flags.Z, false);
      this.setFlag(Flags.C, false);
      this.setFlag(Flags.N, false);
      this.setFlag(Flags.V, false);
    },
    load(program: Program) {
      this.program = program.ins;
    },
    loadAssembly(assembly: string) {
      this.reset();
      const [program, initialMemory] = compileAssembly(assembly);
      if (program.error) {
        this.error = program.error;
        return console.error("[armthumb]: ", program.error);
      }

      this.program = program.ins;
      for (let i = 0; i < initialMemory.length; i++) {
        if (i >= this.memory.length) {
          this.memory.push(initialMemory[i]);
          this.memSize++;
        } else {
          if (i >= this.memSize) {
            this.memSize++;
          }

          this.memory[i] = initialMemory[i];
        }
      }

      this.regs['r13'] = this.memSize * 4;
      this.memory = this.memory.concat(new Array(this.stackSize).fill(0));
    },
    execute(ins: Instruction) {
      assert(Operation.TOTAL_OPERATIONS === 30, 'Exhaustive handling of operations in execute');
      switch (ins.operation) {
        case Operation.MOV:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;
            const value = isInmediateType(op2.type) ? inmediateOperandNumber(op2) : this.regs[op2.value];

            this.regs[destReg] = value;
            if (
              (op1.type === OperandType.LowRegister && op2.type === OperandType.LowRegister) ||
              isInmediateType(op2.type)
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
              isInmediateType(op2.type) ? inmediateOperandNumber(op2) : this.regs[op2.value]
              :
              isInmediateType(op3.type) ? inmediateOperandNumber(op3) : this.regs[op3.value];

            if (sum1 + sum2 > maxUnsignedValue) {
              this.regs[destReg] = sum1 + sum2 - maxUnsignedValue - 1;
              this.setFlag(Flags.C, true);
            } else {
              this.regs[destReg] = sum1 + sum2;
            }
            if (
              (op1.type === OperandType.LowRegister && op2.type === OperandType.LowRegister) ||
              isInmediateType(op2.type)
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
              isInmediateType(op2.type) ? inmediateOperandNumber(op2) : this.regs[op2.value]
              :
              isInmediateType(op3.type) ? inmediateOperandNumber(op3) : this.regs[op3.value];

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
            const cmp2 = isInmediateType(op2.type) ? inmediateOperandNumber(op2) : this.regs[op2.value];
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
            const cmp2 = isInmediateType(op2.type) ? inmediateOperandNumber(op2) : this.regs[op2.value];

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

        case Operation.LSL:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;
            let shiftValue = this.regs[op2.value];
            const shifts = isInmediateType(op3.type) ? inmediateOperandNumber(op3) : this.regs[op3.value];

            let carry: boolean = false;
            for (let i = 0; i < shifts; i++) {
              carry = (shiftValue & 0x80000000) !== 0;
              shiftValue = shiftValue << 1;
            }

            this.regs[destReg] = shiftValue >>> 0;
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
            this.setFlag(Flags.C, carry);
          }
          break;

        case Operation.LSR:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;
            let shiftValue = this.regs[op2.value];
            const shifts = isInmediateType(op3.type) ? inmediateOperandNumber(op3) : this.regs[op3.value];

            let carry: boolean = false;
            for (let i = 0; i < shifts; i++) {
              carry = (shiftValue & 0x00000001) !== 0;
              shiftValue = shiftValue >>> 1;
            }

            this.regs[destReg] = shiftValue >>> 0;
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
            this.setFlag(Flags.C, carry);
          }
          break;

        case Operation.ASR:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;
            let shiftValue = this.regs[op2.value];
            const shifts = isInmediateType(op3.type) ? inmediateOperandNumber(op3) : this.regs[op3.value];

            let carry: boolean = false;
            for (let i = 0; i < shifts; i++) {
              carry = (shiftValue & 0x1) !== 0;
              shiftValue = shiftValue >> 1;
            }

            this.regs[destReg] = shiftValue >>> 0;
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
            this.setFlag(Flags.C, carry);
          }
          break;

        case Operation.ROR:
          {
            const [op1, op2, op3] = ins.operands;
            const destReg = op1.value;
            let shiftValue = this.regs[op2.value];
            const shifts = isInmediateType(op3.type) ? inmediateOperandNumber(op3) : this.regs[op3.value];

            let carry: boolean = false;
            for (let i = 0; i < shifts; i++) {
              carry = (shiftValue & 0x1) !== 0;

              if (carry) {
                shiftValue = (shiftValue >> 1) | 0x80000000;
              } else {
                shiftValue = (shiftValue >> 1) & 0x7FFFFFFF;
              }
            }

            this.regs[destReg] = shiftValue >>> 0;
            this.setFlag(Flags.Z, this.regs[destReg] === 0);
            this.setFlag(Flags.N, this.regs[destReg] > maxPositiveValue);
            this.setFlag(Flags.C, carry);
          }
          break;

        case Operation.LDR:
        case Operation.LDRH:
        case Operation.LDRB:
        case Operation.LDRSH:
        case Operation.LDRSB:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            const [value1, value2] = indirectOperandValues(op2);
            const offset = isInmediateType(value2.type) ? inmediateOperandNumber(value2) : this.regs[value2.value];
            const address = this.regs[value1.value] + offset;

            if (address / 4 >= this.memory.length) {
              // TODO: This is out of memory, should return an error
              this.regs[destReg] = 0x0
            } else {
              if (ins.operation === Operation.LDR) {
                // TODO: Not load if not aligned to 4, just continue execution
                this.regs[destReg] = this.memory[Math.floor(address / 4)];
              } else if (ins.operation === Operation.LDRH) {
                if (address % 4 === 0) {
                  this.regs[destReg] = this.memory[address / 4] & 0xFFFF;
                } else {
                  this.regs[destReg] = this.memory[Math.floor(address / 4)] >>> 16;
                }
              } else if (ins.operation === Operation.LDRB) {
                const mod = address % 4;
                this.regs[destReg] = this.memory[Math.floor(address / 4)] & (0xFF << (8 * mod));
                this.regs[destReg] = this.regs[destReg] >>> (8 * mod)
              } else if (ins.operation === Operation.LDRSH) {
                if (address % 4 === 0) {
                  this.regs[destReg] = this.memory[address / 4] & 0xFFFF;
                  this.regs[destReg] = (this.regs[destReg] << 16) >> 16;
                } else {
                  this.regs[destReg] = this.memory[Math.floor(address / 4)] >>> 16;
                  this.regs[destReg] = (this.regs[destReg] << 16) >> 16;
                }

                if (this.regs[destReg] < 0) {
                  this.regs[destReg] = this.regs[destReg] >>> 0;
                }
              } else if (ins.operation === Operation.LDRSB) {
                const mod = address % 4;
                this.regs[destReg] = this.memory[Math.floor(address / 4)] & (0xFF << (8 * mod));
                this.regs[destReg] = this.regs[destReg] >>> (8 * mod)
                this.regs[destReg] = (this.regs[destReg] << 24) >> 24;

                if (this.regs[destReg] < 0) {
                  this.regs[destReg] = this.regs[destReg] >>> 0;
                }
              }
            }
          }
          break;

        case Operation.STR:
        case Operation.STRH:
        case Operation.STRB:
          {
            const [op1, op2] = ins.operands;
            const destReg = op1.value;

            const [value1, value2] = indirectOperandValues(op2);
            const offset = isInmediateType(value2.type) ? inmediateOperandNumber(value2) : this.regs[value2.value];
            const address = this.regs[value1.value] + offset;

            if (address / 4 >= this.memory.length) {
              // TODO: This is out of memory, should return an error
              // this.regs[destReg] = 0x0
            } else {
              if (ins.operation === Operation.STR) {
                this.memory[address / 4] = this.regs[destReg];
              } else if (ins.operation === Operation.STRH) {
                const toSave = this.regs[destReg] & 0xFFFF;
                if (address % 4 === 0) {
                  this.memory[address / 4] = (this.memory[address / 4] & 0xFFFF0000) | toSave;
                } else {
                  this.memory[Math.floor(address / 4)] = (this.memory[address / 4] & 0xFFFF) | (toSave << 16);
                }
              } else if (ins.operation === Operation.STRB) {
                const toSave = this.regs[destReg] & 0x00FF;
                const mod = address % 4;
                let mask = 0xFFFFFF00
                if (mod === 1) {
                  mask = 0xFFFF00FF
                } else if (mod === 2) {
                  mask = 0xFF00FFFF
                } else if (mod === 3) {
                  mask = 0x00FFFFFF
                }
                this.memory[Math.floor(address / 4)] = (this.memory[Math.floor(address / 4)] & mask) | (toSave << (8 * mod))
              }
            }
          }
          break;

        case Operation.PUSH:
          {
            const [op1] = ins.operands;
            const regList = op1.value.replace('{', '').replace('}', '').split(',');

            for (let i = 0; i < regList.length; i++) {
              let memIndex = this.regs[SPREGISTER] / 4;
              if (memIndex >= this.memory.length) {
                this.memory.push(this.regs[regList[i].trim()]);
                this.stackSize++;
              } else {
                this.memory[memIndex] = this.regs[regList[i].trim()];
              }
              this.regs[SPREGISTER] += 4;
              // this.memSize++;
            }
          }
          break;

        case Operation.POP:
          {
            const [op1] = ins.operands;
            const regList = op1.value.replace('{', '').replace('}', '').split(',');

            for (let i = 0; i < regList.length; i++) {
              let memIndex = this.regs[SPREGISTER] / 4 - 1;
              if (memIndex < 0) {
                this.regs[regList[i].trim()] = 0x00;
              } else {
                this.regs[regList[i].trim()] = this.memory[memIndex];
              }
              this.regs[SPREGISTER] -= 4;
            }
          }
          break;

        case Operation.B:
          {
            const [op1] = ins.operands;
            const condition = ins.name.replace('b', '');
            const label = op1.value;
            let pc = 0x00;

            for (let i = 0; i < this.program.length; i++) {
              if (this.program[i].label === label) {
                pc = i * 2;
                break;
              }
            }

            if (condition === '') {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'eq' && (this.z)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'hi' && (this.c && !this.z)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'gt' && (!this.z && ((this.n && this.v) || (!this.n && !this.v)))) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'ne' && (!this.z)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'cs' && (this.c)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'ge' && ((this.n && this.v) || (!this.n && !this.v))) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'mi' && (this.n)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'cc' && (!this.c)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'lt' && ((this.n && !this.v) || (!this.n && this.v))) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'pl' && (!this.n)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'ls' && (this.c || this.z)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'le' && ((this.n && !this.v) || (!this.n && this.v) || this.z)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'vs' && (this.v)) {
              this.regs[PCREGISTER] = pc;
            } else if (condition === 'vc' && (!this.v)) {
              this.regs[PCREGISTER] = pc;
            } else {
              this.regs[PCREGISTER] += 2;
            }
          }
          break;

        case Operation.BL:
          {
            const [op1] = ins.operands;
            const label = op1.value;
            let pc = 0x00;

            for (let i = 0; i < this.program.length; i++) {
              if (this.program[i].label === label) {
                pc = i * 2;
                break;
              }
            }

            this.regs[LRREGISTER] = this.regs[PCREGISTER] + 2;
            this.regs[PCREGISTER] = pc;
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

  armCPU.regs['r13'] = armCPU.memSize * 4;
  return armCPU;
}

export default defaultCPU;
export type { armCPU_T };
