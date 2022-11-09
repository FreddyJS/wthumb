.text
    mov r0, #0
    mov r1, #1
    mov r2, #4
    ldrh r3, [r2, r0]
    ldrsh r4, [r2, r0]
    ldrsh r5, [r0, r0]
    ldrsb r6, [r0, r0]
    ldrsb r7, [r0, r1]

.data
    .word 0x7FFF
    .word 0xFFFFFFFF
    .word 0x02
