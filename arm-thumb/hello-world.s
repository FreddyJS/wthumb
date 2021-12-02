.text
.global _start

_start:
    mov r0, #0x01    @ stdout
    ldr r1, =_string @ address of the string
    mov r2, #14      @ length of the string
    mov r7, #0x4     @ syscall number for `write`
    swi 0            @ execute syscall

_exit:
    mov r7, #0x01
    mov r0, #0x00
    swi 0

.data
_string:
    .ascii "Hello, World!\n"
