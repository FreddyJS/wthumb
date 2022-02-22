import "./memory.scss";

import Table from 'react-bootstrap/Table';
import { selectMemory } from "reducers/cpuReducer";
import { useAppSelector } from 'hooks';


const Memory = () => {
  const memory = useAppSelector(selectMemory)
  if (memory === undefined) {
    return <div>Loading...</div>
  }

  const tableRows = () => {
    let rows: JSX.Element[] = []
    for (let i = 0; i < memory.length; i++) {
      rows.push(
        <tr key={i}>
          {/* Address and value in hexadecimal with at least 2 digits*/}
          <td>0x{i.toString(16).padStart(2, '0')}</td>
          <td>0x{memory[i].toString(16).padStart(2, '0')}</td>
        </tr>
      );
    }

    return rows;
  }

  return (
    <div className="memory">
      <div className="memory-header">
        <h3>Memory Layout</h3>
      </div>
      <div className="memory-container">
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