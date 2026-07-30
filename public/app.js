const API = '/api';
let currentView = 'dashboard';
let editId = null;
const Swal = window.Swal;

let livresCurrentPage = 1;
const LIVRES_PER_PAGE = 20;
let allLivres = [];
let livresSelectedCategory = '';
let allEmplacements = [];
let allCategories = [];
let allAdherents = [];
let adherentsSelectedStatus = '';

const titles = {
  dashboard: 'لوحة التحكم',
  livres: 'فهرس الكتب',
  emplacements: 'مواقع التخزين',
  adherents: 'الأعضاء',
  emprunts: 'الاستعارات',
  settings: 'المعلومات',
};

const addLabels = {
  livres: '+ إضافة كتاب',
  emplacements: '+ إضافة موقع',
  adherents: '+ إضافة عضو',
  emprunts: '+ استعارة جديدة',
};

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('btn-add').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings();
});
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});
document.getElementById('modal-form').addEventListener('submit', handleFormSubmit);

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'خطأ في الخادم');
  return data;
}

function toast(msg, type = 'success') {
  Swal.fire({
    title: type === 'error' ? 'خطأ' : 'تم بنجاح',
    text: msg,
    icon: type === 'error' ? 'error' : 'success',
    confirmButtonText: 'موافق',
    confirmButtonColor: type === 'error' ? '#dc2626' : '#10b981',
    customClass: { popup: 'rounded-3xl' },
  });
}

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'جانفي',
    'فيفري',
    'مارس',
    'أفريل',
    'ماي',
    'جوان',
    'جويلية',
    'أوت',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function statusLabel(statut) {
  const map = {
    Actif: 'نشط',
    Inactif: 'غير نشط',
    Suspendu: 'موقوف',
    'En cours': 'قيد الإعارة',
    Retard: 'متأخر',
    Rendu: 'معاد',
    Rendue: 'معاد',
  };
  return map[statut] || statut || '—';
}

function statusClass(statut) {
  const value = String(statut || '').toLowerCase();
  if (value.includes('actif') || value.includes('نشط')) return 'actif';
  if (value.includes('inactif') || value.includes('غير نشط')) return 'inactif';
  if (value.includes('suspendu') || value.includes('موقوف')) return 'suspendu';
  if (value.includes('retard') || value.includes('متأخر')) return 'retard';
  if (value.includes('معاد') || value.includes('rendu')) return 'rendu';
  if (value.includes('cours') || value.includes('قيد')) return 'en-cours';
  return '';
}

