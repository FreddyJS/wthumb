import { useAppSelector } from "hooks";
import "./program.scss";

import { Table } from "react-bootstrap";

import { operationToWord, Instruction } from "emulator/compiler";
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
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {program.map((ins: Instruction, index: number) => (
              <tr key={index}>
                <td>0x{(index*2).toString(16).padStart(2, '0')}</td>
                <td>
                  <table style={{ width: "100%"}}>
                    <tbody>
                      <tr>
                        <td>{ins.label}</td>
                        <td>{operationToWord[ins.operation]}</td>
                        {ins.operands.map((operand, index) => (
                          <td key={index}>{operand.value}{index !== ins.operands.length -1 ? ',' : ''}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
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