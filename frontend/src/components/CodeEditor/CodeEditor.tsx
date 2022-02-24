import { useEffect } from "react";
import "./code-editor.scss";

import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/stream-parser';

// Custom code mirror mode only for arm thumb
import armThumb from './cm-armthumb';

const codeExample = 
`; This a simple example in arm thumb!

; .text ; Not supported by the compiler yet
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

const CodeEditor = ({ placeHolder, onChange }: CodeEditorProps) => {
  useEffect(() => {
    onChange(codeExample);
  }, [onChange]);

  return (
    <div className="code-editor">
      <CodeMirror
        placeholder={placeHolder}
        value={codeExample}
        theme='light'
        style={{
          textAlign: "left",
          height: "100%",
          overflow: "auto"
        }}
        extensions={[StreamLanguage.define(armThumb)]}
        onChange={(value, viewUpdate) => {
          onChange(value);
        }}
      />
      {/* <textarea id="ce-textarea" className="ce-textarea" placeholder={placeHolder} onChange={onChangeHandler} onKeyDown={onKeyDownHandler}/> */}
    </div>
  );
};

export default CodeEditor;