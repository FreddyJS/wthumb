import './help.scss';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { wordToDirective, wordToOperation } from 'emulator/types';
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
                <h4>Supported operations</h4>
                <Table className="help-table" striped bordered hover>
                    <thead>
                        <tr>
                            <th>Instruction</th>
                            <th>Example</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(wordToOperation).map((word) => {
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

                <h4>Supported directives</h4>
                <Table className="help-table" striped bordered hover>
                    <thead>
                        <tr>
                            <th>Directive</th>
                            <th>Example</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(wordToDirective).map((word) => {
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