import { useState } from "react";
import "./memory.scss";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import FormGroup from "react-bootstrap/FormGroup";
import Table from 'react-bootstrap/Table';
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Badge from "react-bootstrap/Badge";

import { selectMemory, updateMemory } from "reducers/cpuReducer";
import { useAppDispatch, useAppSelector } from 'hooks';


const Memory = () => {
  const dispatch = useAppDispatch();
  const memory = useAppSelector(selectMemory);
  const memorySize = useAppSelector((state) => state.cpu.cpu.memSize);
  
  const [selectedMemoryAddress, setSelectedMemoryAddress] = useState(-1);
  const [memoryValue, setMemoryValue] = useState('');
  const [isValidValue, setIsValidValue] = useState(false);
  const [mode, setMode] = useState('all');

  if (memory === undefined) {
    return <div>Loading...</div>
  }

  const saveMemory = () => {
    dispatch(updateMemory({ address: selectedMemoryAddress, value: Number(memoryValue) }));
    setMemoryValue('');
    setIsValidValue(false);
  }

  const onChangeMemoryValue = (value: string) => {
    if (value === '' || isNaN(Number(value)) || Number(value) > 0xFFFFFFFF || Number(value) < 0x0 ) {
      setIsValidValue(false);
    } else {
      setIsValidValue(true);
    }

    setMemoryValue(value.toUpperCase().replace("X", "x"));
  }

  const wordToString = (value: number)  => {
    let str = '';
    for (let i = 0; i < 4; i++) {
      const byte = value & 0xFF;
      value = value >>> 8;

      str = str + String.fromCharCode(byte);
    }

    return str;
  }

  const parseMemory = (value: number, format: string): string => {
    if (format === 'hexadecimal') {
      return '0x' + value.toString(16).padStart(8, '0').toUpperCase();
    } else if (format === 'signed') {
      if ((value >> 0) < 0) {
        return '-' + (-(value >> 0)).toString(10).padStart(9, '0');
      } else {
        return (value >> 0).toString(10).padStart(10, '0');
      }
    } else if (format === 'unsigned') {
      return (value >>> 0).toString(10).padStart(10, '0');
    } else if (format === 'string') {
      return wordToString(value);
    }

    return ''
  }

  const memoryMenu = selectedMemoryAddress === -1 ? (<></>) : (
    <Popover id="popover-mem">
      <Popover.Header as="h3">Memory at 0x{selectedMemoryAddress.toString(16).padStart(8, '0').toUpperCase()}</Popover.Header>
      <Popover.Body>
      <Table bordered>
          <tbody>
            <tr>
              <td>Hex.</td>
              <td><Badge bg="primary" className="registers-item-value">{parseMemory(memory.data[Math.floor(selectedMemoryAddress/4)], 'hexadecimal')}</Badge></td>
            </tr>
            <tr>
              <td>Signed</td>
              <td><Badge bg="primary" className="registers-item-value">{parseMemory(memory.data[Math.floor(selectedMemoryAddress/4)], 'signed')}</Badge></td>
            </tr>
            <tr>
              <td>Unsigned</td>
              <td><Badge bg="primary" className="registers-item-value">{parseMemory(memory.data[Math.floor(selectedMemoryAddress/4)], 'unsigned')}</Badge></td>
            </tr>
            <tr>
              <td>String</td>
              <td><Badge bg="primary" className="registers-item-value">{parseMemory(memory.data[Math.floor(selectedMemoryAddress/4)], 'string')}</Badge></td>
            </tr>
          </tbody>
        </Table>
        <Form onSubmit={(e) => e.preventDefault()}>
          <FormGroup>
            <Form.Label htmlFor="inputMemLabel">Memory value</Form.Label>
            <Form.Control
              placeholder={"0x" + memory.data[selectedMemoryAddress/4].toString(16).padStart(8, '0').toUpperCase()}
              isInvalid={!isValidValue}
              isValid={isValidValue}
              value={memoryValue}
              id="newmemval"
              type="text"
              onChange={(e) => onChangeMemoryValue(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">
              Not a valid 32 bits number.
              {Number(memoryValue) > 0xFFFFFFFF ? " Number too big" : Number(memoryValue) < 0x0 ? " No negative numbers" : " Not a Number"}
            </Form.Control.Feedback>
            <Form.Text id="valuehelp" muted>New value of memory. A 32 bits number.</Form.Text>
          </FormGroup>

          { isValidValue ? 
            <Button onClick={saveMemory}>Save</Button>
            :
            <Button onClick={saveMemory} disabled>Save</Button>
          }
        </Form>
      </Popover.Body>
    </Popover>
  );

  const tableRows = () => {
    let rows: JSX.Element[] = []
    const start = mode === 'stack' ? memorySize : 0;
    const end = mode === 'data' ? memorySize : memory.data.length;

    console.log(start, end)

    for (let i = start; i < end; i++) {
      const address = i * 4;
      const endAddress = address + 3;
      const strAddress = '0x' + (address).toString(16).padStart(8, '0').toUpperCase();
      const strEndAddress = '0x' + (endAddress).toString(16).padStart(8, '0').toUpperCase();

      if (selectedMemoryAddress === address) {
        rows.push(
          <OverlayTrigger key={"memoverlay" + i} placement="left" overlay={memoryMenu} rootClose={true} show={true}>
            <tr key={i} style={{ backgroundColor: selectedMemoryAddress === address ? "#c3e6cb" : "" }} onClick={() => {
                if (selectedMemoryAddress === address) {
                  setSelectedMemoryAddress(-1)
                } else {
                  setSelectedMemoryAddress(address)
                }
              }}>
              {/* Address and value in hexadecimal with at least 2 digits*/}
              <td>{strAddress} - {strEndAddress}</td>
              <td>
                0x{memory.data[i].toString(16).padStart(8, '0').toUpperCase()}
              </td>
              <td>
                {wordToString(memory.data[i])}
              </td>
            </tr>
          </OverlayTrigger>
        );
      } else {
        rows.push(
            <tr key={i} onClick={() => setSelectedMemoryAddress(address)}>
              {/* Address and value in hexadecimal with at least 2 digits*/}
              <td>{strAddress} - {strEndAddress}</td>
              <td>
                0x{memory.data[i].toString(16).padStart(8, '0').toUpperCase()}
              </td>
              <td>
                {wordToString(memory.data[i])}
              </td>
            </tr>
        );
      }
    }

    return rows;
  }

  return (
    <div className="memory">
      <div className="memory-header">
        <div className="memory-menu">
          <h5>Memory Sections</h5>

          <Button variant="outline-secondary" onClick={() => setMode('all')} active={mode === 'all'}>All</Button>{' '}
          <Button variant="outline-secondary" onClick={() => setMode('data')} active={mode === 'data'}>Data</Button>{' '}
          <Button variant="outline-secondary" onClick={() => setMode('stack')} active={mode === 'stack'}>Stack</Button>{' '}
        </div>
      
      </div>
      <div className="memory-container" onScroll={() => setSelectedMemoryAddress(-1)}>
        <Table striped hover>
          <thead>
            <tr>
              <th>Address</th>
              <th>Value</th>
              <th>String</th>
            </tr>
          </thead>
          <tbody>
            {tableRows()}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default Memory;