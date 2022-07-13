import { useState } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';

import './App.scss';
import logo from './cpu.png';

// Bootstrap Components
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

// Self defined Components
import Memory from 'components/Memory';
import Program from 'components/Program';
import Registers from 'components/Registers';
import CodeEditor from 'components/CodeEditor';
import Help from 'components/Help';

// Emulator
import { runCode, step, setError, updateProgram, reset } from 'reducers/cpuReducer';

import axios from 'axios';
import { Operation } from 'emulator';

axios.interceptors.response.use(undefined, function axiosException(err) {
  return Promise.reject(err)
})

const codeExample = 
`; This a simple example in arm thumb!

.text ; Start of .text section. This is where the code will be placed.
  mov r0, #5
  mov r1, #5
  add r0, r1
  cmp r0, #10
  beq stop

  mov r0, #0
  mov r1, #0

stop:  wfi`
;

const warningMessages = [
  "The program has finished",
  "No instructions in memory",
]

const successMessages = [
  "Code compiled without errors",
]


function App() {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.cpu.error);
  const cpu = useAppSelector((state) => state.cpu.cpu);

  const [code, setCode] = useState(codeExample);
  const [showHelp, setShowHelp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const runProgram = () => {
    if (cpu.regs['r15'] >= cpu.program.length * 2 || cpu.program[cpu.regs['r15'] / 2].operation === Operation.WFI) {
      setToastMessage(warningMessages[0]);
    } else {
      dispatch(runCode(code));
    }
  }

  const stepInto = () => {
    if (cpu.regs['r15'] >= cpu.program.length * 2 || cpu.program[cpu.regs['r15'] / 2].operation === Operation.WFI) {
      setToastMessage(warningMessages[0]);
      return false;
    } else {
      dispatch(step())
      return true;
    }
  }

  const loadProgram = () => {
    dispatch(reset());
    const action = dispatch(updateProgram(code))

    // If an error ocurred on compilation action.payload will hold the CompilerError object
    if (action.payload === undefined) {
      setToastMessage(successMessages[0]);
    }
  }

  const appToast = () => {
    const isError = error !== undefined;
    const isWarning = warningMessages.find((el) => el === toastMessage);
    const isSuccess = successMessages.find((el) => el === toastMessage);

    if (isError) {
      return (
        <Toast bg="danger" onClose={() => dispatch(setError(undefined))}>
          <Toast.Header>
            <img src="holder.js/20x20?text=%20" className="rounded me-2" alt=""/>
            <strong className="me-auto">Assembler Error</strong>
            <small className="text-muted">Line {error.line}</small>
          </Toast.Header>
          <Toast.Body>
            {error.message.split("\n").filter((line) => line.trim().length > 0).map((line, index) => {
              return <div style={{ textAlign: "left" }} key={index}>{line}</div>
            })}
          </Toast.Body>
        </Toast>
      )
    } else if (isWarning) {
      return (
        <Toast bg="warning" delay={3000} autohide={true} onClose={() => setToastMessage('')}>
          <Toast.Header>
            <img src="holder.js/20x20?text=%20" className="rounded me-2" alt=""/>
            <strong className="me-auto">Emulator Warning</strong>
          </Toast.Header>
          <Toast.Body>
            {toastMessage.split("\n").filter((line) => line.trim().length > 0).map((line, index) => {
              return <div style={{ textAlign: "left" }} key={index}>{line}</div>
            })}          
          </Toast.Body>
        </Toast>
      )
    } else if (isSuccess) {
      return (
        <Toast bg="success" delay={3000} autohide={true} onClose={() => setToastMessage('')}>
          <Toast.Header>
            <img src="holder.js/20x20?text=%20" className="rounded me-2" alt=""/>
            <strong className="me-auto">Emulator Message</strong>
          </Toast.Header>
          <Toast.Body>
            {toastMessage.split("\n").filter((line) => line.trim().length > 0).map((line, index) => {
              return <div style={{ textAlign: "left" }} key={index}>{line}</div>
            })}            </Toast.Body>
        </Toast>
      )
    }

  }

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#home">
          <img alt="" src={logo} width="35" height="35"/>
          ARM Thumb Emulator
        </Navbar.Brand>
      </Navbar>

      <ToastContainer position="top-center" className="p-3">
        {/* <Toast bg="danger" delay={3000} onClose={() => dispatch(setError(undefined))} autohide={true}> */}
        {appToast()}
      </ToastContainer>

      <div className="content">
        <div className="menu">
            <Button className="menu-button" variant="outline-dark" onClick={runProgram}>Run Program</Button>
            <Button className="menu-button" variant="outline-dark" onClick={stepInto}>Step Into</Button>
            <Button className="menu-button" variant="outline-dark" onClick={loadProgram}>Load Program</Button>
            <Button className="menu-button" variant="outline-dark" onClick={() => {dispatch(reset())}}>Reset CPU</Button>
            <Button className="menu-button" variant="outline-dark" onClick={() => {setShowHelp(true)}}>ARM Help</Button>
            <Help show={showHelp} onClose={() => setShowHelp(false)}/>
        </div>

        <div className='content-code'>          
          <Program/>
          <CodeEditor value={code} placeHolder="Type your code here..." onChange={(text) => {setCode(text)}}/>
          <div style={{ height: "100%" }}>
            <Registers/>
            <Memory/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
