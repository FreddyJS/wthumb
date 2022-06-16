import './help.scss';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { wordToOperation } from 'emulator/types';
type HelpProps = {
    show: boolean;
    onClose: () => void;
  }

const Help = ({ show, onClose }: HelpProps) => {
    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>ARM Thumb Instruction Set</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Instruction</th>
                            <th>Example</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(wordToOperation).map((word) => {
                            const operation = wordToOperation[word];
                            return (
                                <tr key={word}>
                                    <td><b>{word}</b></td>
                                    <td>This is an example</td>
                                    <td>This is the description</td>
                                </tr>
                            );
                        }
                        )}
                    </tbody>
                </Table>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="primary" onClick={onClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default Help;