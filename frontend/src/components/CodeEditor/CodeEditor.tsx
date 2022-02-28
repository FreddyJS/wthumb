import "./code-editor.scss";

import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/stream-parser';

// Custom code mirror mode only for arm thumb
import gasArmThumb from './cm-armthumb';

const codeExample = 
`; This a simple example in arm thumb!

.text ; Start of .text section. This is where the code will be placed.
  mov r0, #2    ; r0 = 2
  add r0, #1    ; r0 = 3
  add sp, #8    ; sp = sp + 8
  add sp, #-3   ; sp = sp - 3 = 5

  mov r1, #0x2  ; r1 = 2
  add r1, r1    ; r1 = 4
  mov r9, r1    ; r9 = 4
  mov r8, r9    ; r8 = 4`;

type CodeEditorProps = {
  placeHolder: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const CodeEditor = ({ placeHolder, onChange }: CodeEditorProps) => {
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
        extensions={[StreamLanguage.define(gasArmThumb)]}
        onChange={(value, viewUpdate) => {
          onChange(value);
        }}
      />
      {/* <textarea id="ce-textarea" className="ce-textarea" placeholder={placeHolder} onChange={onChangeHandler} onKeyDown={onKeyDownHandler}/> */}
    </div>
  );
};

export default CodeEditor;