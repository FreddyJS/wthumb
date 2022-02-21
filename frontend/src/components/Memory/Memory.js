import "./memory.scss";

import Table from 'react-bootstrap/Table';

const Memory = ({ memory }) => {
    const tableRows = () => {
        let rows = [];
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
            <h3>Memory Layout</h3>
            <Table>
                <thead>
                    <th>#</th>
                    <th>Value</th>
                </thead>
                <tbody style={{visibility: "collapse"}}>
                    <tr>
                        <td>0x00</td>
                        <td>0x00</td>
                    </tr>
                </tbody>
            </Table>
            <div className="memory-container">
                <Table>
                    <tbody>
                        {tableRows()}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default Memory;