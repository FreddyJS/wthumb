import { useState } from "react";
import "./memory.scss";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import FormGroup from "react-bootstrap/FormGroup";
import Table from 'react-bootstrap/Table';
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import { selectMemory, updateMemory } from "reducers/cpuReducer";
import { useAppDispatch, useAppSelector } from 'hooks';


const Memory = () => {
  const memory = useAppSelector(selectMemory);
  const dispatch = useAppDispatch();
  const [selectedMemoryAddress, setSelectedMemoryAddress] = useState(-1);
  const [memoryValue, setMemoryValue] = useState('');
  const [isValidValue, setIsValidValue] = useState(false);

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

  const memoryMenu = selectedMemoryAddress === -1 ? (<></>) : (
    <Popover id="popover-basic">
      <Popover.Header as="h3">Memory at 0x{selectedMemoryAddress.toString(16).padStart(8, '0').toUpperCase()}</Popover.Header>
      <Popover.Body>
        <Form onSubmit={(e) => e.preventDefault()}>
          <FormGroup>
            <Form.Label htmlFor="inputPassword5">Memory value</Form.Label>
            <Form.Control
              placeholder={"0x" + memory[selectedMemoryAddress].toString(16).padStart(8, '0').toUpperCase()}
              isInvalid={!isValidValue}
              isValid={isValidValue}
              value={memoryValue}
              id="newregval"
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
    for (let i = 0; i < memory.length; i++) {
      const address = i * 4;
      rows.push(
        <OverlayTrigger key={"memoverlay" + i} trigger="click" placement="left" overlay={memoryMenu} rootClose={true} show={address === selectedMemoryAddress}>
          <tr key={i} onClick={() => setSelectedMemoryAddress(address)}>
            {/* Address and value in hexadecimal with at least 2 digits*/}
            <td>0x{(address).toString(16).padStart(8, '0').toUpperCase()}</td>
              <td>
                0x{memory[i].toString(16).padStart(8, '0').toUpperCase()}
              </td>
          </tr>
        </OverlayTrigger>
      );
    }

    return rows;
  }

  return (
    <div className="memory">
      <div className="memory-header">
        <h3>Memory Layout</h3>
      </div>
      <div className="memory-container" onScroll={() => setSelectedMemoryAddress(-1)}>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Value</th>
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