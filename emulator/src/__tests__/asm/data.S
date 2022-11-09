.data
	.byte 0xF, 0xA
	.align 2
	.byte 0xBB
	
	.align 2
	.ascii "Hello world"
	.byte 0xFF
	
	.align 2
	.asciz "Hello world"
	.byte 0xFF

	.balign 2
	.byte 0xAA

	.balign 2
	.hword 0xFF

	.balign 2
	.word 0xAAAAAAAA

	@ Here we are not aligned. Last mem value 0x0000AAAA
	.quad 0xFFFFFFFF

	.byte 0xAA
	.space 2
	.byte 0xBB
