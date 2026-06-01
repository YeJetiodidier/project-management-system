(function () {
  'use strict';

  const fileList = document.getElementById('fileList');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterProject = document.getElementById('filterProject');
  const sortBy = document.getElementById('sortBy');
  const viewGrid = document.getElementById('viewGrid');
  const viewList = document.getElementById('viewList');
  const openFileModalBtn = document.getElementById('openFileModalBtn');
  const fileModalOverlay = document.getElementById('fileModalOverlay');
  const closeFileModalBtn = document.getElementById('closeFileModalBtn');
  const cancelFileBtn = document.getElementById('cancelFileBtn');
  const saveFileBtn = document.getElementById('saveFileBtn');

  const statTotal = document.getElementById('statTotal');
  const statDocs = document.getElementById('statDocs');
  const statImages = document.getElementById('statImages');
  const statLinked = document.getElementById('statLinked');

  let filesData = [];
  let projectsData = [];
  let usersData = [];
  let currentView = 'grid';

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function projectLabel(id) {
    if (!id) return '';
    const p = projectsData.find(x => x.id === id);
    return p ? p.name : id;
  }

  function fileNameOf(f) { return f.file_name || f.filename || f.name || 'Unnamed'; }

  function normalizeType(t) {
    if (!t) return 'other';
    const lower = String(t).toLowerCase();
    if (['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'zip'].includes(lower)) return lower;
    return 'other';
  }

  function isImageType(t) { return ['png', 'jpg', 'jpeg'].includes(normalizeType(t)); }
  function isDocType(t)   { return ['pdf', 'docx', 'xlsx'].includes(normalizeType(t)); }

  function getFileIcon(type) {
    const t = normalizeType(type);
    const icons = { pdf: 'PDF', docx: 'DOC', xlsx: 'XLS', png: 'IMG', jpg: 'IMG', jpeg: 'IMG', zip: 'ZIP', other: 'FILE' };
    return icons[t] || icons.other;
  }

  async function fetchFiles() {
    try {
      const r = await fetch('/api/files');
      if (r.ok) filesData = await r.json();
      updateStats();
      populateProjectFilter();
      renderFiles();
    } catch (e) { console.error('Failed to fetch files', e); }
  }

  async function fetchProjects() {
    try {
      const r = await fetch('/api/projects');
      if (r.ok) projectsData = await r.json();
    } catch (e) { /* ignore */ }
  }

  async function fetchUsers() {
    try {
      const r = await fetch('/api/users');
      if (r.ok) usersData = await r.json();
    } catch (e) { /* ignore */ }
  }

  function uploaderName(id) {
    if (!id) return '';
    const u = usersData.find(x => x.id === id);
    return u ? (u.name || u.username || u.email) : '';
  }

  function updateStats() {
    if (statTotal)   statTotal.textContent = filesData.length;
    if (statDocs)    statDocs.textContent = filesData.filter(f => isDocType(f.type)).length;
    if (statImages)  statImages.textContent = filesData.filter(f => isImageType(f.type)).length;
    if (statLinked)  statLinked.textContent = filesData.filter(f => f.projectId).length;
  }

  function populateProjectFilter() {
    if (!filterProject) return;
    const current = filterProject.value;
    const opts = ['<option value="all">All Projects</option>']
      .concat(projectsData.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`));
    filterProject.innerHTML = opts.join('');
    if (current) filterProject.value = current;
  }

  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getFilteredFiles() {
    const search = (searchInput?.value || '').toLowerCase().trim();
    const typeFilter = filterType?.value || 'all';
    const projectFilter = filterProject?.value || 'all';
    const sortType = sortBy?.value || 'newest';

    let list = filesData.slice();
    if (search) list = list.filter(f => fileNameOf(f).toLowerCase().includes(search));
    if (typeFilter !== 'all') list = list.filter(f => normalizeType(f.type) === typeFilter);
    if (projectFilter !== 'all') list = list.filter(f => f.projectId === projectFilter);

    switch (sortType) {
      case 'oldest':
        list.sort((a, b) => new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0));
        break;
      case 'name':
        list.sort((a, b) => fileNameOf(a).localeCompare(fileNameOf(b)));
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
    }
    return list;
  }

  function renderFileCard(f) {
    const isGrid = currentView === 'grid';
    const t = normalizeType(f.type);
    const name = fileNameOf(f);
    const typeBadge = `<span class="file-type-badge type-${t}">${escapeHtml(t)}</span>`;
    const projectLabelStr = f.projectId ? projectLabel(f.projectId) : '';
    const dateStr = formatDate(f.uploadedAt);
    const uploader = uploaderName(f.uploadedBy);
    const canManage = Auth.isManager() || (Auth.id() && Auth.id() === f.uploadedBy);

    const actions = canManage ? `
      <div class="${isGrid ? 'file-grid-footer' : 'file-actions'}">
        <button class="btn-action" data-edit-file="${escapeHtml(f.id)}">✏️ Edit</button>
        <button class="btn-action danger" data-del-file="${escapeHtml(f.id)}">🗑️ Delete</button>
      </div>` : '';

    if (isGrid) {
      return `
        <div class="file-item grid-view">
          <div class="file-grid-header">
            <div class="file-grid-icon type-${t}">${escapeHtml(getFileIcon(f.type))}</div>
            <div class="file-grid-type">${escapeHtml(t)}</div>
          </div>
          <div class="file-grid-body">
            <div class="file-grid-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
            <div class="file-grid-meta">
              ${projectLabelStr ? `<span class="file-meta-item">📁 ${escapeHtml(projectLabelStr)}</span>` : ''}
              ${dateStr ? `<span class="file-meta-item">📅 ${escapeHtml(dateStr)}</span>` : ''}
            </div>
            ${uploader ? `<div class="file-grid-meta">👤 ${escapeHtml(uploader)}</div>` : ''}
            ${f.url ? `<a class="file-link" href="${escapeHtml(f.url)}" target="_blank" rel="noopener" title="${escapeHtml(f.url)}">${escapeHtml(f.url)}</a>` : ''}
          </div>
          ${actions}
        </div>
      `;
    }

    return `
      <div class="file-item">
        <div class="file-icon type-${t}">${escapeHtml(getFileIcon(f.type))}</div>
        <div class="file-info">
          <div class="file-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
          <div class="file-meta">
            ${typeBadge}
            ${projectLabelStr ? `<span class="file-meta-item">📁 ${escapeHtml(projectLabelStr)}</span>` : ''}
            ${dateStr ? `<span class="file-meta-item">📅 ${escapeHtml(dateStr)}</span>` : ''}
            ${uploader ? `<span class="file-meta-item">👤 ${escapeHtml(uploader)}</span>` : ''}
          </div>
          ${f.url ? `<a class="file-link" href="${escapeHtml(f.url)}" target="_blank" rel="noopener" title="${escapeHtml(f.url)}">${escapeHtml(f.url)}</a>` : ''}
        </div>
        ${actions}
      </div>
    `;
  }

  function renderFiles() {
    const filtered = getFilteredFiles();
    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (fileList) {
        fileList.className = 'file-list';
        fileList.innerHTML = '';
      }
      return;
    }
    if (emptyState) emptyState.style.display = 'none';
    if (fileList) {
      fileList.className = 'file-list' + (currentView === 'grid' ? ' grid-view' : '');
      fileList.innerHTML = filtered.map(renderFileCard).join('');
    }
  }

  function populateProjectSelect(selectedId) {
    const sel = document.getElementById('fileProject');
    if (!sel) return;
    const opts = ['<option value="">— None —</option>']
      .concat(projectsData.map(p => {
        const selAttr = p.id === selectedId ? ' selected' : '';
        return `<option value="${escapeHtml(p.id)}"${selAttr}>${escapeHtml(p.name)}</option>`;
      }));
    sel.innerHTML = opts.join('');
  }

  function openModal() {
    document.getElementById('editFileId').value = '';
    document.getElementById('fileName').value = '';
    document.getElementById('fileType').value = 'pdf';
    document.getElementById('fileUrl').value = '';
    populateProjectSelect('');
    document.getElementById('fileModalTitle').textContent = 'Upload File';
    fileModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    fileModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function editFile(id) {
    const f = filesData.find(x => x.id === id);
    if (!f) return;
    document.getElementById('editFileId').value = id;
    document.getElementById('fileName').value = fileNameOf(f);
    document.getElementById('fileType').value = normalizeType(f.type);
    document.getElementById('fileUrl').value = f.url || '';
    populateProjectSelect(f.projectId || '');
    document.getElementById('fileModalTitle').textContent = 'Edit File';
    fileModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  async function saveFile() {
    const name = document.getElementById('fileName').value.trim();
    if (!name) { alert('File name is required'); return; }
    const editId = document.getElementById('editFileId').value;
    const body = {
      id: editId || undefined,
      file_name: name,
      type: document.getElementById('fileType').value,
      url: document.getElementById('fileUrl').value.trim(),
      projectId: document.getElementById('fileProject').value,
      uploadedBy: sessionStorage.getItem('pms_id') || sessionStorage.getItem('pms_userId') || ''
    };
    await fetch('/api/files', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    closeModal();
    fetchFiles();
  }

  async function deleteFile(id) {
    if (!confirm('Delete this file?')) return;
    await fetch('/api/files?id=' + encodeURIComponent(id), { method: 'DELETE' });
    fetchFiles();
  }

  document.addEventListener('click', function (e) {
    const editId = e.target.closest('[data-edit-file]')?.getAttribute('data-edit-file');
    if (editId) { editFile(editId); return; }
    const delId = e.target.closest('[data-del-file]')?.getAttribute('data-del-file');
    if (delId) { deleteFile(delId); }
  });

  if (openFileModalBtn) openFileModalBtn.addEventListener('click', async () => {
    await fetchProjects();
    openModal();
  });
  if (closeFileModalBtn) closeFileModalBtn.addEventListener('click', closeModal);
  if (cancelFileBtn) cancelFileBtn.addEventListener('click', closeModal);
  if (saveFileBtn) saveFileBtn.addEventListener('click', saveFile);
  if (fileModalOverlay) fileModalOverlay.addEventListener('click', (e) => {
    if (e.target === fileModalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  if (searchInput) searchInput.addEventListener('input', renderFiles);
  if (filterType) filterType.addEventListener('change', renderFiles);
  if (filterProject) filterProject.addEventListener('change', renderFiles);
  if (sortBy) sortBy.addEventListener('change', renderFiles);

  if (viewGrid) viewGrid.addEventListener('click', () => {
    currentView = 'grid';
    viewGrid.classList.add('active');
    viewList?.classList.remove('active');
    renderFiles();
  });
  if (viewList) viewList.addEventListener('click', () => {
    currentView = 'list';
    viewList.classList.add('active');
    viewGrid?.classList.remove('active');
    renderFiles();
  });

  document.addEventListener('DOMContentLoaded', () => {
    Promise.all([fetchProjects(), fetchUsers()]).then(fetchFiles);
  });
})();
