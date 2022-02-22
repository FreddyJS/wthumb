import { Instruction, lines_to_ops } from './parser';

type CPU_T = {
    regs: number[],
    memory: Array<number>,
    program: Array<string>,
    execute: (code: string) => void,
    execute_op: (op: any) => void,
    read: (addr: number) => number,
    write: (addr: number, value: number) => void,
    reset: () => void,
}

export function createARMCPU(): CPU_T {
    let cpu: CPU_T = {
        regs: [0, 1, 2, 3, 4, 5, 6, 7],
        memory: new Array<number>(16).fill(0),
        program: new Array<string>(16).fill(''),
        execute: function(code: string) {
            const ops = lines_to_ops(code);
            for (const op of ops) {
                this.execute_op(op);
            }
        },
        execute_op: function(op: Instruction) {
            switch (op.operation) {
                case 'str':
                    // TODO: the operands are register not numbers, for now lets use just numbers
                    if (op.operands[0].value.startsWith('r')) {
                        const reg_idx = parseInt(op.operands[0].value.slice(1));
                        const reg_value = this.regs[reg_idx];
                        this.write(parseInt(op.operands[1].value), reg_value);
                    } else {
                        this.write(parseInt(op.operands[1].value), parseInt(op.operands[0].value));
                    }
                    break;
                default:
                    console.log(op);
            }
        },
        read: function(addr: number) {
            return this.memory[addr];
        },
        write: function(addr: number, value: number) {
            this.memory[addr] = value;
        },
        reset: function() {
            this.regs = [];
            this.memory = new Array<number>(64);
        }
    }

    return cpu;
}

function memoryChecks(cpu: any) {
    const addr = 0x00;
    const value = 0x42;
    cpu.write(addr, value);
    if (cpu.read(addr) !== value) {
        throw new Error('[emul] ]Memory read/write failed');
    } else {
        console.log('[emul] Memory read/write succeeded');
    }

    cpu.reset();
}

const ARMCPU = createARMCPU();
export default ARMCPU;
export { memoryChecks };
