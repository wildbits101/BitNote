import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Edit2, Eye, Check, Loader, Download, Image, Table } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { downloadNote } from '../utils/download';

const Editor = ({ note, onBack, isNew }) => {
  const { saveNote, syncing } = useNotes();
  const [content, setContent] = useState(note?.content || '');
  const [title, setTitle] = useState(note?.title || '');
  const [showRaw, setShowRaw] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
      setTitle(note.title || '');
    }
  }, [note?.id]);

  const extractTitle = (text) => {
    if (!text) return 'Untitled';
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.slice(2).slice(0, 100);
      }
    }
    return lines[0]?.slice(0, 100) || 'Untitled';
  };

  const handleSave = useCallback(async () => {
    if (!content.trim()) return;
    
    const newTitle = extractTitle(content);
    const updatedNote = {
      ...note,
      content,
      title: newTitle,
      updatedAt: new Date(),
    };
    
    setTitle(newTitle);
    setSaveStatus('syncing');
    await saveNote(updatedNote);
    setSaveStatus('saved');
  }, [content, note, saveNote]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (content !== note?.content) {
      setSaveStatus('saving');
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 1000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const getWordCount = () => {
    const words = content.trim().split(/\s+/).filter(w => w).length;
    return words;
  };

  const insertTable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    
    const newText = content.substring(0, start) + tableTemplate + content.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 10);
    }, 0);
  };

  const insertImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imageTemplate = '![Alt text](/images/)';
    
    const newText = content.substring(0, start) + imageTemplate + content.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 13, start + 19);
    }, 0);
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <button className="editor-back" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        
        <div className="editor-actions">
          <button 
            className="preview-toggle" 
            onClick={() => downloadNote(note, 'md')} 
            title="Download"
          >
            <Download size={20} />
          </button>
          <button className="preview-toggle" onClick={() => setShowRaw(!showRaw)} title={showRaw ? 'Preview' : 'Edit'}>
            {showRaw ? <Eye size={20} /> : <Edit2 size={20} />}
          </button>
          <div className={`save-indicator ${saveStatus}`}>
            {saveStatus === 'syncing' && <Loader size={14} className="spinning" />}
            {saveStatus === 'saved' && <Check size={14} />}
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'syncing' ? 'Syncing...' : 'Saved'}</span>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <button className="toolbar-btn" onClick={() => insertFormatting('**', '**')}>B</button>
        <button className="toolbar-btn" onClick={() => insertFormatting('*', '*')}>I</button>
        <button className="toolbar-btn" onClick={() => insertFormatting('# ')}>H1</button>
        <button className="toolbar-btn" onClick={() => insertFormatting('## ')}>H2</button>
        <button className="toolbar-btn" onClick={() => insertFormatting('- ')}>List</button>
        <button className="toolbar-btn" onClick={() => insertFormatting('[', '](url)')}>Link</button>
        <button className="toolbar-btn" onClick={() => insertFormatting('`', '`')}>Code</button>
        <button className="toolbar-btn" onClick={insertTable} title="Table">
          <Table size={16} />
        </button>
        <button className="toolbar-btn" onClick={insertImage} title="Image">
          <Image size={16} />
        </button>
      </div>

      <div className="editor-main">
        {showRaw ? (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing in Markdown..."
            spellCheck="false"
          />
        ) : (
          <div className="preview-panel">
            <div className="preview-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content*'}
              </ReactMarkdown>
            </div>
          </div>
)}
      </div>
    </div>
  );
};

export default Editor;