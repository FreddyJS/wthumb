AS = arm-linux-gnueabihf-as
LD = arm-linux-gnueabihf-ld
Q = qemu-arm

AS_FLAGS = -mthumb
LD_FLAGS = --thumb-entry=_start

OBJECTS = hello-world.o hello-name.o
EXAMPLES = hello-world hello-name

all: $(EXAMPLES)

clean:
	rm -f $(OBJECTS)
	rm -f $(EXAMPLES)

$(OBJECTS): %.o: %.s
	$(info [AS] $< -> $@)
	@$(AS) $(AS_FLAGS) -o $@ $<

$(EXAMPLES): $(OBJECTS)
	$(info [LD] $@.o -> $@)
	@$(LD) $(LD_FLAGS) -o $@ $@.o

%.test: %
	$(info [Q] $<)
	@$(Q) $<
