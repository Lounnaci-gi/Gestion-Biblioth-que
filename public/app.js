const API = '/api';
let currentView = 'dashboard';
let editId = null;

const titles = {
  dashboard: 'Tableau de bord',
  livres: 'Catalogue des livres',
  adherents: 'Adhérents',
  emprunts: 'Emprunts',
};

const addLabels = {
  livres: '+ Ajouter un livre',
  adherents: '+ Ajouter un adhérent',
  emprunts: '+ Nouvel emprunt',
};

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('btn-add').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
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
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  setTimeout(() => el.classList.add('hidden'), 3500);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badge(statut) {
  const cls = statut.toLowerCase().replace(' ', '-').replace('é', 'e');
  return `<span class="badge badge-${cls}">${statut}</span>`;
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
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadDashboard() {
  const [stats, emprunts] = await Promise.all([api('/stats'), api('/emprunts')]);

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="label">Titres</div><div class="value">${stats.total_livres}</div></div>
    <div class="stat-card"><div class="label">Exemplaires</div><div class="value">${stats.total_exemplaires}</div></div>
    <div class="stat-card"><div class="label">Disponibles</div><div class="value">${stats.exemplaires_disponibles}</div></div>
    <div class="stat-card"><div class="label">Adhérents actifs</div><div class="value">${stats.adherents_actifs}</div></div>
    <div class="stat-card"><div class="label">Emprunts en cours</div><div class="value">${stats.emprunts_en_cours}</div></div>
    <div class="stat-card ${stats.emprunts_en_retard > 0 ? 'warning' : ''}">
      <div class="label">En retard</div><div class="value">${stats.emprunts_en_retard}</div>
    </div>`;

  const recent = emprunts.slice(0, 5);
  document.getElementById('recent-emprunts').innerHTML = recent.length
    ? `<table><thead><tr><th>Livre</th><th>Adhérent</th><th>Date</th><th>Statut</th></tr></thead><tbody>
      ${recent.map((e) => `<tr>
        <td>${e.Livre}</td>
        <td>${e.AdherentPrenom} ${e.AdherentNom}</td>
        <td>${fmtDate(e.Date_Emprunt)}</td>
        <td>${badge(e.Statut)}</td>
      </tr>`).join('')}
    </tbody></table>`
    : '<p class="empty-state">Aucun emprunt enregistré</p>';
}

async function loadLivres() {
  const livres = await api('/livres');
  document.getElementById('livres-table').innerHTML = livres.length
    ? `<table><thead><tr>
        <th>Titre</th><th>Auteur</th><th>ISBN</th><th>Année</th><th>Stock</th><th>Disponible</th><th></th>
      </tr></thead><tbody>
      ${livres.map((l) => `<tr>
        <td><strong>${l.Titre}</strong>${l.Editeur ? `<br><small style="color:var(--muted)">${l.Editeur}</small>` : ''}</td>
        <td>${l.Auteur}</td>
        <td>${l.ISBN}</td>
        <td>${l.Annee_Publication || '—'}</td>
        <td>${l.Quantite_Totale}</td>
        <td>${l.Quantite_Disponible}</td>
        <td class="actions">
          <button class="btn btn-sm btn-ghost" onclick="editLivre(${l.ID_Livre})">Modifier</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLivre(${l.ID_Livre})">Supprimer</button>
        </td>
      </tr>`).join('')}
    </tbody></table>`
    : '<p class="empty-state">Aucun livre — cliquez sur « Ajouter un livre »</p>';
}

async function loadAdherents() {
  const adherents = await api('/adherents');
  document.getElementById('adherents-table').innerHTML = adherents.length
    ? `<table><thead><tr>
        <th>Nom</th><th>Email</th><th>Téléphone</th><th>Adhésion</th><th>Statut</th><th></th>
      </tr></thead><tbody>
      ${adherents.map((a) => `<tr>
        <td><strong>${a.Prenom} ${a.Nom}</strong></td>
        <td>${a.Email}</td>
        <td>${a.Telephone || '—'}</td>
        <td>${fmtDate(a.Date_Adhesion)}</td>
        <td>${badge(a.Statut)}</td>
        <td class="actions">
          <button class="btn btn-sm btn-ghost" onclick="editAdherent(${a.ID_Adherent})">Modifier</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAdherent(${a.ID_Adherent})">Supprimer</button>
        </td>
      </tr>`).join('')}
    </tbody></table>`
    : '<p class="empty-state">Aucun adhérent — cliquez sur « Ajouter un adhérent »</p>';
}

async function loadEmprunts() {
  const emprunts = await api('/emprunts');
  document.getElementById('emprunts-table').innerHTML = emprunts.length
    ? `<table><thead><tr>
        <th>Livre</th><th>Adhérent</th><th>Emprunt</th><th>Retour prévu</th><th>Retour réel</th><th>Statut</th><th></th>
      </tr></thead><tbody>
      ${emprunts.map((e) => `<tr>
        <td><strong>${e.Livre}</strong><br><small style="color:var(--muted)">${e.ISBN}</small></td>
        <td>${e.AdherentPrenom} ${e.AdherentNom}</td>
        <td>${fmtDate(e.Date_Emprunt)}</td>
        <td>${fmtDate(e.Date_Retour_Prévue)}</td>
        <td>${fmtDate(e.Date_Retour_Reelle)}</td>
        <td>${badge(e.Statut)}</td>
        <td>${e.Statut === 'En cours' || e.Statut === 'Retard'
          ? `<button class="btn btn-sm btn-accent" onclick="retourEmprunt(${e.ID_Emprunt})">Enregistrer retour</button>`
          : ''}</td>
      </tr>`).join('')}
    </tbody></table>`
    : '<p class="empty-state">Aucun emprunt — cliquez sur « Nouvel emprunt »</p>';
}

function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-form').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editId = null;
}

function openAddModal() {
  editId = null;
  if (currentView === 'livres') {
    openModal('Ajouter un livre', `
      <div class="form-group"><label>Titre *</label><input name="titre" required></div>
      <div class="form-group"><label>ISBN *</label><input name="isbn" required placeholder="978-..."></div>
      <div class="form-group"><label>Auteur *</label><input name="auteur" required></div>
      <div class="form-group"><label>Éditeur</label><input name="editeur"></div>
      <div class="form-group"><label>Année de publication</label><input name="annee_publication" type="number" min="1000" max="2050"></div>
      <div class="form-group"><label>Quantité totale *</label><input name="quantite_totale" type="number" min="1" value="1" required></div>`);
  } else if (currentView === 'adherents') {
    openModal('Ajouter un adhérent', `
      <div class="form-group"><label>Prénom *</label><input name="prenom" required></div>
      <div class="form-group"><label>Nom *</label><input name="nom" required></div>
      <div class="form-group"><label>Email *</label><input name="email" type="email" required></div>
      <div class="form-group"><label>Téléphone</label><input name="telephone"></div>
      <div class="form-group"><label>Statut</label>
        <select name="statut"><option value="Actif">Actif</option><option value="Inactif">Inactif</option><option value="Suspendu">Suspendu</option></select>
      </div>`);
  } else if (currentView === 'emprunts') {
    openEmpruntModal();
  }
}

async function openEmpruntModal() {
  const [livres, adherents] = await Promise.all([api('/livres'), api('/adherents/actifs')]);
  const dispo = livres.filter((l) => l.Quantite_Disponible > 0);

  if (!dispo.length) return toast('Aucun livre disponible', 'error');
  if (!adherents.length) return toast('Aucun adhérent actif', 'error');

  openModal('Nouvel emprunt', `
    <div class="form-group"><label>Livre *</label>
      <select name="id_livre" required>
        ${dispo.map((l) => `<option value="${l.ID_Livre}">${l.Titre} — ${l.Auteur} (${l.Quantite_Disponible} dispo.)</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Adhérent *</label>
      <select name="id_adherent" required>
        ${adherents.map((a) => `<option value="${a.ID_Adherent}">${a.Prenom} ${a.Nom}</option>`).join('')}
      </select>
    </div>
    <p style="font-size:0.85rem;color:var(--muted)">Durée d'emprunt : 30 jours (règle métier)</p>`);
}

async function editLivre(id) {
  editId = id;
  const l = await api(`/livres/${id}`);
  openModal('Modifier le livre', `
    <div class="form-group"><label>Titre *</label><input name="titre" value="${esc(l.Titre)}" required></div>
    <div class="form-group"><label>ISBN *</label><input name="isbn" value="${esc(l.ISBN)}" required></div>
    <div class="form-group"><label>Auteur *</label><input name="auteur" value="${esc(l.Auteur)}" required></div>
    <div class="form-group"><label>Éditeur</label><input name="editeur" value="${esc(l.Editeur || '')}"></div>
    <div class="form-group"><label>Année</label><input name="annee_publication" type="number" value="${l.Annee_Publication || ''}"></div>
    <div class="form-group"><label>Quantité totale *</label><input name="quantite_totale" type="number" min="1" value="${l.Quantite_Totale}" required></div>`);
}

async function editAdherent(id) {
  editId = id;
  const a = await api(`/adherents`).then((list) => list.find((x) => x.ID_Adherent === id));
  openModal('Modifier l\'adhérent', `
    <div class="form-group"><label>Prénom *</label><input name="prenom" value="${esc(a.Prenom)}" required></div>
    <div class="form-group"><label>Nom *</label><input name="nom" value="${esc(a.Nom)}" required></div>
    <div class="form-group"><label>Email *</label><input name="email" type="email" value="${esc(a.Email)}" required></div>
    <div class="form-group"><label>Téléphone</label><input name="telephone" value="${esc(a.Telephone || '')}"></div>
    <div class="form-group"><label>Statut</label>
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
      toast(`${res.message} — retour prévu le ${fmtDate(res.date_retour_prevue)}`);
      closeModal();
      loadView('emprunts');
      return;
    }
    toast('Enregistré avec succès');
    closeModal();
    loadView(currentView);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteLivre(id) {
  if (!confirm('Supprimer ce livre ?')) return;
  try {
    await api(`/livres/${id}`, { method: 'DELETE' });
    toast('Livre supprimé');
    loadLivres();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteAdherent(id) {
  if (!confirm('Supprimer cet adhérent ?')) return;
  try {
    await api(`/adherents/${id}`, { method: 'DELETE' });
    toast('Adhérent supprimé');
    loadAdherents();
  } catch (err) { toast(err.message, 'error'); }
}

async function retourEmprunt(id) {
  if (!confirm('Confirmer le retour de ce livre ?')) return;
  try {
    await api(`/emprunts/${id}/retour`, { method: 'POST' });
    toast('Retour enregistré');
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
    el.textContent = `Connecté — ${h.database}`;
    el.classList.add('ok');
  } catch {
    el.textContent = 'Base de données inaccessible';
    el.classList.add('error');
  }
}

checkHealth();
loadDashboard();
