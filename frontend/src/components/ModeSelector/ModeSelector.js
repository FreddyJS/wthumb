import React from 'react';

import './mode-selector.scss';
import Button from 'react-bootstrap/Button';


const ModeSelector = () => {
    return (
        <div className="mode-selector">
            <Button variant="outline-primary">Assembly</Button>
            <Button variant="outline-primary">Emulator</Button>
        </div>
    );
};

export default ModeSelector;
