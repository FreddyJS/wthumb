# wthumb
[ARM Thumb Syscalls](https://syscalls.w3challs.com/?arch=arm_thumb)  
[ARM Thumb Instruction Set](https://developer.arm.com/documentation/ddi0210/c/Introduction/Instruction-set-summary/Thumb-instruction-summary?lang=en)  

**Initial notes**
* In a raspberry use: `as -mthumb hello-world.s -o hello-world.o` to produce ARM Thumb machine code.
* Link it with `ld --thumb-entry=_start hello-world.o -o hello-world` and it will be valid executable file

**Ubuntu CrossCompiler**
```sh
    sudo apt-get install gcc-arm-linux-gnueabihf # Crosscompiler toolchain
    sudo apt install qemu-user # To install a qemu emulator to run and test the compiled files
    qemu-arm [program] # Run the program :)
```
**Compile ARM Thumb**
```sh
    arm-linux-gnueabihf-as -mthumb hello-world.s -o hello-world.o
    arm-linux-gnueabihf-ld --thumb-entry=_start hello-world.o -o hello-world.exe
    qemu-arm hello-world
```
