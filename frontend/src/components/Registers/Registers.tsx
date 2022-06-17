import "./registers.scss";
import { useAppSelector } from "hooks";

import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

const Registers = () => {
  const regs = useAppSelector(state => state.cpu.cpu.regs);
  const z = useAppSelector(state => state.cpu.cpu.z);
  const n = useAppSelector(state => state.cpu.cpu.n);
  const c = useAppSelector(state => state.cpu.cpu.c);
  const v = useAppSelector(state => state.cpu.cpu.v);
  const regs_n = Object.keys(regs).length;
  const regs_per_row = 4;

  const registers_row = (first: number, last: number) => {
    let row: JSX.Element[] = [];
    for (let i = first; i < last; i++) {
      row.push(
        <Button key={i} variant="outline-primary" className="registers-item">
          <div className="registers-item-name">R{i}</div>
          <div>
            <Badge bg="primary" className="registers-item-value">0x{regs[`r${i}`].toString(16).padStart(8, '0')}</Badge>
          </div>
        </Button>
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