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

function App() {
  const [code, setCode] = useState(codeExample);
  const error = useAppSelector((state) => state.cpu.error);
  const dispatch = useAppDispatch();
  const [showHelp, setShowHelp] = useState(false);

  const startEmul = async () => {
    dispatch(runCode(code))
    // try {
    //   const res = await axios.post("http://localhost:8000/api/assembly/validate/", {assembly: code})
    //   const data = res.data
    //   console.log(data)
    //   if (data["compiled"] === true) {
    //     dispatch(runCode(code))
    //   } else {
    //     dispatch(setError(data["message"]))
    //   }
    // } catch (e) {
    //   console.log("The backend is not ready or online. Using typescript compiler")
    //   dispatch(runCode(code))
    // }
  }

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

      {error !== undefined ? 
        <ToastContainer position="top-end" className="p-3">
          <Toast bg="danger">
            <Toast.Header>
              <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" />
              <strong className="me-auto">Asembler Error</strong>
              <small className="text-muted">Line {error.line}</small>
            </Toast.Header>
            <Toast.Body>
              {error.message.split("\n").filter((line) => line.trim().length > 0).map((line, index) => {
                return <div style={{ textAlign: "left" }} key={index}>{line}</div>
              })}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      : null
      }

      <div className="content">
        <div className="menu">
            <Button className="menu-button" variant="outline-primary" onClick={startEmul}>Run</Button>
            <Button className="menu-button" variant="outline-primary" onClick={() => {dispatch(reset()); dispatch(updateProgram(code))}}>Load Program</Button>
            <Button className="menu-button" variant="outline-primary" onClick={() => {dispatch(step())}}>Step</Button>
            <Button className="menu-button" variant="outline-primary" onClick={() => {dispatch(reset())}}>Reset</Button>
            <Button className="menu-button" variant="outline-primary" onClick={() => {setShowHelp(true)}}>Help</Button>
            <Help show={showHelp} onClose={() => setShowHelp(false)}/>
        </div>

        <div className='content-code'>          
          <Program/>
          <CodeEditor value={code} placeHolder="Type your code here..." onChange={(text) => {setCode(text)}}/>
          <div style={{display: "flex", flexDirection: "column", flex: "1 0 auto", height: "100%"}}>
            <Registers/>
            <Memory/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
