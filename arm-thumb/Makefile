AS = arm-linux-gnueabihf-as
LD = arm-linux-gnueabihf-ld
Q = qemu-arm

AS_FLAGS = -mthumb
LD_FLAGS = --thumb-entry=_start

OBJECTS = hello-world.o hello-world2.o
EXAMPLES = hello-world hello-world2

all: $(EXAMPLES)

clean:
	rm -f $(OBJECTS)
	rm -f $(EXAMPLES)

.s.o:
	$(AS) $(AS_FLAGS) -o $@  $<

$(EXAMPLES):
	$(info [AS] $@.s -> $@.o)
	@$(AS) $(AS_FLAGS) -o $@.o $@.s

	$(info [LD] $@.o -> $@)
	@$(LD) $(LD_FLAGS) -o $@ $@.o

%.test: %
	$(info [Q] $<)
	@$(Q) $<
