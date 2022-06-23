import { useState } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';

import './App.scss';
import logo from './logo.svg';

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

axios.interceptors.response.use(undefined, function axiosException(err) {
  return Promise.reject(err)
})

const codeExample = 
`; This a simple example in arm thumb!

.text ; Start of .text section. This is where the code will be placed.
  mov r0, #2    ; r0 = 2
  add r0, #1    ; r0 = 3
  add sp, #8    ; sp = sp + 8
  add sp, #4    ; sp = sp + 4 = 12

  mov r1, #0x2  ; r1 = 2
  add r1, r1    ; r1 = 4
  mov r9, r1    ; r9 = 4
  mov r8, r9    ; r8 = 4`
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
    if (cpu.regs['r15'] >= cpu.program.length * 2) {
      setToastMessage(warningMessages[0]);
    } else {
      dispatch(runCode(code));
    }
  }

  const stepInto = () => {
    if (cpu.regs['r15'] >= cpu.program.length * 2) {
      setToastMessage(warningMessages[0]);
      return false;
    } else {
      dispatch(step())
      return true;
    }
  }
  const loadProgram = () => {
    dispatch(reset());
    dispatch(updateProgram(code))

    if (error === undefined) {
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
      <Navbar bg="primary" variant="dark">
        <Navbar.Brand href="#home">
          <img alt="" src={logo} width="35" height="35"/>
          Web ARM Thumb IDE
        </Navbar.Brand>
      </Navbar>

      <ToastContainer position="top-center" className="p-3">
        {/* <Toast bg="danger" delay={3000} onClose={() => dispatch(setError(undefined))} autohide={true}> */}
        {appToast()}
      </ToastContainer>

      <div className="content">
        <div className="menu">
            <Button className="menu-button" variant="outline-primary" onClick={runProgram}>Run Program</Button>
            <Button className="menu-button" variant="outline-primary" onClick={stepInto}>Step Into</Button>
            <Button className="menu-button" variant="outline-primary" onClick={loadProgram}>Load Program</Button>
            <Button className="menu-button" variant="outline-primary" onClick={() => {dispatch(reset())}}>Reset CPU</Button>
            <Button className="menu-button" variant="outline-primary" onClick={() => {setShowHelp(true)}}>ARM Help</Button>
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
