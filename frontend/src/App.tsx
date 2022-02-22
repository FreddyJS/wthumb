import { useState } from 'react';
import { useAppDispatch } from './hooks';

import './App.scss';
import logo from './logo.svg';

// Bootstrap Components
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/esm/Button';

// Self defined Components
import Memory from './components/Memory';
import Program from 'components/Program';
import Registers from 'components/Registers';
import CodeEditor from './components/CodeEditor';

// Emulator
import { runCode, updateProgram } from './reducers/cpuReducer';

function App() {
  const [code, setCode] = useState('');
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
        <div>Lines of code: {code.split("\n").length}
          <div>
            <Button variant="outline-primary" onClick={startEmul}>Run</Button>
            <Button variant="outline-primary" onClick={() => {dispatch(updateProgram(code))}}>Load Program</Button>
            <Button variant="outline-primary">Clear Memory</Button>
          </div>
          <p></p>
        </div>
        <div className='content-code'>
          <Program/>
          <CodeEditor placeHolder="Type your code here..." onChange={(text) => {setCode(text)}}/>
          <div>
            <Registers/>
            <Memory/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
