import './help.scss';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { wordToDirective, wordToOperation } from 'emulator/types';
import { directivesInfo, operationsInfo } from './info';

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
                <div style={{ display: "flex", flexDirection: "row", height: "50%" }}>
                    <div style={{ width: "50%" }}>
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
                                {Object.keys(operationsInfo).map((word) => {
                                    return (
                                        <tr key={word}>
                                            <td><b>{word}</b></td>
                                            <td>{operationsInfo[word].example}</td>
                                            <td>{operationsInfo[word].description}</td>
                                        </tr>
                                    );
                                }
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <div style={{ width: "50%" }}>
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
                                {Object.keys(directivesInfo).map((word) => {
                                    return (
                                        <tr key={word}>
                                            <td><b>{word}</b></td>
                                            <td>{directivesInfo[word].example}</td>
                                            <td>{directivesInfo[word].description}</td>
                                        </tr>
                                    );
                                }
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>

            </Modal.Body>

            <Modal.Footer>
                <Button variant="primary" onClick={onClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default Help;