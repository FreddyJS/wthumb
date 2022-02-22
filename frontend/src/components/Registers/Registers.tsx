import { useAppSelector } from "hooks";
import "./registers.scss";

const Registers = () => {
  const regs = useAppSelector(state => state.cpu.cpu.regs);

  return (
    <div className="registers">
      <h3>Registers</h3>
      <div className="registers-container">
        {regs.map((value: number, i: number) => (
          <div key={i} className="registers-item">
            <div className="registers-item-name">R{i}</div>
            <div className="registers-item-value">0x{value.toString(16).padStart(2, "0")}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Registers;