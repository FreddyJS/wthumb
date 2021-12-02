.text
.global _start

_start:
    @ Asks for a name to say hello to
    mov r0, #0x01     @ stdinput
    ldr r1, =name     @ name ptr address
    mov r2, #32       @ 32 bytes
    mov r7, #0x03     @ read
    svc 0             @ read syscall

    @ Write 'Hello, ' to the screen
    mov r0, #0x01     @ stdout
    ldr r1, =hellostr @ address of the string
    mov r2, #7        @ length of the string
    mov r7, #0x4      @ syscall number for `write`
    swi 0             @ write syscall

    @ Write the name to the screen
    mov r0, #0x01     @ stdout
    ldr r1, =name     @ address of the string
    mov r2, #32       @ length of the string
    mov r7, #0x04     @ syscall number for `write`
    swi 0             @ write syscall

_exit:
    mov r7, #0x01    @ syscall number for `exit`
    mov r0, #0x00    @ exit status
    swi 0            @ exit syscall

.data
hellostr:
    .ascii "Hello, "

.bss
name:
    .space 32
