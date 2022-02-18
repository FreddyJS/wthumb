import logo from './logo.svg';
import './App.scss';

// Bootstrap Components
import Navbar from 'react-bootstrap/Navbar';

// Self defined Components
import ModeSelector from './components/ModeSelector';
import CodeEditor from './components/CodeEditor';

function App() {
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

      <ModeSelector />
      <div className="content">
        {/* Here we should change between different modes, for now lets just put a text editor*/}
        <CodeEditor placeHolder="Type your code here..."/>
      </div>
    </div>
  );
}

export default App;
