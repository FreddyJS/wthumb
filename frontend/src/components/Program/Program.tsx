import "./program.scss";

import { useAppSelector } from "hooks";
import { selectProgram } from "reducers/cpuReducer";

import { Table } from "react-bootstrap";

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
            {program.map((value: string, index: number) => (
              <tr key={index}>
                <td>0x{index.toString(16).padStart(2, '0')}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default Program;