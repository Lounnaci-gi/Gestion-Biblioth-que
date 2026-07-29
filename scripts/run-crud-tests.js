const BASE = process.env.BASE_URL || 'http://localhost:3000';
const headers = { 'Content-Type': 'application/json' };

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (e) {}
  return { ok: res.ok, status: res.status, body };
}

async function run() {
  console.log('Checking health...');
  console.log(await req('/api/health'));

  // Adherent
  console.log('\n--- Adherents ---');
  console.log('List:', await req('/api/adherents'));

  const newAd = { nom: 'اختبار', prenom: 'مستخدم', email: `test.user.${Date.now()}@example.com`, telephone: '0123456789' };
  const createdAd = await req('/api/adherents', { method: 'POST', headers, body: JSON.stringify(newAd) });
  console.log('Created adherent:', createdAd);
  let adId;
  if (!createdAd.ok) {
    // Peut-être déjà présent — chercher par email
    const list = await req('/api/adherents');
    const found = (list.body || []).find(a => a.Email === newAd.email);
    if (!found) {
      console.error('Impossible de créer ou trouver l\'adhérent de test');
      return;
    }
    adId = found.ID_Adherent;
  } else {
    adId = createdAd.body.ID_Adherent || createdAd.body.ID || createdAd.body.id;
  }

  // Livres
  console.log('\n--- Livres ---');
  console.log('List:', await req('/api/livres'));
  const newLivre = { titre: 'كتاب اختبار', isbn: `ISBN-TEST-${Date.now()}`, auteur: 'مؤلف اختبار', quantite_totale: 2, categorie: 'رواية' };
  const createdLivre = await req('/api/livres', { method: 'POST', headers, body: JSON.stringify(newLivre) });
  console.log('Created livre:', createdLivre);
  if (!createdLivre.ok) return;
  const livreId = createdLivre.body.ID_Livre || createdLivre.body.ID || createdLivre.body.id;

  // Emprunts
  console.log('\n--- Emprunts ---');
  console.log('List before:', await req('/api/emprunts'));
  const createEmprunt = await req('/api/emprunts', { method: 'POST', headers, body: JSON.stringify({ id_livre: livreId, id_adherent: adId }) });
  console.log('Create emprunt response:', createEmprunt);
  if (!createEmprunt.ok) return;

  // Find emprunt ID
  const emprunts = await req('/api/emprunts');
  const found = (emprunts.body || []).find(e => e.Livre == createdLivre.body.Titre && e.AdherentNom == createdAd.body.Nom);
  const empruntId = found ? found.ID_Emprunt : null;
  console.log('Found emprunt:', empruntId, found ? found : emprunts);
  if (!empruntId) {
    console.warn('Could not locate emprunt id automatically - skipping return');
  } else {
    const retour = await req(`/api/emprunts/${empruntId}/retour`, { method: 'POST' });
    console.log('Retour emprunt:', retour);
  }

  // Update adherent
  console.log('\n--- Update Adherent ---');
  const updatedAd = await req(`/api/adherents/${adId}`, { method: 'PUT', headers, body: JSON.stringify({ nom: 'محدث', prenom: 'مستخدم', email: `test.up.${Date.now()}@example.com`, telephone: '000', statut: 'نشط' }) });
  console.log('Updated adherent:', updatedAd);

  // Update livre
  console.log('\n--- Update Livre ---');
  const updatedLivre = await req(`/api/livres/${livreId}`, { method: 'PUT', headers, body: JSON.stringify({ titre: 'كتاب معدل', isbn: createdLivre.body.ISBN, auteur: 'مؤلف معدل', quantite_totale: 2, categorie: 'رواية' }) });
  console.log('Updated livre:', updatedLivre);

  // Delete emprunt should already be returned; now delete adherent and livre
  console.log('\n--- Delete resources ---');
  const delAd = await req(`/api/adherents/${adId}`, { method: 'DELETE' });
  console.log('Delete adherent:', delAd);
  const delLivre = await req(`/api/livres/${livreId}`, { method: 'DELETE' });
  console.log('Delete livre:', delLivre);

  console.log('\n--- Stats ---');
  console.log(await req('/api/stats'));
}

run().catch(err => { console.error('Test script error:', err); process.exit(1); });
