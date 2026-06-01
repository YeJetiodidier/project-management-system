(function () {
  'use strict';

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  async function fetchComments(taskId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const res = await fetch('/api/comments?taskId=' + encodeURIComponent(taskId));
      if (!res.ok) return;
      const comments = await res.json();
      container.innerHTML = comments.map(c => `
        <div class="comment-item" data-id="${escapeHtml(c.id)}">
          <div class="comment-author"><strong>${escapeHtml(c.author || 'Anonymous')}</strong></div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
          <div class="comment-meta">${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
        </div>
      `).join('');
    } catch (e) { console.error('Failed to load comments', e); }
  }

  async function addComment(taskId, text, author) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, text, author })
    });
    return res.ok;
  }

  async function editComment(id, text) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text })
    });
    return res.ok;
  }

  async function deleteComment(id) {
    const res = await fetch('/api/comments?id=' + encodeURIComponent(id), { method: 'DELETE' });
    return res.ok;
  }

  window.Comments = { fetch: fetchComments, add: addComment, edit: editComment, delete: deleteComment };
})();
