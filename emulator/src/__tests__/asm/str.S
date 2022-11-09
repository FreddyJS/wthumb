.text
    mov r1, #4
    mov r2, #255
    str r1, [r0, #0]
    str r2, [r0, #4]
    strh r2, [r0, #8]
    strb r2, [r0, #10]

.data
    .word 0x80000000
    .word 0xFFFFFFFF
    .word 0x02
