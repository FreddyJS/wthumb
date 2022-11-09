import defaultCPU, { armCPU_T } from '../cpu';
import * as fs from 'fs';

const ASM_DIR = __dirname + '/asm/';
var exec = require('child_process').execSync;

let ci = false;
process.argv.forEach((arg) => {
  if (arg === '--ci') {
    ci = true;
  }
});

function checkWithCrosscompiler(file: string) {
  // Using arm-linux-gnueabihf-as to compile the assembly
  const cmd = `arm-linux-gnueabihf-as -mthumb -o ${file.replace('.S', '.o')} ${file}`;
  const options = { stdio: 'pipe', encoding: 'utf-8' };

  try {
    exec(cmd, options);
    return true;
  } catch (e) {
    return false;
  }
}

function dumpCPU(cpu: armCPU_T, file: string) {
  fs.writeFileSync(file, JSON.stringify(cpu, null, 2));
}

function runTest(test_name: string) {
  const cpu = defaultCPU({ memorySize: 0, stackSize: 0 });
  const asm = fs.readFileSync(ASM_DIR + `${test_name}.S`, 'utf8');
  let expected: string | undefined = undefined;
  try {
    expected = fs.readFileSync(ASM_DIR + `${test_name}.S.json`, 'utf8');
  } catch (error) {
    if (ci) {
      // Fail test in CI if expected output is not found
      expect(expected).toBeDefined();
    }
  }

  // Compile, load and run the assembly in the CPU
  expect(checkWithCrosscompiler(ASM_DIR + `${test_name}.S`)).toBe(true);
  cpu.loadAssembly(asm);
  expect(cpu.error).toBe(undefined);
  cpu.run();

  if (expected !== undefined) {
    const state = JSON.parse(expected);
    expect(JSON.stringify(cpu)).toBe(JSON.stringify(state));
  } else {
    // In CI we already failed the test if expected output is not found
    dumpCPU(cpu, ASM_DIR + `${test_name}.S.json.tmp`);
    console.log(`No expected output saved for '${test_name}.S'. Dumping state to ${ASM_DIR}${test_name}.S.json.tmp`);
    console.log(`Expected state dumped. Remove the .tmp if everything is ok.`);
    expect(expected).toBeDefined();
  }
}

test('MOV', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('ADD', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('LABELS', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('SUB', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('NEG', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('MUL', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});


test('CMP', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('CMN', () => {
  const test_name = expect.getState().currentTestName.toLowerCase();
  runTest(test_name);
});

test('AND', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('BIC', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('ORR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('EOR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('MVN', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('TST', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('LSL', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('LSR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('ASR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('ROR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('EQUIV', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('EQU', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('DATA', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('LDR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('LDRS', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('STR', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('STACK', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('JUMP', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('BL', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});

test('WFI', () => {
	const test_name = expect.getState().currentTestName.toLowerCase();
	runTest(test_name);
});
