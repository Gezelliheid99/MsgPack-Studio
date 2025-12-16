import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

export interface CodeEditorHandle {
  foldAll: () => void;
  unfoldAll: () => void;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(({ value, onChange, language = "json", readOnly = false }, ref) => {
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    foldAll: () => {
      // Trigger the action via the editor instance
      editorRef.current?.trigger('fold', 'editor.foldAll', {});
    },
    unfoldAll: () => {
      editorRef.current?.trigger('unfold', 'editor.unfoldAll', {});
    }
  }));

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Minimalist theme configuration
    monaco.editor.defineTheme('minimal-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f9fafb',
        'editorLineNumber.foreground': '#94a3b8',
        'editor.selectionBackground': '#e2e8f0',
      }
    });
    
    monaco.editor.setTheme('minimal-light');
  };

  return (
    <div className="h-full w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          automaticLayout: true,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          // Ensure folding is explicitly enabled
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'always',
          foldingHighlight: true,
        }}
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
