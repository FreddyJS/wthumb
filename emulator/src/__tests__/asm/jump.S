b main

.text
never:  mov r0, #0
        mov r1, #0
        mov r2, #0
        b end

main:   add r0, #1
        cmp r0, #10
        beq never
        blt lower
        b never

lower:  mov r0, #10
        cmp r0, #10
        beq equals
        b never

equals: mov r1, #1
        cmp r1, #0
        bgt greater
        b never

greater: mov r2, #255        

end:    mov r0, r0
