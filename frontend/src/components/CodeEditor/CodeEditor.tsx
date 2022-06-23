import "./code-editor.scss";

import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';

// Custom code mirror mode only for arm thumb
import { armthumb } from './armthumb';

type CodeEditorProps = {
  value?: string;
  placeHolder: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const CodeEditor = ({ value, placeHolder, onChange }: CodeEditorProps) => {
  return (
    <CodeMirror
      className="code-editor"
      placeholder={placeHolder}
      value={value}
      theme='light'
      style={{
        // textAlign: "left",
        height: "100%",
        // overflow: "auto"
      }}
      extensions={[StreamLanguage.define(armthumb)]}
      onChange={(value, viewUpdate) => {
        onChange(value);
      }}
    />
  );
};

export default CodeEditor;