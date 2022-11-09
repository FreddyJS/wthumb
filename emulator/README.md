# ARM Thumb Emulator 
[![Emulator Tests](https://github.com/FreddyJS/wthumb/actions/workflows/tests.yml/badge.svg)](https://github.com/FreddyJS/wthumb/actions/workflows/tests.yml)  

Emulator for ARM Thumb Assembly. Library for a web arm thumb ide with code emulation.  
Reads an assembly code with `gas` syntax, parses it and emulates each operation.  

## Registers
The ARM Thumb has access to the 16 32-bits registers from `r0` to `r15`.  
* Low Registers: `r[0-7]`  
* High Registers: `r[8-15]`  

## Supported Operations
[Instructions Reference](https://developer.arm.com/documentation/ddi0210/c/Introduction/Instruction-set-summary/Thumb-instruction-summary?lang=en)  
If not specified the low and high registers can be used together on a operation.  

Operation | Operand 1 | Operand 2 | Operand 3| Signature 
|  :---:  |   :---    |   :---    |   :---    |  :---   |
MOV | Low Register (Rd) | #8bit_Imm |         | Ld = #8bit_Imm
MOV | Register (Rd) | Register (Rs) |         | Rd = Rs |
ADD | Low Register (Rd) | #8bit_Imm |         | Rd = Rd + #8bit_Imm
ADD | Register (Rd) | Register (Rs) |         | Rd = Rd + Rs
ADD | Register (Rd) | Register (Rs) |         | Rd = Rd + Rs
ADD | Low Register (Rd) | Low Register (Rs) | #3bit_Imm | Rd = Rd + Rs
ADD | Stack Pointer (Sp) | #7bit_Imm |  | Sp = Sp + #7bit_Imm

## Testing
Each instruction is tested using an assembly code compiled by a gcc compiler and test with `qemu-arm`.  
To update the tests when running locally and **not** using --ci the test suite will automatically create a .json.tmp file.  
By removing the .tmp extension the file will be the expected output on the next tests.

## Setup the crosscompiler and qemu
The crosscompiler is used on the test suites to compile the assembly code and ensure it is valid.  
```sh
sudo apt-get install gcc-arm-linux-gnueabihf
sudo apt install qemu-user
```