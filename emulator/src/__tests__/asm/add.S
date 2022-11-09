.text
  @ All registers start in 0x00 by default
  add r0, r1, #7    @ 3bits inmediate
  add r1, #1        @ 8bits inmediate (short form)
  add r1, r1, #255  @ 8bits inmediate (long form)
  add r0, r1        @ low-low (short form)
  add r0, r0, r1    @ low-low (long form)
  add r8, r0        @ low-high (short form)
  add r8, r8, r0    @ low-high (long form)
  add r3, r8        @ high-low (short form)
  add r3, r3, r8    @ high-low (long form)
  add r9, r8        @ high-high (short form)
  add r9, r9, r8    @ high-high (long form)
  add sp, #4        @ add to sp (short form)
  add sp, sp, #508  @ add to sp (long form)
  add r2, sp, #1020 @ address from sp
  add r4, sp        @ high-low (short SP)
  add r4, r4, sp    @ high-low (long SP)
  add r10, sp       @ high-high (short SP)
  add r10, sp, r10  @ high-high (long SP)
  add r5, r4, r3    @ low-low-low
  @ Expected registers state
  @ sp = 512
  @ r0 = 519, r1 = 256, r2 = 1532, r3 = 2076, r4 = 1024
  @ r8 = 1038, r9 = 2076, r10 = 1024