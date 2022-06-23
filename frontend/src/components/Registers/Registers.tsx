import { useState } from "react";

import "./registers.scss";
import { useAppDispatch, useAppSelector } from "hooks";

import Form from "react-bootstrap/Form";
import FormGroup from "react-bootstrap/FormGroup";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { updateRegister } from "reducers/cpuReducer";

const Registers = () => {
  const dispatch = useAppDispatch();

  const regs = useAppSelector(state => state.cpu.cpu.regs);
  const z = useAppSelector(state => state.cpu.cpu.z);
  const n = useAppSelector(state => state.cpu.cpu.n);
  const c = useAppSelector(state => state.cpu.cpu.c);
  const v = useAppSelector(state => state.cpu.cpu.v);

  const [selectedRegister, setSelectedRegister] = useState('r0');
  const [registerValue, setRegisterValue] = useState('');
  const [isValidValue, setIsValidValue] = useState(false);

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

  const registerMenu = (
    <Popover id="popover-reg">
      <Popover.Header as="h3">Register {selectedRegister.toUpperCase()}</Popover.Header>
      <Popover.Body>
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
            <Badge bg="primary" className="registers-item-value">0x{regs[`r${i}`].toString(16).padStart(8, '0').toUpperCase()}</Badge>
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
      <h3>Registers</h3>
      
      {registers_rows()}

      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", width: "100%" }}>
        <h3 style={{ color: z ? "red" : "gray" }}>Z</h3>
        <h3 style={{ color: n ? "red" : "gray" }}>N</h3>
        <h3 style={{ color: c ? "red" : "gray" }}>C</h3>
        <h3 style={{ color: v ? "red" : "gray" }}>V</h3>
      </div>
    </div>
  );
};

export default Registers;