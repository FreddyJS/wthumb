import { useAppDispatch, useAppSelector } from "hooks";
import "./program.scss";

import { Table } from "react-bootstrap";

import { Instruction } from "emulator/types";
import { selectProgram, setBreakpoint, unsetBreakpoint } from "reducers/cpuReducer";

const Program = () => {
  const dispatch = useAppDispatch();
  const program = useAppSelector(selectProgram)
  const pc = useAppSelector(state => state.cpu.cpu.regs["r15"])

  const changeBreakpoint = (index: number) => {
    console.log("Change breakpoint: " + index);
    if (program[index].break === true) {
      dispatch(unsetBreakpoint(index*2));
    } else {
      dispatch(setBreakpoint(index*2));
    }
  }

  return (
    <div className="program">
      <div className="program-container">
        <Table striped hover>
          <thead>
            <tr>
              <th>Break</th>
              <th>Address</th>
              <th>Label</th>
              <th>Instruction</th>
            </tr>
          </thead>
          <tbody>
            {program.map((ins: Instruction, index: number) => (
              <tr key={index} style={index*2 === pc ? { backgroundColor: "#c3e6cb" } : {}}>
                {ins.break === true ? 
                  <td className="program-row-break" onClick={() => changeBreakpoint(index)}>&#128308;</td>
                  :
                  <td className="program-row-break" onClick={() => changeBreakpoint(index)}></td>
                }
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