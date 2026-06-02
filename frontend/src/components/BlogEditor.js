import React, { useRef, useEffect, useCallback } from 'react';

const TOOLS = [
  { label: 'B',       title: 'Negrito',           cmd: 'bold',                 cls: 'font-bold' },
  { label: 'I',       title: 'Itálico',           cmd: 'italic',               cls: 'italic' },
  { label: 'H2',      title: 'Título 2',          cmd: 'formatBlock',          val: 'h2' },
  { label: 'H3',      title: 'Título 3',          cmd: 'formatBlock',          val: 'h3' },
  { label: '¶',       title: 'Parágrafo',         cmd: 'formatBlock',          val: 'p' },
  { label: '•',       title: 'Lista',             cmd: 'insertUnorderedList' },
  { label: '1.',      title: 'Lista numerada',    cmd: 'insertOrderedList' },
  { label: '❝',       title: 'Citação',           cmd: 'formatBlock',          val: 'blockquote' },
  { label: '—',       title: 'Divisor',           cmd: 'insertHorizontalRule' },
];

export default function BlogEditor({ value, onChange, placeholder = 'Escreva o conteúdo do post aqui...' }) {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || '';
      isInitialized.current = true;
    }
  }, [value]);

  const exec = useCallback((cmd, val = null) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = window.prompt('URL do link (ex: https://exemplo.com):');
    if (url) exec('createLink', url);
  }, [exec]);

  const insertImage = useCallback(() => {
    const url = window.prompt('URL da imagem:');
    if (url) exec('insertImage', url);
  }, [exec]);

  const handleInput = useCallback(() => {
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }, [exec]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd, t.val); }}
            className={`px-2 py-1 text-sm rounded hover:bg-gray-200 active:bg-gray-300 transition-colors ${t.cls || ''}`}
          >
            {t.label}
          </button>
        ))}
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          title="Inserir link"
          onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          🔗
        </button>
        <button
          type="button"
          title="Inserir imagem por URL"
          onMouseDown={(e) => { e.preventDefault(); insertImage(); }}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        >
          🖼
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          title="Remover formatação"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-400"
        >
          ✕
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="min-h-64 p-4 focus:outline-none blog-content"
        style={{ lineHeight: '1.75' }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .blog-content h2 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
        .blog-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .blog-content p  { margin: 0.75rem 0; }
        .blog-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .blog-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .blog-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; color: #6b7280; margin: 1rem 0; font-style: italic; }
        .blog-content a  { color: #2563eb; text-decoration: underline; }
        .blog-content img { max-width: 100%; border-radius: 0.5rem; margin: 0.75rem 0; }
        .blog-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
      `}</style>
    </div>
  );
}
