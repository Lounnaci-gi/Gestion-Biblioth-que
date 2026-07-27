const API = '/api';
let currentView = 'dashboard';
let editId = null;
const Swal = window.Swal;

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
  return new Date(d).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(statut) {
  const map = {
    Actif: 'نشط',
    Inactif: 'غير نشط',
    Suspendu: 'معلق',
    'En cours': 'قيد الإجراء',
    Retard: 'متأخر',
    Rendu: 'مُعاد',
    Rendue: 'مُعاد',
  };
  return map[statut] || statut || '—';
}

function statusClass(statut) {
  const value = String(statut || '').toLowerCase();
  if (value.includes('actif') || value.includes('نشط')) return 'actif';
  if (value.includes('inactif') || value.includes('غير نشط')) return 'inactif';
  if (value.includes('suspendu') || value.includes('معلق')) return 'suspendu';
  if (value.includes('retard') || value.includes('متأخر')) return 'retard';
  if (value.includes('rendu') || value.includes('مُعاد')) return 'rendu';
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
  const livres = await api('/livres');
  document.getElementById('livres-table').innerHTML = livres.length
    ? `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
        <th class="px-3 py-2">العنوان</th><th class="px-3 py-2">المؤلف</th><th class="px-3 py-2">ISBN</th><th class="px-3 py-2">السنة</th><th class="px-3 py-2">المخزون</th><th class="px-3 py-2">المتاح</th><th class="px-3 py-2">الإنشاء / التحديث</th><th class="px-3 py-2"></th>
      </tr></thead><tbody>
      ${livres.map((l) => `<tr class="border-t border-orange-100"><td class="px-3 py-2"><strong class="text-slate-900">${l.Titre}</strong>${l.Editeur ? `<br><span class="text-slate-500">${l.Editeur}</span>` : ''}</td><td class="px-3 py-2">${l.Auteur}</td><td class="px-3 py-2">${l.ISBN}</td><td class="px-3 py-2">${l.Annee_Publication || '—'}</td><td class="px-3 py-2">${l.Quantite_Totale}</td><td class="px-3 py-2">${l.Quantite_Disponible}</td><td class="px-3 py-2"><div class="text-xs text-slate-500">إنشاء: ${fmtDate(l.Date_Creation)}</div><div class="text-xs text-slate-400">تحديث: ${fmtDate(l.Date_Modification)}</div></td><td class="px-3 py-2"><div class="flex justify-end gap-2"><button class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-slate-700" onclick="editLivre(${l.ID_Livre})">تعديل</button><button class="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs text-white" onclick="deleteLivre(${l.ID_Livre})">حذف</button></div></td></tr>`).join('')}
    </tbody></table>`
    : '<p class="py-8 text-center text-slate-400">لا يوجد كتب — انقر على « إضافة كتاب »</p>';
}

async function loadAdherents() {
  const adherents = await api('/adherents');
  document.getElementById('adherents-table').innerHTML = adherents.length
    ? `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
        <th class="px-3 py-2">الاسم</th><th class="px-3 py-2">البريد الإلكتروني</th><th class="px-3 py-2">الهاتف</th><th class="px-3 py-2">تاريخ الانضمام</th><th class="px-3 py-2">الحالة</th><th class="px-3 py-2">آخر تحديث</th><th class="px-3 py-2"></th>
      </tr></thead><tbody>
      ${adherents.map((a) => `<tr class="border-t border-orange-100"><td class="px-3 py-2"><strong class="text-slate-900">${a.Prenom} ${a.Nom}</strong></td><td class="px-3 py-2">${a.Email}</td><td class="px-3 py-2">${a.Telephone || '—'}</td><td class="px-3 py-2">${fmtDate(a.Date_Adhesion)}</td><td class="px-3 py-2">${badge(a.Statut)}</td><td class="px-3 py-2 text-xs text-slate-500">${fmtDate(a.Date_Modification)}</td><td class="px-3 py-2"><div class="flex justify-end gap-2"><button class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-slate-700" onclick="editAdherent(${a.ID_Adherent})">تعديل</button><button class="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs text-white" onclick="deleteAdherent(${a.ID_Adherent})">حذف</button></div></td></tr>`).join('')}
    </tbody></table>`
    : '<p class="py-8 text-center text-slate-400">لا يوجد أعضاء — انقر على « إضافة عضو »</p>';
}

async function loadEmprunts() {
  const emprunts = await api('/emprunts');
  document.getElementById('emprunts-table').innerHTML = emprunts.length
    ? `<table class="min-w-full text-sm text-slate-600"><thead><tr class="text-right text-slate-500">
        <th class="px-3 py-2">الكتاب</th><th class="px-3 py-2">العضو</th><th class="px-3 py-2">الاستعارة</th><th class="px-3 py-2">العودة المتوقعة</th><th class="px-3 py-2">العودة الفعلية</th><th class="px-3 py-2">الحالة</th><th class="px-3 py-2"></th>
      </tr></thead><tbody>
      ${emprunts.map((e) => `<tr class="border-t border-orange-100"><td class="px-3 py-2"><strong class="text-slate-900">${e.Livre}</strong><br><span class="text-slate-500">${e.ISBN}</span></td><td class="px-3 py-2">${e.AdherentPrenom} ${e.AdherentNom}</td><td class="px-3 py-2">${fmtDate(e.Date_Emprunt)}</td><td class="px-3 py-2">${fmtDate(e.Date_Retour_Prévue)}</td><td class="px-3 py-2">${fmtDate(e.Date_Retour_Reelle)}</td><td class="px-3 py-2">${badge(e.Statut)}</td><td class="px-3 py-2">${e.Statut === 'En cours' || e.Statut === 'Retard'
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
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.add('flex');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('flex');
  editId = null;
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
      <div class="form-group"><label>الكمية الإجمالية *</label><input name="quantite_totale" type="number" min="1" value="1" required></div>`);
  } else if (currentView === 'adherents') {
    openModal('إضافة عضو', `
      <div class="form-group"><label>الاسم الأول *</label><input name="prenom" required></div>
      <div class="form-group"><label>الاسم *</label><input name="nom" required></div>
      <div class="form-group"><label>البريد الإلكتروني *</label><input name="email" type="email" required></div>
      <div class="form-group"><label>الهاتف</label><input name="telephone"></div>
      <div class="form-group"><label>الحالة</label>
        <select name="statut"><option value="Actif">نشط</option><option value="Inactif">غير نشط</option><option value="Suspendu">معلق</option></select>
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
    <div class="form-group"><label>الكمية الإجمالية *</label><input name="quantite_totale" type="number" min="1" value="${l.Quantite_Totale}" required></div>`);
}

async function editAdherent(id) {
  editId = id;
  const a = await api(`/adherents`).then((list) => list.find((x) => x.ID_Adherent === id));
  openModal('تعديل العضو', `
    <div class="form-group"><label>الاسم الأول *</label><input name="prenom" value="${esc(a.Prenom)}" required></div>
    <div class="form-group"><label>الاسم *</label><input name="nom" value="${esc(a.Nom)}" required></div>
    <div class="form-group"><label>البريد الإلكتروني *</label><input name="email" type="email" value="${esc(a.Email)}" required></div>
    <div class="form-group"><label>الهاتف</label><input name="telephone" value="${esc(a.Telephone || '')}"></div>
    <div class="form-group"><label>الحالة</label>
      <select name="statut">
        ${['Actif','Inactif','Suspendu'].map((s) => `<option value="${s}" ${a.Statut===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>`);
}

function esc(s) {
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());

  if (body.annee_publication) body.annee_publication = parseInt(body.annee_publication, 10);
  if (body.quantite_totale) body.quantite_totale = parseInt(body.quantite_totale, 10);
  if (body.id_livre) body.id_livre = parseInt(body.id_livre, 10);
  if (body.id_adherent) body.id_adherent = parseInt(body.id_adherent, 10);

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
