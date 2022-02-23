import { Instruction, lines_to_ops, OperandType } from './parser';
import CPU_CONFIG from './armthumb';

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
        regs: new Array<number>(CPU_CONFIG.total_registers).fill(0).map((_, i) => i),
        memory: new Array<number>(CPU_CONFIG.memory_size).fill(0),
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
                    {
                        const addr = op.operands[1].type === OperandType.Inmediate ?  parseInt(op.operands[1].value.replace("#0x", "")) : this.regs[parseInt(op.operands[1].value.slice(1))];
                        const value = this.regs[parseInt(op.operands[0].value.slice(1))];
                        this.write(addr, value);
                    } break;
                case 'mov':
                    {
                        const reg = parseInt(op.operands[0].value.slice(1));
                        const value = op.operands[1].type === OperandType.Inmediate ?  parseInt(op.operands[1].value.replace("#0x", ""), 16) : this.regs[parseInt(op.operands[1].value.slice(1))];
                        this.regs[reg] = value;
                    } break;
                    
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
