import { useState } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';

import './App.scss';
import logo from './logo.svg';

// Bootstrap Components
import Alert from 'react-bootstrap/Alert';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/esm/Button';

// Self defined Components
import Memory from './components/Memory';
import Program from 'components/Program';
import Registers from 'components/Registers';
import CodeEditor from './components/CodeEditor';

// Emulator
import { runCode, updateProgram } from './reducers/cpuReducer';


const codeExample = 
`; This a simple example in arm thumb!

.text ; Start of .text section. This is where the code will be placed.
  mov r0, #2    ; r0 = 2
  add r0, #1    ; r0 = 3
  add sp, #8    ; sp = sp + 8
  add sp, #-3   ; sp = sp - 3 = 5

  mov r1, #0x2  ; r1 = 2
  add r1, r1    ; r1 = 4
  mov r9, r1    ; r9 = 4
  mov r8, r9    ; r8 = 4`;

function App() {
  const [code, setCode] = useState(codeExample);
  const error = useAppSelector((state) => state.cpu.error);
  const dispatch = useAppDispatch();

  const startEmul = () => {
    dispatch(runCode(code));
  };

  return (
    <div className="App">
      <Navbar bg="primary" variant="dark">
        <Navbar.Brand href="#home">
          <img
            alt=""
            src={logo}
            width="35"
            height="35"
          />

          Web ARM Thumb IDE
        </Navbar.Brand>
      </Navbar>

      <div className="content">
        {/* Here we should change between different modes, for now lets just put a text editor*/}
        <p></p>
        <div style={{display: "flex", flexDirection: "column"}}>
          <p>Lines of code: {code.split("\n").length}</p>
          <div>
            <Button variant="outline-primary" onClick={startEmul}>Run</Button>
            <Button variant="outline-primary" onClick={() => {dispatch(updateProgram(code))}}>Load Program</Button>
            <Button variant="outline-primary">Clear Memory</Button>
          </div>
          <p></p>
          <div>{error !== undefined ? <Alert variant='danger'>{error}</Alert> : ''}</div>
        </div>
        <div className='content-code'>
          <Program/>
          <CodeEditor value={code} placeHolder="Type your code here..." onChange={(text) => {setCode(text)}}/>
          <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
            <Registers/>
            <Memory/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
