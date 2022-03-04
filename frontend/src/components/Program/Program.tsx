import { useAppSelector } from "hooks";
import "./program.scss";

import { Table } from "react-bootstrap";

import { Instruction } from "emulator/types";
import { selectProgram } from "reducers/cpuReducer";

const Program = () => {
  const program = useAppSelector(selectProgram)

  return (
    <div className="program">
      <div className="program-header">
        <h3>Program</h3>
      </div>
      <div className="program-container">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {program.map((ins: Instruction, index: number) => (
              <tr key={index}>
                <td>0x{(index*2).toString(16).padStart(2, '0')}</td>
                <td>
                  {ins.label}
                </td>
                <td style={{ textAlign: "left", paddingLeft: "5%"}}>
                  {ins.name + " " + ins.operands.map(op => op.value).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default Program;