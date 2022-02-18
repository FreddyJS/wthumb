import "./code-editor.scss";

const CodeEditor = ({ placeHolder, onChange, onKeyDown }) => {
  return (
    <textarea
      className="editor"
      placeholder={placeHolder}
      onChange={onChange}
    ></textarea>
  );
};

export default CodeEditor;