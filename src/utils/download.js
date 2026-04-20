export const downloadNote = (note, format = 'md') => {
  const filename = `${note.title || 'untitled'}.${format}`;
  let content;
  let mimeType;

  if (format === 'md' || format === 'markdown') {
    content = note.content || '';
    mimeType = 'text/markdown';
  } else if (format === 'txt') {
    content = note.content || '';
    mimeType = 'text/plain';
  } else if (format === 'html') {
    content = `<!DOCTYPE html>
<html>
<head><title>${note.title || 'Note'}</title></head>
<body>
<h1>${note.title || 'Untitled'}</h1>
<pre>${(note.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    mimeType = 'text/html';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadVault = (notes, vaultName, format = 'md') => {
  if (!notes || notes.length === 0) {
    console.log('No notes to download');
    return;
  }

  const folderName = vaultName || 'vault';
  let content;
  let mimeType;

  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date.toDate === 'function') {
      return date.toDate().toISOString();
    }
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
  };

  if (format === 'md' || format === 'markdown') {
    content = notes
      .sort((a, b) => {
        const aTime = a.updatedAt?.seconds || new Date(a.updatedAt).getTime() / 1000;
        const bTime = b.updatedAt?.seconds || new Date(b.updatedAt).getTime() / 1000;
        return bTime - aTime;
      })
      .map(note => `---
title: ${note.title || 'Untitled'}
created: ${formatDate(note.createdAt)}
updated: ${formatDate(note.updatedAt)}
---

${note.content || ''}

`)
      .join('\n---\n\n');
    mimeType = 'text/markdown';
  } else if (format === 'json') {
    content = JSON.stringify(notes, null, 2);
    mimeType = 'application/json';
  }

  const filename = `${folderName}.${format === 'json' ? 'json' : 'md'}`;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};