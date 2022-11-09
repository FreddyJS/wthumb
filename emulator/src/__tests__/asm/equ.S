.equ one, 1
.equ two, 2

.equ two, 1
.equ one, 2

.set three, 4
.set three, 3

.text
    mov r1, #one
    mov r2, #two

    add r1, #two
    sub r2, #one

    add r3, #three
