import "./code-editor.scss";


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
      <textarea id="ce-textarea" className="ce-textarea" placeholder={placeHolder} onChange={onChangeHandler} onKeyDown={onKeyDownHandler}/>
    </div>
  );
};

export default CodeEditor;