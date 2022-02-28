.text
.global _start

_start:
    mov r0, #0x01     @ stdout
    ldr r1, =hellostr @ address of the string
    mov r2, #14       @ length of the string
    mov r7, #0x4      @ syscall number for `write`
    swi 0             @ sofware interrupt

_exit:
    mov r7, #0x01    @ syscall number for `exit`
    mov r0, #0x00    @ exit status
    swi 0            @ sofware interrupt

.data
hellostr:
    .ascii "Hello, World!\n"
