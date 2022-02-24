import "./code-editor.scss";

import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/stream-parser';
import { gas } from '@codemirror/legacy-modes/mode/gas'

const armCode = `
  add r0, #2    ; r0 = 2
  add r0, #0xf  ; r0 = 17
  add r1, r0    ; r1 = 17
  add r2, #0x2  ; r2 = 2
  add r2, r2    ; r2 = 4
  add r8, r2    ; r8 = 4
  add r8, r8    ; r8 = 8
  add r9, r8    ; r9 = 8
  add r9, r9    ; r9 = 16
  add r9, r2    ; r9 = 20
  ; r0 = 17, r1 = 17, r2 = 4, r8 = 8, r9 = 20`;

type CodeEditorProps = {
  placeHolder: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const CodeEditor = ({ placeHolder, onChange, onKeyDown }: CodeEditorProps) => {
  const onChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const onKeyDownHandler = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Insert 2 spaces when pressing tab
    if (event.key === "Tab") {
      event.preventDefault();
      console.log("Tab pressed");
    }

    if (onKeyDown) {
      onKeyDown(event);
    }
  };
  return (
    <div className="code-editor">
      <CodeMirror
        value={armCode}
        extensions={[StreamLanguage.define(gas)]}
        onChange={(value, viewUpdate) => {
          onChange(value);
        }}
        height="100%"
      />
      {/* <textarea id="ce-textarea" className="ce-textarea" placeholder={placeHolder} onChange={onChangeHandler} onKeyDown={onKeyDownHandler}/> */}
    </div>
  );
};

export default CodeEditor;