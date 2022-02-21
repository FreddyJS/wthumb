import { useState } from 'react';

import logo from './logo.svg';
import './App.scss';

// Bootstrap Components
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/esm/Button';

// Self defined Components
import CodeEditor from './components/CodeEditor';
import Memory from './components/Memory';

// Emulator
import initCPU from './emulator/cpu';

const cpu = initCPU();

function App() {
  const [code, setCode] = useState('');
  
  const runCode = () => {
    console.log('[emul] Running code...');
    console.log('[emul] Code:', code);
    console.log('[emul] CPU:', cpu);

    cpu.run(code);
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
        <p>Lines: {code.split("\n").length} <Button variant="outline-primary" onClick={runCode}>Run</Button></p>
        <div className='content-code'>
          <CodeEditor placeHolder="Type your code here..." onChange={(text) => {setCode(text)}}/>
          <Memory memory={cpu.memory.data}/>
        </div>
      </div>
    </div>
  );
}

export default App;