function badge(statut) {
  const cls = statusClass(statut);
  return `<span class="badge badge-${cls}">${statusLabel(statut)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureHoverCard(container, id) {
  let card = document.getElementById(id);
  if (!card) {
    card = document.createElement('div');
    card.id = id;
    card.className = 'adherent-hover-card hidden';
    const mountPoint = container.parentElement || document.body;
    mountPoint.appendChild(card);
  }
  return card;
}

function ensureAdherentHoverCard(container) {
  return ensureHoverCard(container, 'adherent-hover-card');
}

function renderAdherentHoverCard(adherent) {
  const photoHtml = adherent.Has_Photo
    ? `<img src="${API}/adherents/${adherent.ID_Adherent}/photo" alt="${escapeHtml(adherent.Prenom)} ${escapeHtml(adherent.Nom)}" class="hover-card-photo"/>`
    : `<div class="hover-card-photo empty-avatar">صورة</div>`;
  return `
    <div class="flex items-start gap-3">
      ${photoHtml}
      <div class="min-w-0">
        <div class="font-semibold text-slate-900">${escapeHtml(adherent.Prenom)} ${escapeHtml(adherent.Nom)}</div>
        <div class="mt-1 text-xs text-slate-500">${escapeHtml(adherent.Numero_Carte || '—')}</div>
      </div>
    </div>
    <div class="mt-3 space-y-2 text-sm text-slate-600">
      <div><span class="font-semibold text-slate-700">البريد:</span> ${escapeHtml(adherent.Email || '—')}</div>
      <div><span class="font-semibold text-slate-700">الهاتف:</span> ${escapeHtml(adherent.Telephone || '—')}</div>
      <div><span class="font-semibold text-slate-700">العنوان:</span> ${escapeHtml(adherent.Adresse || '—')}</div>
      <div><span class="font-semibold text-slate-700">التخصص:</span> ${escapeHtml(adherent.Specialite || '—')}</div>
      <div><span class="font-semibold text-slate-700">القسم:</span> ${escapeHtml(adherent.Classe_Section || '—')}</div>
      <div><span class="font-semibold text-slate-700">الحالة:</span> ${badge(adherent.Statut)}</div>
      <div><span class="font-semibold text-slate-700">تاريخ الانضمام:</span> ${fmtDate(adherent.Date_Adhesion)}</div>
    </div>`;
}

function showAdherentHoverCard(event, adherent) {
  const container = document.getElementById('adherents-table');
  if (!container) return;
  const card = ensureAdherentHoverCard(container);
  card.innerHTML = renderAdherentHoverCard(adherent);
  card.classList.remove('hidden');
  updateHoverCardPosition(event, 'adherent-hover-card');
}

function renderLivreHoverCard(livre) {
  return `
    <div class="space-y-2 text-sm text-slate-600">
      <div class="font-semibold text-slate-900">${escapeHtml(livre.Titre)}</div>
      ${livre.Editeur ? `<div class="text-xs text-slate-500">${escapeHtml(livre.Editeur)}</div>` : ''}
      <div><span class="font-semibold text-slate-700">الفئة:</span> ${escapeHtml(livre.Categorie || '—')}</div>
      <div><span class="font-semibold text-slate-700">الموقع:</span> ${livre.Rang && livre.Etage ? `طابق ${livre.Etage} صف ${escapeHtml(livre.Rang)}` : '—'}</div>
      <div><span class="font-semibold text-slate-700">المؤلف:</span> ${escapeHtml(livre.Auteur || '—')}</div>
      <div><span class="font-semibold text-slate-700">ISBN:</span> ${escapeHtml(livre.ISBN || '—')}</div>
      <div><span class="font-semibold text-slate-700">السنة:</span> ${escapeHtml(livre.Annee_Publication || '—')}</div>
      <div><span class="font-semibold text-slate-700">المخزون:</span> ${escapeHtml(livre.Quantite_Totale ?? '—')}</div>
      <div><span class="font-semibold text-slate-700">المتاح:</span> ${escapeHtml(livre.Quantite_Disponible ?? '—')}</div>
      <div><span class="font-semibold text-slate-700">تاريخ التحديث:</span> ${fmtDate(livre.Date_Modification)}</div>
    </div>`;
}

function showLivreHoverCard(event, livre) {
  const container = document.getElementById('livres-table');
  if (!container) return;
  const card = ensureHoverCard(container, 'livre-hover-card');
  card.innerHTML = renderLivreHoverCard(livre);
  card.classList.remove('hidden');
  updateHoverCardPosition(event, 'livre-hover-card');
}

function updateHoverCardPosition(event, cardId) {
  const card = document.getElementById(cardId);
  if (!card || card.classList.contains('hidden')) return;
  const offsetX = 18;
  const offsetY = 12;
  const left = Math.min(window.innerWidth - card.offsetWidth - 16, event.clientX + offsetX);
  const top = Math.min(window.innerHeight - card.offsetHeight - 16, event.clientY + offsetY);
  card.style.left = `${Math.max(16, left)}px`;
  card.style.top = `${Math.max(16, top)}px`;
}

function hideHoverCard(cardId) {
  const card = document.getElementById(cardId);
  if (card) card.classList.add('hidden');
}

function hideAdherentHoverCard() {
  hideHoverCard('adherent-hover-card');
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  document.getElementById('page-title').textContent = titles[view];

  const addBtn = document.getElementById('btn-add');
  if (view === 'dashboard') {
    addBtn.classList.add('hidden');
  } else {
    addBtn.classList.remove('hidden');
    addBtn.textContent = addLabels[view];
  }

  loadView(view);
}

async function loadView(view) {
  try {
    if (view === 'dashboard') await loadDashboard();
    else if (view === 'livres') await loadLivres();
    else if (view === 'emplacements') await loadEmplacementsView();
    else if (view === 'adherents') await loadAdherents();
    else if (view === 'emprunts') await loadEmprunts();
    else if (view === 'settings') await loadSettings();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadDashboard() {
  const [stats, emprunts] = await Promise.all([api('/stats'), api('/emprunts')]);

  document.getElementById('stats-grid').innerHTML = `
    <div class="rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-100/80"><div class="text-sm text-slate-500">العناوين</div><div class="mt-2 text-3xl font-semibold text-slate-900">${stats.total_livres}</div></div>
    <div class="rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-100/80"><div class="text-sm text-slate-500">النسخ</div><div class="mt-2 text-3xl font-semibold text-slate-900">${stats.total_exemplaires}</div></div>
    <div class="rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-100/80"><div class="text-sm text-slate-500">المتاحة</div><div class="mt-2 text-3xl font-semibold text-slate-900">${stats.exemplaires_disponibles}</div></div>
    <div class="rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-100/80"><div class="text-sm text-slate-500">الأعضاء النشطون</div><div class="mt-2 text-3xl font-semibold text-slate-900">${stats.adherents_actifs}</div></div>
    <div class="rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-100/80"><div class="text-sm text-slate-500">الاستعارات الجارية</div><div class="mt-2 text-3xl font-semibold text-slate-900">${stats.emprunts_en_cours}</div></div>
    <div class="rounded-3xl border ${stats.emprunts_en_retard > 0 ? 'border-amber-400 bg-amber-50' : 'border-orange-200 bg-white'} p-4 shadow-lg shadow-orange-100/80"><div class="text-sm text-slate-500">متأخرات</div><div class="mt-2 text-3xl font-semibold ${stats.emprunts_en_retard > 0 ? 'text-amber-600' : 'text-slate-900'}">${stats.emprunts_en_retard}</div></div>`;

  const recent = emprunts.slice(0, 5);
  document.getElementById('recent-emprunts').innerHTML = recent.length
    ? `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500"><th class="px-3 py-2">الكتاب</th><th class="px-3 py-2">العضو</th><th class="px-3 py-2">التاريخ</th><th class="px-3 py-2">الحالة</th></tr></thead><tbody>
      ${recent.map((e) => `<tr class="border-t border-orange-100"><td class="px-3 py-2">${e.Livre}</td><td class="px-3 py-2">${e.AdherentPrenom} ${e.AdherentNom}</td><td class="px-3 py-2">${fmtDate(e.Date_Emprunt)}</td><td class="px-3 py-2">${badge(e.Statut)}</td></tr>`).join('')}
    </tbody></table>`
    : '<p class="py-6 text-center text-slate-400">لا توجد استعارات مسجلة</p>';
}

async function loadLivres() {
  await loadEmplacements();
  allLivres = await api('/livres');
  populateCategoryFilter();
  livresCurrentPage = 1;
  renderLivresTable();
}

function populateCategoryFilter() {
  const filter = document.getElementById('livres-category-filter');
  if (!filter) return;
  
  const categories = [...new Set(allLivres.map(l => l.Categorie).filter(Boolean))].sort();
  const previousSelection = livresSelectedCategory;
  
  let html = '<option value="">كل الفئات</option>';
  categories.forEach(cat => {
    html += `<option value="${esc(cat)}" ${cat === previousSelection ? 'selected' : ''}>${esc(cat)}</option>`;
  });
  
  filter.innerHTML = html;
  
  if (categories.includes(previousSelection)) {
    livresSelectedCategory = previousSelection;
  } else {
    livresSelectedCategory = '';
    filter.value = '';
  }
}

function filterLivresByCategory(category) {
  livresSelectedCategory = category;
  livresCurrentPage = 1;
  renderLivresTable();
}

function getFilteredLivres() {
  return livresSelectedCategory
    ? allLivres.filter((l) => l.Categorie === livresSelectedCategory)
    : allLivres;
}

async function printLivresList() {
  const filteredLivres = getFilteredLivres();
  if (!filteredLivres.length) {
    toast('لا توجد كتب للطباعة', 'error');
    return;
  }

  let settings = {};
  try {
    settings = await api('/settings');
  } catch (_) {
    /* ignore */
  }

  const filterLabel = livresSelectedCategory || 'كل الفئات';
  const printedAt = fmtDate(new Date());
  const rows = filteredLivres
    .map(
      (l, i) => `<tr>
      <td>${i + 1}</td>
      <td>${esc(l.Titre || '')}</td>
      <td>${esc(l.Auteur || '')}</td>
      <td>${esc(l.Categorie || '—')}</td>
      <td>${esc(l.ISBN || '—')}</td>
      <td>${esc(l.Editeur || '—')}</td>
      <td>${l.Annee_Publication || '—'}</td>
      <td>${l.Quantite_Totale ?? '—'}</td>
      <td>${l.Quantite_Disponible ?? '—'}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فهرس الكتب — ${esc(filterLabel)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; color: #0f172a; margin: 24px; direction: rtl; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 18px; }
    .meta strong { color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; vertical-align: top; }
    th { background: #fff7ed; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 16px; font-size: 12px; color: #64748b; }
    @media print {
      body { margin: 12px; }
      @page { size: A4 landscape; margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>فهرس الكتب</h1>
  <div class="meta">
    <div><strong>المؤسسة:</strong> ${esc(settings.etablissement || '—')}</div>
    <div><strong>الفئة:</strong> ${esc(filterLabel)} · <strong>عدد الكتب:</strong> ${filteredLivres.length} · <strong>تاريخ الطباعة:</strong> ${printedAt}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>العنوان</th>
        <th>المؤلف</th>
        <th>الفئة</th>
        <th>ISBN</th>
        <th>الناشر</th>
        <th>السنة</th>
        <th>المخزون</th>
        <th>المتاح</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">قائمة ${livresSelectedCategory ? 'مصفّاة' : 'كاملة'} — ${filteredLivres.length} كتاب</div>
  <script>
    window.onload = function () {
      window.print();
    };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) {
    toast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'error');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

function renderLivresTable() {
  const container = document.getElementById('livres-table');
  if (!allLivres.length) {
    container.innerHTML = '<p class="py-8 text-center text-slate-400">لا يوجد كتب — انقر على « إضافة كتاب »</p>';
    return;
  }

  const filteredLivres = getFilteredLivres();

  const totalPages = Math.ceil(filteredLivres.length / LIVRES_PER_PAGE) || 1;
  if (livresCurrentPage > totalPages) livresCurrentPage = totalPages;
  if (livresCurrentPage < 1) livresCurrentPage = 1;

  const start = (livresCurrentPage - 1) * LIVRES_PER_PAGE;
  const end = start + LIVRES_PER_PAGE;
  const pageLivres = filteredLivres.slice(start, end);

  let html = `<table class="min-w-full wide-table text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
      <th class="px-4 py-3">العنوان</th><th class="px-4 py-3">الفئة</th><th class="px-4 py-3">الموقع</th><th class="px-4 py-3">المؤلف</th><th class="px-4 py-3">ISBN</th><th class="px-4 py-3">السنة</th><th class="px-4 py-3">المخزون</th><th class="px-4 py-3">المتاح</th><th class="px-4 py-3">الإنشاء / التحديث</th><th class="px-4 py-3"></th>
    </tr></thead><tbody>
    ${pageLivres.map((l) => `<tr class="border-t border-orange-100">
      <td class="px-4 py-3"><strong class="text-slate-900">${l.Titre}</strong>${l.Editeur ? `<br><span class="text-slate-500">${l.Editeur}</span>` : ''}</td>
      <td class="px-4 py-3"><span class="rounded-xl bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">${l.Categorie ? esc(l.Categorie) : '—'}</span></td>
      <td class="px-4 py-3">${l.Rang && l.Etage ? `ط ${l.Etage} / ص ${esc(l.Rang)}` : '—'}</td>
      <td class="px-4 py-3">${l.Auteur}</td>
      <td class="px-4 py-3">${l.ISBN}</td>
      <td class="px-4 py-3">${l.Annee_Publication || '—'}</td>
      <td class="px-4 py-3">${l.Quantite_Totale}</td>
      <td class="px-4 py-3">${l.Quantite_Disponible}</td>
      <td class="px-4 py-3"><div class="text-xs text-slate-500">إنشاء: ${fmtDate(l.Date_Creation)}</div><div class="text-xs text-slate-400">تحديث: ${fmtDate(l.Date_Modification)}</div></td>
      <td class="px-4 py-3"><div class="flex justify-end gap-2"><button class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-slate-700" onclick="editLivre(${l.ID_Livre})">تعديل</button><button class="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs text-white" onclick="deleteLivre(${l.ID_Livre})">حذف</button></div></td>
    </tr>`).join('')}
  </tbody></table>`;

  if (totalPages > 1) {
    let paginationButtons = '';
    let lastAdded = 0;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= livresCurrentPage - 2 && i <= livresCurrentPage + 2)) {
        if (lastAdded && i - lastAdded > 1) {
          paginationButtons += `<span class="px-1 text-slate-400">...</span>`;
        }
        paginationButtons += `<button class="rounded-xl border ${i === livresCurrentPage ? 'border-orange-500 bg-orange-500 text-white font-semibold' : 'border-orange-200 bg-white text-slate-700 hover:bg-orange-50'} px-3 py-1.5 text-xs transition" onclick="changeLivresPage(${i})">${i}</button>`;
        lastAdded = i;
      }
    }

    html += `
    <div class="mt-4 flex items-center justify-between border-t border-orange-100 pt-4">
      <div class="flex gap-2">
        <button class="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50 transition hover:bg-orange-50" ${livresCurrentPage === 1 ? 'disabled' : ''} onclick="changeLivresPage(${livresCurrentPage - 1})">السابق</button>
        ${paginationButtons}
        <button class="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50 transition hover:bg-orange-50" ${livresCurrentPage === totalPages ? 'disabled' : ''} onclick="changeLivresPage(${livresCurrentPage + 1})">التالي</button>
      </div>
      <span class="text-xs text-slate-500">الصفحة ${livresCurrentPage} من ${totalPages} (إجمالي الكتب في هذه الفئة: ${filteredLivres.length})</span>
    </div>`;
  }

  container.innerHTML = html;

  if (!pageLivres.length) return;
  const card = ensureHoverCard(container, 'livre-hover-card');
  if (!pageLivres.length) {
    card.classList.add('hidden');
    return;
  }

  container.querySelectorAll('tbody tr').forEach((row, index) => {
    const livre = pageLivres[index];
    row.addEventListener('mouseenter', (event) => showLivreHoverCard(event, livre));
    row.addEventListener('mousemove', (event) => updateHoverCardPosition(event, 'livre-hover-card'));
    row.addEventListener('mouseleave', () => hideHoverCard('livre-hover-card'));
  });
}

function changeLivresPage(page) {
  livresCurrentPage = page;
  renderLivresTable();
}

async function loadAdherents() {
  allAdherents = await api('/adherents');
  const filter = document.getElementById('adherents-status-filter');
  if (filter) filter.value = adherentsSelectedStatus;
  renderAdherentsTable();
}

function filterAdherentsByStatus(status) {
  adherentsSelectedStatus = status;
  renderAdherentsTable();
}

function getFilteredAdherents() {
  return adherentsSelectedStatus
    ? allAdherents.filter((a) => a.Statut === adherentsSelectedStatus)
    : allAdherents;
}

async function printAdherentsList() {
  const filteredAdherents = getFilteredAdherents();
  if (!filteredAdherents.length) {
    toast('لا يوجد أعضاء للطباعة', 'error');
    return;
  }

  let settings = {};
  try {
    settings = await api('/settings');
  } catch (_) {
    /* ignore */
  }

  const filterLabel = adherentsSelectedStatus || 'كل الحالات';
  const printedAt = fmtDate(new Date());
  const rows = filteredAdherents
    .map(
      (a, i) => `<tr>
      <td>${i + 1}</td>
      <td>${esc(a.Prenom || '')} ${esc(a.Nom || '')}</td>
      <td>${esc(a.Numero_Carte || '—')}</td>
      <td>${esc(a.Email || '—')}</td>
      <td>${esc(a.Telephone || '—')}</td>
      <td>${esc(a.Specialite || '—')}</td>
      <td>${esc(a.Classe_Section || '—')}</td>
      <td>${fmtDate(a.Date_Adhesion)}</td>
      <td>${esc(statusLabel(a.Statut))}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>قائمة الأعضاء — ${esc(filterLabel)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; color: #0f172a; margin: 24px; direction: rtl; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 18px; }
    .meta strong { color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; vertical-align: top; }
    th { background: #fff7ed; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 16px; font-size: 12px; color: #64748b; }
    @media print {
      body { margin: 12px; }
      @page { size: A4 landscape; margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>قائمة الأعضاء</h1>
  <div class="meta">
    <div><strong>المؤسسة:</strong> ${esc(settings.etablissement || '—')}</div>
    <div><strong>الحالة:</strong> ${esc(filterLabel)} · <strong>عدد الأعضاء:</strong> ${filteredAdherents.length} · <strong>تاريخ الطباعة:</strong> ${printedAt}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>العضو</th>
        <th>رقم البطاقة</th>
        <th>البريد الإلكتروني</th>
        <th>الهاتف</th>
        <th>التخصص</th>
        <th>القسم</th>
        <th>تاريخ الانضمام</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">قائمة ${adherentsSelectedStatus ? 'مصفّاة' : 'كاملة'} — ${filteredAdherents.length} عضو</div>
  <script>
    window.onload = function () {
      window.print();
    };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) {
    toast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'error');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

function renderAdherentsTable() {
  const container = document.getElementById('adherents-table');
  const adherents = getFilteredAdherents();

  if (!allAdherents.length) {
    container.innerHTML = '<p class="py-8 text-center text-slate-400">لا يوجد أعضاء — انقر على « إضافة عضو »</p>';
    return;
  }

  if (!adherents.length) {
    container.innerHTML = '<p class="py-8 text-center text-slate-400">لا يوجد أعضاء بهذه الحالة</p>';
    hideAdherentHoverCard();
    return;
  }

  container.innerHTML = `<table class="min-w-full wide-table text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
        <th class="px-2 py-2">الصورة</th><th class="px-2 py-2">عضو</th><th class="px-2 py-2">البريد</th><th class="px-2 py-2">الهاتف</th><th class="px-2 py-2">العنوان</th><th class="px-2 py-2">التخصص</th><th class="px-2 py-2">القسم</th><th class="px-2 py-2">الانضمام</th><th class="px-2 py-2">الحالة</th><th class="px-2 py-2">التحديث</th><th class="px-2 py-2"></th>
      </tr></thead><tbody>
      ${adherents.map((a) => {
        const photoHtml = a.Has_Photo
          ? `<img src="${API}/adherents/${a.ID_Adherent}/photo" alt="${a.Prenom} ${a.Nom}" class="adherent-photo-cell"/>`
          : `<span class="adherent-photo-cell empty-avatar">صورة</span>`;
        return `<tr class="border-t border-orange-100" data-adherent-id="${a.ID_Adherent}"><td class="px-2 py-2">${photoHtml}</td><td class="px-2 py-2"><div class="inline-flex items-center gap-3"><div><strong class="text-slate-900">${a.Prenom} ${a.Nom}</strong><div class="text-xs text-slate-500">${a.Numero_Carte || '—'}</div></div></div></td><td class="px-2 py-2">${a.Email}</td><td class="px-2 py-2">${a.Telephone || '—'}</td><td class="px-2 py-2">${a.Adresse || '—'}</td><td class="px-2 py-2">${a.Specialite || '—'}</td><td class="px-2 py-2">${a.Classe_Section || '—'}</td><td class="px-2 py-2">${fmtDate(a.Date_Adhesion)}</td><td class="px-2 py-2">${badge(a.Statut)}</td><td class="px-2 py-2 text-xs text-slate-500">${fmtDate(a.Date_Modification)}</td><td class="px-2 py-2"><div class="flex justify-end gap-1.5 flex-wrap"><button class="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs text-slate-700" onclick="printAdherent(${a.ID_Adherent})">طباعة البطاقة</button><button class="rounded-xl border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-slate-700" onclick="editAdherent(${a.ID_Adherent})">تعديل</button><button class="rounded-xl bg-rose-500/90 px-2.5 py-1.5 text-xs text-white" onclick="deleteAdherent(${a.ID_Adherent})">حذف</button></div></td></tr>`;
      }).join('')}
    </tbody></table>`;

  const card = ensureAdherentHoverCard(container);
  card.classList.add('hidden');

  container.querySelectorAll('tbody tr').forEach((row, index) => {
    const adherent = adherents[index];
    row.addEventListener('mouseenter', (event) => showAdherentHoverCard(event, adherent));
    row.addEventListener('mousemove', (event) => updateHoverCardPosition(event, 'adherent-hover-card'));
    row.addEventListener('mouseleave', hideAdherentHoverCard);
  });
}

async function loadEmprunts() {
  const emprunts = await api('/emprunts');
  document.getElementById('emprunts-table').innerHTML = emprunts.length
    ? `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
        <th class="px-3 py-2">الكتاب</th><th class="px-3 py-2">العضو</th><th class="px-3 py-2">الاستعارة</th><th class="px-3 py-2">العودة المتوقعة</th><th class="px-3 py-2">العودة الفعلية</th><th class="px-3 py-2">الحالة</th><th class="px-3 py-2"></th>
      </tr></thead><tbody>
      ${emprunts.map((e) => `<tr class="border-t border-orange-100"><td class="px-3 py-2"><strong class="text-slate-900">${e.Livre}</strong><br><span class="text-slate-500">${e.ISBN}</span></td><td class="px-3 py-2">${e.AdherentPrenom} ${e.AdherentNom}</td><td class="px-3 py-2">${fmtDate(e.Date_Emprunt)}</td><td class="px-3 py-2">${fmtDate(e.Date_Retour_Prévue)}</td><td class="px-3 py-2">${fmtDate(e.Date_Retour_Reelle)}</td><td class="px-3 py-2">${badge(e.Statut)}</td><td class="px-3 py-2">${e.Statut === 'قيد الإعارة' || e.Statut === 'متأخر'
          ? `<button class="rounded-xl bg-amber-500/90 px-3 py-1.5 text-xs text-white" onclick="retourEmprunt(${e.ID_Emprunt})">تسجيل العودة</button>`
          : ''}</td></tr>`).join('')}
    </tbody></table>`
    : '<p class="py-8 text-center text-slate-400">لا توجد استعارات — انقر على « استعارة جديدة »</p>';
}

async function loadSettings() {
  const settings = await api('/settings');
  const form = document.getElementById('settings-form');
  const summary = document.getElementById('settings-summary');
  Array.from(form.elements).forEach((field) => {
    if (field.name && settings[field.name] !== undefined) {
      field.value = settings[field.name] || '';
    }
  });
  summary.innerHTML = `
    <div class="font-semibold text-slate-900">${settings.etablissement || 'Établissement'}</div>
    <div class="mt-1">${settings.type || 'Type'} • ${settings.ville || 'Ville'}</div>
    <div class="mt-1 text-xs">${settings.telephone || ''}${settings.email ? ` • ${settings.email}` : ''}</div>
  `;
}

async function saveSettings() {
  const form = document.getElementById('settings-form');
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    await api('/settings', { method: 'PUT', body: JSON.stringify(data) });
    toast('تم حفظ معلومات المؤسسة');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-form').innerHTML = html;
  bindPhotoPreview();
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.add('flex');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('flex');
  editId = null;
}

function bindPhotoPreview() {
  const fileInput = document.querySelector('#modal-form input[name="photo_file"]');
  const preview = document.querySelector('#modal-form #photo-preview');
  if (!fileInput || !preview) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
      preview.src = '';
      preview.classList.add('hidden');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
}

function formatEmplacementLabel(e, compact = false) {
  if (compact) return `طابق ${e.Etage} — صف ${e.Rang}`;
  return `${e.Nom_Categorie || '—'} — طابق ${e.Etage} — صف ${e.Rang}`;
}

function getUniqueCategories() {
  const fromDb = Array.isArray(allCategories) ? allCategories.map((c) => c.Nom_Categorie) : [];
  const fromEmplacements = Array.isArray(allEmplacements) ? allEmplacements.map((e) => e.Nom_Categorie).filter(Boolean) : [];
  return [...new Set([...fromDb, ...fromEmplacements])].sort((a, b) => a.localeCompare(b, 'ar'));
}

function buildEmplacementOptions(emplacements, selectedId = null, compact = false) {
  return emplacements.map(
    (e) => `<option value="${e.ID_Emplacement}" ${selectedId === e.ID_Emplacement ? 'selected' : ''}>${esc(formatEmplacementLabel(e, compact))}</option>`
  ).join('');
}

function renderLivreEmplacementFields(l = null) {
  const categories = getUniqueCategories();
  const selectedCategory = l?.Categorie || '';
  const filtered = selectedCategory
    ? allEmplacements.filter((e) => e.Nom_Categorie === selectedCategory)
    : allEmplacements;

  const categoryOptions = categories.map(
    (cat) => `<option value="${esc(cat)}" ${cat === selectedCategory ? 'selected' : ''}>${esc(cat)}</option>`
  ).join('');

  const emplacementOptions = buildEmplacementOptions(filtered, l?.ID_Emplacement ?? null, Boolean(selectedCategory));
  const noEmplacements = !allEmplacements.length;

  return `
    <div class="form-group"><label>الفئة</label>
      <select name="filter_categorie" id="livre-categorie-filter" onchange="filterEmplacementsInModal(this.value)">
        <option value="">كل الفئات</option>
        ${categoryOptions}
      </select>
      <p class="mt-1 text-xs text-slate-500">اختياري — لتصفية قائمة المواقع حسب الفئة.</p>
    </div>
    <div class="form-group"><label>الموقع *</label>
      <select name="id_emplacement" id="livre-emplacement-select" required ${noEmplacements ? 'disabled' : ''} onchange="syncCategoryFromEmplacement(this.value)">
        <option value="">اختر موقعًا من قاعدة البيانات...</option>
        ${emplacementOptions}
      </select>
      ${noEmplacements
        ? '<p class="mt-2 text-sm text-rose-600">لا توجد مواقع في قاعدة البيانات — أضف موقعًا من قسم « المواقع » أو نفّذ adds.sql.</p>'
        : `<p class="mt-2 text-xs text-slate-500">${allEmplacements.length} موقع متاح (فئة + طابق + صف).</p>`}
    </div>`;
}

function filterEmplacementsInModal(category) {
  const select = document.getElementById('livre-emplacement-select');
  if (!select) return;

  const filtered = category
    ? allEmplacements.filter((e) => e.Nom_Categorie === category)
    : allEmplacements;
  const currentValue = parseInt(select.value, 10) || null;

  select.innerHTML = `<option value="">اختر موقعًا من قاعدة البيانات...</option>${buildEmplacementOptions(
    filtered,
    filtered.some((e) => e.ID_Emplacement === currentValue) ? currentValue : null,
    Boolean(category)
  )}`;
  select.disabled = filtered.length === 0;
}

function syncCategoryFromEmplacement(idEmplacement) {
  const categorySelect = document.getElementById('livre-categorie-filter');
  if (!categorySelect || !idEmplacement) return;

  const emplacement = allEmplacements.find((e) => e.ID_Emplacement === parseInt(idEmplacement, 10));
  if (emplacement?.Nom_Categorie) {
    categorySelect.value = emplacement.Nom_Categorie;
  }
}

function openAddModal() {
  if (currentView === 'emplacements') {
    openAddEmplacementModal();
    return;
  }
  openAddModalAsync();
}

async function openAddModalAsync() {
  editId = null;
  if (currentView === 'livres') {
    await loadEmplacements(true);
    openModal('إضافة كتاب', `
      <div class="form-group"><label>العنوان *</label><input name="titre" required></div>
      <div class="form-group"><label>ISBN *</label><input name="isbn" required placeholder="978-..."></div>
      <div class="form-group"><label>المؤلف *</label><input name="auteur" required></div>
      <div class="form-group"><label>الناشر</label><input name="editeur"></div>
      <div class="form-group"><label>سنة النشر</label><input name="annee_publication" type="number" min="1000" max="2050"></div>
      ${renderLivreEmplacementFields()}
      <div class="form-group"><label>الكمية الإجمالية *</label><input name="quantite_totale" type="number" min="1" value="1" required></div>`);
  } else if (currentView === 'adherents') {
    openModal('إضافة عضو', `
      <div class="form-group"><label>الاسم الأول *</label><input name="prenom" required></div>
      <div class="form-group"><label>الاسم *</label><input name="nom" required></div>
      <div class="form-group"><label>البريد الإلكتروني *</label><input name="email" type="email" required></div>
      <div class="form-group"><label>الهاتف</label><input name="telephone"></div>
      <div class="form-group"><label>صورة العضو</label><input name="photo_file" type="file" accept="image/*"><img id="photo-preview" class="photo-preview hidden" alt="معاينة الصورة"></div>
      <div class="form-group"><label>العنوان</label><input name="adresse"></div>
      <div class="form-group"><label>التخصص</label><input name="specialite"></div>
      <div class="form-group"><label>القسم/الصف</label><input name="classe_section"></div>
      <div class="form-group"><label>تاريخ الانضمام</label><input name="date_adhesion" type="date"></div>
      <div class="form-group"><label>الحالة</label>
        <select name="statut"><option value="نشط">نشط</option><option value="غير نشط">غير نشط</option><option value="موقوف">موقوف</option></select>
      </div>`);
  } else if (currentView === 'emprunts') {
    openEmpruntModal();
  }
}

async function openEmpruntModal() {
  const [livres, adherents] = await Promise.all([api('/livres'), api('/adherents/actifs')]);
  const dispo = livres.filter((l) => l.Quantite_Disponible > 0);

  if (!dispo.length) return toast('لا يوجد كتب متاحة', 'error');
  if (!adherents.length) return toast('لا يوجد أعضاء نشطون', 'error');

  openModal('استعارة جديدة', `
    <div class="form-group"><label>الكتاب *</label>
      <select name="id_livre" required>
        ${dispo.map((l) => `<option value="${l.ID_Livre}">${l.Titre} — ${l.Auteur} (${l.Quantite_Disponible} متاح)</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>العضو *</label>
      <select name="id_adherent" required>
        ${adherents.map((a) => `<option value="${a.ID_Adherent}">${a.Prenom} ${a.Nom}</option>`).join('')}
      </select>
    </div>
    <p style="font-size:0.85rem;color:var(--muted)">مدة الاستعارة: 30 يومًا (قاعدة العمل)</p>`);
}

async function editLivre(id) {
  editId = id;
  await loadEmplacements(true);
  const l = await api(`/livres/${id}`);
  openModal('تعديل الكتاب', `
    <div class="form-group"><label>العنوان *</label><input name="titre" value="${esc(l.Titre)}" required></div>
    <div class="form-group"><label>ISBN *</label><input name="isbn" value="${esc(l.ISBN)}" required></div>
    <div class="form-group"><label>المؤلف *</label><input name="auteur" value="${esc(l.Auteur)}" required></div>
    <div class="form-group"><label>الناشر</label><input name="editeur" value="${esc(l.Editeur || '')}"></div>
    <div class="form-group"><label>السنة</label><input name="annee_publication" type="number" value="${l.Annee_Publication || ''}"></div>
    ${renderLivreEmplacementFields(l)}
    <div class="form-group"><label>الكمية الإجمالية *</label><input name="quantite_totale" type="number" min="1" value="${l.Quantite_Totale}" required></div>`);
}

async function editAdherent(id) {
  editId = id;
  const a = await api(`/adherents/${id}`);
  openModal('تعديل العضو', `
    <div class="form-group"><label>الاسم الأول *</label><input name="prenom" value="${esc(a.Prenom)}" required></div>
    <div class="form-group"><label>الاسم *</label><input name="nom" value="${esc(a.Nom)}" required></div>
    <div class="form-group"><label>البريد الإلكتروني *</label><input name="email" type="email" value="${esc(a.Email)}" required></div>
    <div class="form-group"><label>الهاتف</label><input name="telephone" value="${esc(a.Telephone || '')}"></div>
    <div class="form-group"><label>صورة العضو</label><input name="photo_file" type="file" accept="image/*"><img id="photo-preview" class="photo-preview ${a.Photo_B64 ? '' : 'hidden'}" src="${a.Photo_B64 || ''}" alt="معاينة الصورة"></div>
    <div class="form-group"><label>العنوان</label><input name="adresse" value="${esc(a.Adresse || '')}"></div>
    <div class="form-group"><label>التخصص</label><input name="specialite" value="${esc(a.Specialite || '')}"></div>
    <div class="form-group"><label>القسم/الصف</label><input name="classe_section" value="${esc(a.Classe_Section || '')}"></div>
    <div class="form-group"><label>تاريخ الانضمام</label><input name="date_adhesion" type="date" value="${a.Date_Adhesion ? new Date(a.Date_Adhesion).toISOString().slice(0,10) : ''}"></div>
    <div class="form-group"><label>الحالة</label>
      <select name="statut">
        ${['نشط','غير نشط','موقوف'].map((s) => `<option value="${s}" ${a.Statut===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>`);
}

function esc(s) {
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const fileField = e.target.querySelector('input[name="photo_file"]');
  if (fileField) {
    const file = fileField.files && fileField.files[0];
    if (file) {
      const b64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('Impossible de lire le fichier image'));
        r.readAsDataURL(file);
      });
      fd.set('Photo_B64', b64);
    } else {
      fd.delete('Photo_B64');
    }
  }

  const body = Object.fromEntries([...fd.entries()].filter(([k]) => k !== 'photo_file' && k !== 'filter_categorie' && !(k === 'Photo_B64' && !fd.get('Photo_B64'))));

  if (body.annee_publication) body.annee_publication = parseInt(body.annee_publication, 10);
  if (body.quantite_totale) body.quantite_totale = parseInt(body.quantite_totale, 10);
  if (body.id_livre) body.id_livre = parseInt(body.id_livre, 10);
  if (body.id_adherent) body.id_adherent = parseInt(body.id_adherent, 10);
  if (body.id_emplacement) body.id_emplacement = parseInt(body.id_emplacement, 10);
  if (body.id_categorie) body.id_categorie = parseInt(body.id_categorie, 10);
  if (body.etage) body.etage = parseInt(body.etage, 10);
  delete body.filter_categorie;

  try {
    if (currentView === 'emplacements') {
      if (body.id_categorie) delete body.nom_categorie;
      else delete body.id_categorie;
      if (body.rang) body.rang = String(body.rang).trim().toUpperCase();
      await api('/emplacements', { method: 'POST', body: JSON.stringify(body) });
      toast('تم إضافة الموقع');
      closeModal();
      loadView('emplacements');
      return;
    }
    if (currentView === 'livres') {
      if (!body.id_emplacement) {
        toast('يرجى اختيار موقع من قاعدة البيانات', 'error');
        return;
      }
      if (editId) await api(`/livres/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/livres', { method: 'POST', body: JSON.stringify(body) });
    } else if (currentView === 'adherents') {
      if (editId) await api(`/adherents/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/adherents', { method: 'POST', body: JSON.stringify(body) });
    } else if (currentView === 'emprunts') {
      const res = await api('/emprunts', { method: 'POST', body: JSON.stringify(body) });
      toast(`${res.message} — العودة المتوقعة ${fmtDate(res.date_retour_prevue)}`);
      closeModal();
      loadView('emprunts');
      return;
    }
    toast('تم الحفظ بنجاح');
    closeModal();
    loadView(currentView);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteLivre(id) {
  const result = await Swal.fire({
    title: 'حذف الكتاب؟',
    text: 'هل تريد حذف هذا الكتاب فعلاً؟',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#dc2626',
  });
  if (!result.isConfirmed) return;
  try {
    await api(`/livres/${id}`, { method: 'DELETE' });
    toast('تم حذف الكتاب');
    loadLivres();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteAdherent(id) {
  const result = await Swal.fire({
    title: 'حذف العضو؟',
    text: 'هل تريد حذف هذا العضو فعلاً؟',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#dc2626',
  });
  if (!result.isConfirmed) return;
  try {
    await api(`/adherents/${id}`, { method: 'DELETE' });
    toast('تم حذف العضو');
    loadAdherents();
  } catch (err) { toast(err.message, 'error'); }
}

async function retourEmprunt(id) {
  const result = await Swal.fire({
    title: 'تأكيد العودة؟',
    text: 'هل تريد تأكيد إرجاع هذا الكتاب؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'نعم، أكّد',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#10b981',
  });
  if (!result.isConfirmed) return;
  try {
    await api(`/emprunts/${id}/retour`, { method: 'POST' });
    toast('تم تسجيل العودة');
    loadEmprunts();
  } catch (err) { toast(err.message, 'error'); }
}

window.editLivre = editLivre;
window.editAdherent = editAdherent;
window.deleteLivre = deleteLivre;
window.deleteAdherent = deleteAdherent;
window.retourEmprunt = retourEmprunt;
window.changeLivresPage = changeLivresPage;
window.filterLivresByCategory = filterLivresByCategory;
window.filterAdherentsByStatus = filterAdherentsByStatus;
window.printLivresList = printLivresList;
window.printAdherentsList = printAdherentsList;
window.printAdherent = printAdherent;

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Impossible de lire le QR code'));
    reader.readAsDataURL(blob);
  });
}

async function getAdherentQrSrc(adh) {
  if (adh.QRCode_B64) return adh.QRCode_B64;
  const res = await fetch(`${API}/adherents/${adh.ID_Adherent}/qrcode`);
  if (!res.ok) throw new Error('Impossible de générer le QR code');
  return blobToDataUrl(await res.blob());
}

async function printAdherent(id) {
  try {
    const adh = await api(`/adherents/${id}`);
    if (!adh) return toast('Adhérent introuvable', 'error');

    const photoHtml = adh.Photo_B64
      ? `<img src="${adh.Photo_B64}" alt="Photo adhérent" class="photo-print"/>`
      : `<div class="photo-print empty">صورة</div>`;

    const qrSrc = await getAdherentQrSrc(adh);
    const qrHtml = `<img src="${qrSrc}" alt="QR Code" class="qr-print"/>`;

    const html = `
      <div class="print-card">
        <div class="print-card__header">
          <div>
            <div class="print-card__title">بطاقة الانخراط</div>
            <div class="print-card__subtitle">${esc(adh.Prenom)} ${esc(adh.Nom)}</div>
          </div>
          ${qrHtml}
        </div>
        <div class="print-card__body">
          <div class="print-card__photo">${photoHtml}</div>
          <div class="print-card__info">
            <div class="print-card__row"><span class="label">رقم البطاقة</span><span>${esc(adh.Numero_Carte || '—')}</span></div>
            <div class="print-card__row"><span class="label">القسم</span><span>${esc(adh.Classe_Section || '—')}</span></div>
            <div class="print-card__row"><span class="label">التخصص</span><span>${esc(adh.Specialite || '—')}</span></div>
            <div class="print-card__row"><span class="label">الهاتف</span><span>${esc(adh.Telephone || '—')}</span></div>
            <div class="print-card__row"><span class="label">البريد</span><span>${esc(adh.Email || '—')}</span></div>
            <div class="print-card__row"><span class="label">تاريخ الانضمام</span><span>${fmtDate(adh.Date_Adhesion)}</span></div>
          </div>
        </div>
      </div>`;

    const template = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بطاقة العضو</title><style>
      body{margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#111827;}
      .print-card{width:360px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 16px 40px rgba(15,23,42,.08);overflow:hidden;}
      .print-card__header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:#f97316;color:#fff;gap:12px;}
      .print-card__title{font-size:1.1rem;font-weight:700;letter-spacing:.02em;}
      .print-card__subtitle{margin-top:6px;font-size:.95rem;font-weight:600;opacity:.92;}
      .print-card__body{display:grid;grid-template-columns:110px 1fr;gap:16px;padding:18px 20px;}
      .print-card__photo{width:110px;height:110px;border-radius:18px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;}
      .photo-print{width:100%;height:100%;object-fit:cover;display:block;}
      .photo-print.empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:.95rem;color:#94a3b8;background:#f8fafc;}
      .print-card__info{display:flex;flex-direction:column;gap:10px;font-size:.9rem;color:#1f2937;}
      .print-card__row{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:14px;background:#f8fafc;}
      .label{color:#475569;font-size:.8rem;}
      .qr-print{width:88px;height:88px;border-radius:16px;background:#fff;object-fit:contain;display:block;border:1px solid rgba(15,23,42,.08);}
      @media print{body{padding:0;} .print-card{box-shadow:none;border-color:#d1d5db;}}
    </style></head><body>${html}<script>
      const imgs = Array.from(document.querySelectorAll('img'));
      let loaded = 0;
      const tryPrint = () => { if (loaded >= imgs.length) window.print(); };
      if (!imgs.length) return window.print();
      imgs.forEach((img) => {
        if (img.complete) { loaded += 1; tryPrint(); }
        else {
          img.onload = () => { loaded += 1; tryPrint(); };
          img.onerror = () => { loaded += 1; tryPrint(); };
        }
      });
      setTimeout(tryPrint, 800);
    </script></body></html>`;

    const w = window.open('', '_blank', 'width=420,height=620');
    if (!w) return toast('Impossible d’ouvrir la fenêtre d’impression', 'error');
    w.document.write(template);
    w.document.close();
  } catch {
    toast('خطأ في جلب بيانات العضو', 'error');
  }
}

async function checkHealth() {
  const el = document.getElementById('db-status');
  try {
    const h = await api('/health');
    el.textContent = `متصل — ${h.database}`;
    el.classList.add('ok');
  } catch {
    el.textContent = 'قاعدة البيانات غير متاحة';
    el.classList.add('error');
  }
}

checkHealth();
loadDashboard();
loadSettings();
// load emplacements for livre modal
loadEmplacements();

async function loadEmplacements(showError = false) {
  try {
    const emps = await api('/emplacements');
    allEmplacements = Array.isArray(emps) ? emps : [];
  } catch (err) {
    allEmplacements = [];
    if (showError) toast(`تعذّر تحميل المواقع: ${err.message}`, 'error');
  }

  try {
    const cats = await api('/emplacements/categories');
    allCategories = Array.isArray(cats) ? cats : [];
  } catch (_) {
    const seen = new Map();
    allEmplacements.forEach((e) => {
      if (e.ID_Categorie && e.Nom_Categorie) {
        seen.set(e.ID_Categorie, { ID_Categorie: e.ID_Categorie, Nom_Categorie: e.Nom_Categorie });
      }
    });
    allCategories = [...seen.values()];
  }
}

async function loadEmplacementsView() {
  await loadEmplacements();
  renderEmplacementsTable();
}

function renderEmplacementsTable() {
  const container = document.getElementById('emplacements-table');
  if (!container) return;

  if (!allEmplacements.length) {
    container.innerHTML = '<p class="py-8 text-center text-slate-400">لا توجد مواقع — انقر على « إضافة موقع »</p>';
    return;
  }

  container.innerHTML = `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
      <th class="px-4 py-3">الفئة</th><th class="px-4 py-3">الطابق</th><th class="px-4 py-3">الصف</th><th class="px-4 py-3">عدد الكتب</th><th class="px-4 py-3"></th>
    </tr></thead><tbody>
    ${allEmplacements.map((e) => `<tr class="border-t border-orange-100">
      <td class="px-4 py-3"><span class="rounded-xl bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">${esc(e.Nom_Categorie || '—')}</span></td>
      <td class="px-4 py-3">${e.Etage}</td>
      <td class="px-4 py-3">${esc(e.Rang)}</td>
      <td class="px-4 py-3">${e.Nb_Livres ?? 0}</td>
      <td class="px-4 py-3"><button class="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs text-white disabled:opacity-40" ${e.Nb_Livres > 0 ? 'disabled title="موقع يحتوي على كتب"' : ''} onclick="deleteEmplacement(${e.ID_Emplacement})">حذف</button></td>
    </tr>`).join('')}
  </tbody></table>`;
}

async function openAddEmplacementModal() {
  await loadEmplacements();
  const categories = getUniqueCategories();
  const categoryOptions = categories.map((cat) => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');

  openModal('إضافة موقع', `
    <div class="form-group"><label>الفئة *</label>
      <select name="id_categorie" id="emplacement-categorie-select" onchange="toggleNewCategoryField(this.value)">
        <option value="">— فئة جديدة —</option>
        ${allCategories.map((c) => `<option value="${c.ID_Categorie}">${esc(c.Nom_Categorie)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" id="new-category-group">
      <label>اسم الفئة الجديدة *</label>
      <input name="nom_categorie" list="emplacement-categories-list" placeholder="مثال: تاريخ">
      <datalist id="emplacement-categories-list">${categoryOptions}</datalist>
    </div>
    <div class="form-group"><label>الصف (A–Z) *</label><input name="rang" required maxlength="1" placeholder="A" pattern="[A-Za-z]" style="text-transform:uppercase"></div>
    <div class="form-group"><label>الطابق (1–20) *</label><input name="etage" type="number" min="1" max="20" required value="1"></div>
    <p class="text-xs text-slate-500">كل موقع = فئة + طابق + صف (حسب قاعدة البيانات).</p>`);
}

function toggleNewCategoryField(value) {
  const group = document.getElementById('new-category-group');
  const input = document.querySelector('#modal-form input[name="nom_categorie"]');
  if (!group || !input) return;
  if (value) {
    group.classList.add('hidden');
    input.removeAttribute('required');
    input.value = '';
  } else {
    group.classList.remove('hidden');
    input.setAttribute('required', 'required');
  }
}

async function deleteEmplacement(id) {
  const result = await Swal.fire({
    title: 'حذف الموقع؟',
    text: 'لا يمكن التراجع عن هذا الإجراء',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'حذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#dc2626',
  });
  if (!result.isConfirmed) return;

  try {
    await api(`/emplacements/${id}`, { method: 'DELETE' });
    toast('تم حذف الموقع');
    loadView('emplacements');
  } catch (err) {
    toast(err.message, 'error');
  }
}

window.filterEmplacementsInModal = filterEmplacementsInModal;
window.syncCategoryFromEmplacement = syncCategoryFromEmplacement;
window.toggleNewCategoryField = toggleNewCategoryField;
window.deleteEmplacement = deleteEmplacement;
