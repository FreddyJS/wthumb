.text
    mov r0, #4
    ldr r1, [r0, #0]
    ldr r2, [r0, #4]
    ldr r3, [sp, #8]
    ldr r4, [r5, r6]
    ldrh r5, [r0, #0]
    ldrb r6, [r7, #3]

    ldr r7, =str
    ldr r7, [r7]

.data
     .word 0x80000000
     .word 0xFFFFFFFF
str: .asciz "Hello World!"
     .word 0x02
