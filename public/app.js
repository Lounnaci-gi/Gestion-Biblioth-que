const API = '/api';
let currentView = 'dashboard';
let editId = null;
const Swal = window.Swal;

let livresCurrentPage = 1;
const LIVRES_PER_PAGE = 20;
let allLivres = [];
let livresSelectedCategory = '';
let allEmplacements = [];

const titles = {
  dashboard: 'لوحة التحكم',
  livres: 'فهرس الكتب',
  adherents: 'الأعضاء',
  emprunts: 'الاستعارات',
  settings: 'المعلومات',
};

const addLabels = {
  livres: '+ إضافة كتاب',
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

function renderLivresTable() {
  const container = document.getElementById('livres-table');
  if (!allLivres.length) {
    container.innerHTML = '<p class="py-8 text-center text-slate-400">لا يوجد كتب — انقر على « إضافة كتاب »</p>';
    return;
  }

  const filteredLivres = livresSelectedCategory
    ? allLivres.filter(l => l.Categorie === livresSelectedCategory)
    : allLivres;

  const totalPages = Math.ceil(filteredLivres.length / LIVRES_PER_PAGE);
  if (livresCurrentPage > totalPages) livresCurrentPage = totalPages;
  if (livresCurrentPage < 1) livresCurrentPage = 1;

  const start = (livresCurrentPage - 1) * LIVRES_PER_PAGE;
  const end = start + LIVRES_PER_PAGE;
  const pageLivres = filteredLivres.slice(start, end);

  let html = `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
      <th class="px-3 py-2">العنوان</th><th class="px-3 py-2">الفئة</th><th class="px-3 py-2">المؤلف</th><th class="px-3 py-2">ISBN</th><th class="px-3 py-2">السنة</th><th class="px-3 py-2">المخزون</th><th class="px-3 py-2">المتاح</th><th class="px-3 py-2">الإنشاء / التحديث</th><th class="px-3 py-2"></th>
    </tr></thead><tbody>
    ${pageLivres.map((l) => `<tr class="border-t border-orange-100">
      <td class="px-3 py-2"><strong class="text-slate-900">${l.Titre}</strong>${l.Editeur ? `<br><span class="text-slate-500">${l.Editeur}</span>` : ''}</td>
      <td class="px-3 py-2"><span class="rounded-xl bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">${l.Categorie ? esc(l.Categorie) : '—'}</span></td>
      <td class="px-3 py-2">${l.Auteur}</td>
      <td class="px-3 py-2">${l.ISBN}</td>
      <td class="px-3 py-2">${l.Annee_Publication || '—'}</td>
      <td class="px-3 py-2">${l.Quantite_Totale}</td>
      <td class="px-3 py-2">${l.Quantite_Disponible}</td>
      <td class="px-3 py-2"><div class="text-xs text-slate-500">إنشاء: ${fmtDate(l.Date_Creation)}</div><div class="text-xs text-slate-400">تحديث: ${fmtDate(l.Date_Modification)}</div></td>
      <td class="px-3 py-2"><div class="flex justify-end gap-2"><button class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-slate-700" onclick="editLivre(${l.ID_Livre})">تعديل</button><button class="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs text-white" onclick="deleteLivre(${l.ID_Livre})">حذف</button></div></td>
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
}

function changeLivresPage(page) {
  livresCurrentPage = page;
  renderLivresTable();
}

async function loadAdherents() {
  const adherents = await api('/adherents');
  document.getElementById('adherents-table').innerHTML = adherents.length
    ? `<table class="min-w-full wide-table text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
        <th class="px-3 py-2">الصورة</th><th class="px-3 py-2">عضو</th><th class="px-3 py-2">البريد الإلكتروني</th><th class="px-3 py-2">الهاتف</th><th class="px-3 py-2">العنوان</th><th class="px-3 py-2">التخصص</th><th class="px-3 py-2">القسم</th><th class="px-3 py-2">تاريخ الانضمام</th><th class="px-3 py-2">الحالة</th><th class="px-3 py-2">آخر تحديث</th><th class="px-3 py-2"></th>
      </tr></thead><tbody>
      ${adherents.map((a) => {
        const photoHtml = a.Has_Photo
          ? `<img src="${API}/adherents/${a.ID_Adherent}/photo" alt="${a.Prenom} ${a.Nom}" class="adherent-photo-cell"/>`
          : `<span class="adherent-photo-cell empty-avatar">صورة</span>`;
        return `<tr class="border-t border-orange-100"><td class="px-3 py-2">${photoHtml}</td><td class="px-3 py-2"><div class="inline-flex items-center gap-3"><div><strong class="text-slate-900">${a.Prenom} ${a.Nom}</strong><div class="text-xs text-slate-500">${a.Numero_Carte || '—'}</div></div></div></td><td class="px-3 py-2">${a.Email}</td><td class="px-3 py-2">${a.Telephone || '—'}</td><td class="px-3 py-2">${a.Adresse || '—'}</td><td class="px-3 py-2">${a.Specialite || '—'}</td><td class="px-3 py-2">${a.Classe_Section || '—'}</td><td class="px-3 py-2">${fmtDate(a.Date_Adhesion)}</td><td class="px-3 py-2">${badge(a.Statut)}</td><td class="px-3 py-2 text-xs text-slate-500">${fmtDate(a.Date_Modification)}</td><td class="px-3 py-2"><div class="flex justify-end gap-2"><button class="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-slate-700" onclick="printAdherent(${a.ID_Adherent})">طباعة البطاقة</button><button class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-slate-700" onclick="editAdherent(${a.ID_Adherent})">تعديل</button><button class="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs text-white" onclick="deleteAdherent(${a.ID_Adherent})">حذف</button></div></td></tr>`;
      }).join('')}
    </tbody></table>`
    : '<p class="py-8 text-center text-slate-400">لا يوجد أعضاء — انقر على « إضافة عضو »</p>';
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

function openAddModal() {
  editId = null;
  if (currentView === 'livres') {
    openModal('إضافة كتاب', `
      <div class="form-group"><label>العنوان *</label><input name="titre" required></div>
      <div class="form-group"><label>ISBN *</label><input name="isbn" required placeholder="978-..."></div>
      <div class="form-group"><label>المؤلف *</label><input name="auteur" required></div>
      <div class="form-group"><label>الناشر</label><input name="editeur"></div>
      <div class="form-group"><label>سنة النشر</label><input name="annee_publication" type="number" min="1000" max="2050"></div>
      <div class="form-group"><label>الموقع (اختياري)</label>
        <select name="id_emplacement">
          <option value="">اختر موقعًا...</option>
          ${allEmplacements.map(e => `<option value="${e.ID_Emplacement}">${esc(e.Nom_Categorie || '—')} — طابق ${e.Etage} صف ${esc(e.Rang)}</option>`).join('')}
        </select>
        <div style="margin-top:6px;font-size:0.85rem;color:var(--muted)">أو أدخل اسم الفئة لإنشاء موقع جديد:</div>
        <input name="categorie" list="categories-list" placeholder="اختر أو اكتب فئة...">
        <datalist id="categories-list">
          <option value="رواية">
          <option value="تاريخ">
          <option value="علوم">
          <option value="أطفال">
          <option value="شعر">
          <option value="فلسفة">
        </datalist>
      </div>
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
  const l = await api(`/livres/${id}`);
  openModal('تعديل الكتاب', `
    <div class="form-group"><label>العنوان *</label><input name="titre" value="${esc(l.Titre)}" required></div>
    <div class="form-group"><label>ISBN *</label><input name="isbn" value="${esc(l.ISBN)}" required></div>
    <div class="form-group"><label>المؤلف *</label><input name="auteur" value="${esc(l.Auteur)}" required></div>
    <div class="form-group"><label>الناشر</label><input name="editeur" value="${esc(l.Editeur || '')}"></div>
    <div class="form-group"><label>السنة</label><input name="annee_publication" type="number" value="${l.Annee_Publication || ''}"></div>
    <div class="form-group"><label>الموقع (اختياري)</label>
      <select name="id_emplacement">
        <option value="">اختر موقعًا...</option>
        ${allEmplacements.map(e => `<option value="${e.ID_Emplacement}" ${l.ID_Emplacement===e.ID_Emplacement ? 'selected' : ''}>${esc(e.Nom_Categorie || '—')} — طابق ${e.Etage} صف ${esc(e.Rang)}</option>`).join('')}
      </select>
      <div style="margin-top:6px;font-size:0.85rem;color:var(--muted)">أو أدخل اسم الفئة لإنشاء موقع جديد:</div>
      <input name="categorie" list="categories-list" value="${esc(l.Categorie || '')}" placeholder="اختر أو اكتب فئة...">
      <datalist id="categories-list">
        <option value="رواية">
        <option value="تاريخ">
        <option value="علوم">
        <option value="أطفال">
        <option value="شعر">
        <option value="فلسفة">
      </datalist>
    </div>
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

  const body = Object.fromEntries([...fd.entries()].filter(([k]) => k !== 'photo_file' && !(k === 'Photo_B64' && !fd.get('Photo_B64'))));

  if (body.annee_publication) body.annee_publication = parseInt(body.annee_publication, 10);
  if (body.quantite_totale) body.quantite_totale = parseInt(body.quantite_totale, 10);
  if (body.id_livre) body.id_livre = parseInt(body.id_livre, 10);
  if (body.id_adherent) body.id_adherent = parseInt(body.id_adherent, 10);
  if (body.id_emplacement) body.id_emplacement = parseInt(body.id_emplacement, 10);

  try {
    if (currentView === 'livres') {
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

async function loadEmplacements() {
  try {
    allEmplacements = await api('/emplacements');
  } catch (err) {
    allEmplacements = [];
  }
}
