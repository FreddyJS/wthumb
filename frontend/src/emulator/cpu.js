class Memory {
    // Data can be: 8-bit (bytes), 16-bit (half-words), 32-bit (words)
    // Words must be aligned to 4-byte boundaries. Halfwords must be aligned to 2-byte boundaries.

    constructor(size) {
        this.size = size;
        this.data = new Uint8Array(size);
    }
    
    /**
     * Returns a 8 bit value from the memory.
     *
     * @param {number} addr The address to read from.
     * @return {number} The 8 bit value.
     */
    read(addr) {
        return this.data[addr];
    }

    /**
     * Returns a 16 bit value from the memory.
     * @param {number} addr The address to read from.
     * @return {number} The 16 bit value.
    */
    read16(addr) {
        return this.data[addr] | (this.data[addr + 1] << 8);
    }

    /**
     * Returns a 32 bit value from the memory.
     * @param {number} addr The address to read from.
     * @return {number} The 32 bit value.
    */
    read32(addr) {
        return this.data[addr] | (this.data[addr + 1] << 8) | (this.data[addr + 2] << 16) | (this.data[addr + 3] << 24);
    }
    
    /**
     * Writes a 8 bit value to the memory.
     * @param {number} addr The address to write to.
     * @param {number} value The 8 bit value.
     * @return {void}
    */
    write(addr, value) {
        this.data[addr] = value;
    }

    /**
     * Writes a 16 bit value to the memory.
     * @param {number} addr The address to write to.
     * @param {number} value The 16 bit value.
     * @return {void}
    */
    write16(addr, value) {
        this.data[addr] = value & 0xFF;
        this.data[addr + 1] = (value >> 8) & 0xFF;
    }

    /**
     * Writes a 32 bit value to the memory.
     * @param {number} addr The address to write to.
     * @param {number} value The 32 bit value.
     * @return {void}
    */
    write32(addr, value) {
        this.data[addr] = value & 0xFF;
        this.data[addr + 1] = (value >> 8) & 0xFF;
        this.data[addr + 2] = (value >> 16) & 0xFF;
        this.data[addr + 3] = (value >> 24) & 0xFF;
    }

    /**
     * Clears the memory.
     * @return {void}
    */
    clear() {
        this.data.fill(0);
    }
}

class Cpu {
    constructor(memory) {
        this.memory = memory;
    }

    run(code) {
        // TODO: Implement
        console.log('[emul] Unimplemented');
    }
}

function memoryChecks(memory) {
    const addr = 0x100;
    const value = 0x42;
    memory.write(addr, value);
    if (memory.read(addr) !== value) {
        throw new Error('[emul] ]Memory read/write failed');
    } else {
        console.log('[emul] Memory read/write succeeded');
    }

    const value16 = 0x4242;
    memory.write16(addr, value16);
    if (memory.read16(addr) !== value16) {
        throw new Error('[emul] ]Memory read16/write16 failed');
    } else {
        console.log('[emul] Memory read16/write16 succeeded');
    }

    const value32 = 0x42424242;
    memory.write32(addr, value32);
    if (memory.read32(addr) !== value32) {
        throw new Error('[emul] ]Memory read32/write32 failed');
    } else {
        console.log('[emul] Memory read32/write32 succeeded');
    }

    memory.clear();
}

function initCPU() {
    const memory = new Memory(1024);
    memoryChecks(memory);

    const cpu = new Cpu(memory);
    return cpu;
}

export default initCPU;
