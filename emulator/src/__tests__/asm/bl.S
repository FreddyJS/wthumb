.text
    mov r0, #1
    bl sum
    b end

never: mov r0, #0
       b end

sum:   add r0, r0
       mov pc, lr  @ Return
       b never     @ Never executed

end:   mov r1, r0
