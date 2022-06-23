import { useState } from "react";

import "./registers.scss";
import { useAppDispatch, useAppSelector } from "hooks";

import Form from "react-bootstrap/Form";
import FormGroup from "react-bootstrap/FormGroup";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Table from 'react-bootstrap/Table';

import { updateRegister } from "reducers/cpuReducer";

const Registers = () => {
  const dispatch = useAppDispatch();

  const regs = useAppSelector((state) => state.cpu.cpu.regs);
  const z = useAppSelector((state) => state.cpu.cpu.z);
  const n = useAppSelector((state) => state.cpu.cpu.n);
  const c = useAppSelector((state) => state.cpu.cpu.c);
  const v = useAppSelector((state) => state.cpu.cpu.v);

  const [selectedRegister, setSelectedRegister] = useState('r0');
  const [registerValue, setRegisterValue] = useState('');
  const [isValidValue, setIsValidValue] = useState(false);
  const [mode, setMode] = useState('hexadecimal');

  const regs_n = Object.keys(regs).length;
  const regs_per_row = 4;

  const saveRegister = () => {
    dispatch(updateRegister({ register: selectedRegister, value: Number(registerValue) }));
    setRegisterValue('');
    setIsValidValue(false);
  }

  const onChangeRegisterValue = (value: string) => {
    if (value === '' || isNaN(Number(value)) || Number(value) > 0xFFFFFFFF || Number(value) < 0x0 ) {
      setIsValidValue(false);
    } else {
      setIsValidValue(true);
    }

    setRegisterValue(value.toUpperCase().replace("X", "x"));
  }

  const parseRegister = (register: string, format: string): string => {
    if (format === 'hexadecimal') {
      return '0x' + regs[register].toString(16).padStart(8, '0').toUpperCase();
    } else if (format === 'signed') {
      if ((regs[register] >> 0) < 0) {
        return '-' + (-(regs[register] >> 0)).toString(10).padStart(9, '0');
      } else {
        return (regs[register] >> 0).toString(10).padStart(10, '0');
      }
    } else if (format === 'unsigned') {
      return (regs[register] >>> 0).toString(10).padStart(10, '0');
    }

    return ''
  }

  const registerMenu = (
    <Popover id="popover-reg">
      <Popover.Header as="h3">Register {selectedRegister.toUpperCase()}</Popover.Header>
      <Popover.Body>
        <Table bordered>
        <tbody>
          <tr>
            <td>Hex.</td>
            <td><Badge bg="primary" className="registers-item-value">{parseRegister(selectedRegister, 'hexadecimal')}</Badge></td>
          </tr>
          <tr>
            <td>Signed</td>
            <td><Badge bg="primary" className="registers-item-value">{parseRegister(selectedRegister, 'signed')}</Badge></td>
          </tr>
          <tr>
            <td>Unsigned</td>
            <td><Badge bg="primary" className="registers-item-value">{parseRegister(selectedRegister, 'unsigned')}</Badge></td>
          </tr>
        </tbody>
      </Table>
        <Form onSubmit={(e) => e.preventDefault()}>
          <FormGroup>
            <Form.Label htmlFor="inputRegValue">Register value</Form.Label>
            <Form.Control
              placeholder={"0x" + regs[selectedRegister].toString(16).padStart(8, '0').toUpperCase()}
              isInvalid={!isValidValue}
              isValid={isValidValue}
              value={registerValue}
              id="newregval"
              type="text"
              onChange={(e) => onChangeRegisterValue(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">
              Not a valid 32 bits number.
              {Number(registerValue) > 0xFFFFFFFF ? " Number too big" : Number(registerValue) < 0x0 ? " No negative numbers" : " Not a Number"}
            </Form.Control.Feedback>
            <Form.Text id="valuehelp" muted>New value of register. A 32 bits number.</Form.Text>
          </FormGroup>

          { isValidValue ? 
            <Button onClick={saveRegister}>Save</Button>
            :
            <Button onClick={saveRegister} disabled>Save</Button>
          }
        </Form>
      </Popover.Body>
    </Popover>
  );

  const registers_row = (first: number, last: number) => {
    let row: JSX.Element[] = [];
    for (let i = first; i < last; i++) {
      row.push(
        <OverlayTrigger key={"regoverlay" + i} trigger="click" placement="left" overlay={registerMenu} rootClose={true}>
          <Button key={i} variant="outline-primary" className="registers-item" onClick={() => setSelectedRegister('r' + i)}>
            <div className="registers-item-name">R{i}</div>
            <Badge bg="primary" className="registers-item-value">{parseRegister('r' + i, mode)}</Badge>
          </Button>
        </OverlayTrigger>
      );
    }

    return row;
  };

  const registers_rows = () => {
    let rows: JSX.Element[] = [];
    const total_rows = Math.ceil(regs_n / regs_per_row);

    for (let i = 0; i < total_rows; i++) {
      const first = i * regs_per_row;
      const last = Math.min(first + regs_per_row, regs_n);
      rows.push(
        <div className="registers-row" key={i}>
          {registers_row(first, last)}
        </div>
      );
    }
    return rows;
  }
  
  return (
    <div className="registers">
      <div className="registers-header">
        <div className="registers-menu">
          <h5>
            Registers values representation
          </h5>

          <Button variant="outline-secondary" onClick={() => setMode('hexadecimal')} active={mode === 'hexadecimal'}>Hexadecimal</Button>{' '}
          <Button variant="outline-secondary" onClick={() => setMode('signed')} active={mode === 'signed'}>Signed</Button>{' '}
          <Button variant="outline-secondary" onClick={() => setMode('unsigned')} active={mode === 'unsigned'}>Unsigned</Button>{' '}
        </div>

        <div className="registers-flags-container">
          <h5>
            CPU Flags
          </h5>
          <div className="registers-flags">
            <h3 style={{ color: z ? "red" : "gray" }}>Z</h3>
            <h3 style={{ color: n ? "red" : "gray" }}>N</h3>
            <h3 style={{ color: c ? "red" : "gray" }}>C</h3>
            <h3 style={{ color: v ? "red" : "gray" }}>V</h3>
          </div>
        </div>
      </div>
      
      {registers_rows()}

    </div>
  );
};

export default Registers;