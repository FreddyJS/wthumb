import "./code-editor.scss";

const CodeEditor = ({ placeHolder, onChange, onKeyDown }) => {
  const updateCode = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className="code-editor">
      <textarea className="ce-textarea" placeholder={placeHolder} onChange={updateCode} onKeyDown={onKeyDown}/>
    </div>
  );
};

export default CodeEditor;