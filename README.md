# wthumb
Web Emulator for ARM Thumb Assembly. Code editor for arm thumb with syntax highlighting and emulation of code.

## ARM Thumb Instructions References
* [ARM Thumb Syscalls](https://syscalls.w3challs.com/?arch=arm_thumb)  
* [ARM Thumb Instruction Set](https://developer.arm.com/documentation/ddi0210/c/Introduction/Instruction-set-summary/Thumb-instruction-summary?lang=en)  

## Supported Operations
Operation | Operand 1 | Operand 2 | Operand 3| Signature 
|  :---:  |   :---    |   :---    |   :---    |  :---   |
MOV | Low Register (Rd) | #8bit_Imm |         | Ld = #8bit_Imm
MOV | Register (Rd) | Register (Rs) |         | Rd = Rs |
ADD | Low Register (Rd) | #8bit_Imm |         | Rd = Rd + #8bit_Imm
ADD | Register (Rd) | Register (Rs) |         | Rd = Rd + Rs
ADD | Register (Rd) | Register (Rs) |         | Rd = Rd + Rs
ADD | Low Register (Rd) | Low Register (Rs) | #3bit_Imm | Rd = Rd + Rs
ADD | Stack Pointer (Sp) | #7bit_Imm |  | Sp = Sp + #7bit_Imm

## Ubuntu CrossCompiler
```sh
sudo apt-get install gcc-arm-linux-gnueabihf # Crosscompiler toolchain
sudo apt install qemu-user                   # To install a qemu emulator to run and test the compiled files
```

## React Libraries
* [react-bootstrap](https://react-bootstrap.github.io/)
* [react-codemirror](https://uiwjs.github.io/react-codemirror/)
