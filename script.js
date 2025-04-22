// ==========================================================================
// POČETAK script.js KODA
// ==========================================================================

// Ovdje zalijepi SVOJ firebaseConfig objekt koji si kopirao iz Firebase konzole
// PAŽNJA: AKO OVO DIJELITE JAVNO (npr. GitHub), BUDITE SVJESNI DA SU OVI PODACI VIDLJIVI.
// Firestore sigurnosna pravila SU KLJUČNA za zaštitu podataka!
const firebaseConfig = {
    apiKey: "AIzaSyAn5aI0Rsna-cCtd_TyxAFWdnjS8TB_7v8", // <-- ZAMIJENI SVOJIM PRAVIM PODACIMA
    authDomain: "moja-watch-lista.firebaseapp.com", // <-- ZAMIJENI SVOJIM PRAVIM PODACIMA
    projectId: "moja-watch-lista", // <-- ZAMIJENI SVOJIM PRAVIM PODACIMA
    storageBucket: "moja-watch-lista.firebasestorage.app", // <-- ZAMIJENI SVOJIM PRAVIM PODACIMA
    messagingSenderId: "473312198206", // <-- ZAMIJENI SVOJIM PRAVIM PODACIMA
    appId: "1:473312198206:web:aeb0eeacd69eb0619e9b6f" // <-- ZAMIJENI SVOJIM PRAVIM PODACIMA
  };
  
  // Inicijaliziraj Firebase
  try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase uspješno inicijaliziran!");
  } catch (error) {
    console.error("Greška pri inicijalizaciji Firebasea:", error);
    alert("Greška pri povezivanju s aplikacijom. Provjerite konzolu.");
  }
  
  // Dohvati reference na Firebase servise koje ćemo koristiti
  const auth = firebase.auth(); // Za autentifikaciju
  const db = firebase.firestore(); // Za bazu podataka Firestore
  
  // === Dohvati reference na HTML elemente ===
  function getElement(id) {
    const element = document.getElementById(id);
    if (!element) { console.warn(`Element s ID-jem '${id}' nije pronađen.`); }
    return element;
  }
  
  const authSection = getElement('auth-section'); const contentSection = getElement('content-section'); const authForm = getElement('auth-form'); const emailInput = getElement('emailInput'); const passwordInput = getElement('passwordInput'); const loginButton = getElement('loginButton'); const registerButton = getElement('registerButton'); const logoutButton = getElement('logoutButton'); const authError = getElement('auth-error'); const userEmailSpan = getElement('userEmail');
  const addItemForm = getElement('add-item-form'); const itemTitleInput = getElement('itemTitle'); const itemTypeSelect = getElement('itemType'); const seasonEpisodeFields = getElement('season-episode-fields'); const seasonEpisodeFieldsEp = getElement('season-episode-fields-ep'); const itemSeasonInput = getElement('itemSeason'); const itemEpisodeInput = getElement('itemEpisode'); const itemWatchedCheckbox = getElement('itemWatched'); const ratingFieldDiv = getElement('rating-field'); const itemRatingInput = getElement('itemRating');
  const watchlistItemsDiv = getElement('watchlist-items'); const loadingIndicator = getElement('loading-indicator');
  // === KRAJ DOHVAĆANJA ELEMENATA ===
  
  
  // --- Listener za promjenu statusa prijave ---
  let unsubscribeFromWatchlist = null;
  
  auth.onAuthStateChanged(user => {
    if (user) { // Korisnik je prijavljen
      console.log("Korisnik je prijavljen:", user.email);
      if (authSection) authSection.classList.add('d-none'); if (contentSection) contentSection.classList.remove('d-none'); if (userEmailSpan) userEmailSpan.textContent = user.email; if (authError) authError.classList.add('d-none'); if (authForm) authForm.reset();
      fetchAndDisplayWatchlist(user.uid);
    } else { // Korisnik nije prijavljen
      console.log("Korisnik nije prijavljen.");
      stopListeningToWatchlist();
      if (authSection) authSection.classList.remove('d-none'); if (contentSection) contentSection.classList.add('d-none'); if (userEmailSpan) userEmailSpan.textContent = ''; if (watchlistItemsDiv) watchlistItemsDiv.innerHTML = ''; if (loadingIndicator) { loadingIndicator.style.display = 'block'; loadingIndicator.textContent = 'Učitavanje...'; }
    }
  });
  
  // --- Listener za promjenu tipa itema ---
  if (itemTypeSelect) {
      itemTypeSelect.addEventListener('change', () => {
          const selectedType = itemTypeSelect.value; const shouldShowFields = selectedType === 'Anime' || selectedType === 'Serija';
          if(seasonEpisodeFields) seasonEpisodeFields.style.display = shouldShowFields ? 'block' : 'none'; if(seasonEpisodeFieldsEp) seasonEpisodeFieldsEp.style.display = shouldShowFields ? 'block' : 'none';
      });
  }
  
  // --- Listener za promjenu checkboxa "Pogledano" u formi ---
  if (itemWatchedCheckbox) {
      itemWatchedCheckbox.addEventListener('change', () => {
          if (ratingFieldDiv) { ratingFieldDiv.style.display = itemWatchedCheckbox.checked ? 'block' : 'none'; }
          if (!itemWatchedCheckbox.checked && itemRatingInput) { itemRatingInput.value = ''; }
      });
  }
  
  // --- POMOĆNA FUNKCIJA ZA PRIKAZ GREŠAKA AUTENTIFIKACIJE ---
  const showAuthError = (message) => {
      if (authError) { authError.textContent = message; authError.classList.remove('d-none'); }
      else { console.error("Element #auth-error nije pronađen:", message); alert(message); }
  };
  
  // --- FUNKCIJE ZA AUTENTIFIKACIJU ---
  const handleLogin = () => { /* ... kod ostaje isti ... */ if (!emailInput || !passwordInput || !authError) { console.error("Auth elementi nisu dohvaćeni."); return; } const email = emailInput.value; const password = passwordInput.value; authError.classList.add('d-none'); authError.textContent = ''; if (!email || !password) { showAuthError("Molimo unesite email i lozinku."); return; } auth.signInWithEmailAndPassword(email, password).then((uc) => { console.log("Prijava uspješna:", uc.user.email); }).catch((e) => { console.error("Greška pri prijavi:", e.code, e.message); let p = "Greška."; if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') { p = "Neispravna email ili lozinka."; } else if (e.code === 'auth/invalid-email') { p = "Neispravan email."; } showAuthError(p); }); };
  const handleRegister = () => { /* ... kod ostaje isti ... */ if (!emailInput || !passwordInput || !authError) { console.error("Auth elementi nisu dohvaćeni."); return; } const email = emailInput.value; const password = passwordInput.value; authError.classList.add('d-none'); authError.textContent = ''; if (!email || !password) { showAuthError("Molimo unesite email i lozinku."); return; } auth.createUserWithEmailAndPassword(email, password).then((uc) => { console.log("Registracija uspješna:", uc.user.email); }).catch((e) => { console.error("Greška pri registraciji:", e.code, e.message); let p = "Greška."; if (e.code === 'auth/email-already-in-use') { p = "Email zauzet."; } else if (e.code === 'auth/invalid-email') { p = "Neispravan email."; } else if (e.code === 'auth/weak-password') { p = "Lozinka preslaba."; } showAuthError(p); }); };
  const handleLogout = () => { /* ... kod ostaje isti ... */ auth.signOut().then(() => { console.log("Korisnik odjavljen."); }).catch((e) => { console.error("Greška pri odjavi:", e); alert("Greška pri odjavi."); }); };
  
  // --- FUNKCIJA ZA DODAVANJE UNOSA U FIRESTORE ---
  const handleAddItem = (event) => { /* ... kod ostaje isti ... */ event.preventDefault(); if (!itemTitleInput || !itemTypeSelect || !itemWatchedCheckbox || !itemRatingInput) { console.error("Osnovni elementi forme nisu dohvaćeni!"); alert("Greška u aplikaciji (forma)."); return; } if (!itemSeasonInput || !itemEpisodeInput) { console.warn("Elementi za sezonu/epizodu nisu pronađeni."); } const title = itemTitleInput.value.trim(); const type = itemTypeSelect.value; const season = itemSeasonInput ? itemSeasonInput.value : '1'; const episode = itemEpisodeInput ? itemEpisodeInput.value : '1'; const watched = itemWatchedCheckbox.checked; const rating = itemRatingInput.value; if (!title) { alert('Unesite naslov.'); return; } if (!type) { alert('Odaberite tip.'); return; } if (watched && !rating) { alert('Unesite ocjenu (1-10).'); return; } if (watched && rating && (parseInt(rating) < 1 || parseInt(rating) > 10)) { alert('Ocjena mora biti 1-10.'); return; } const user = auth.currentUser; if (!user) { alert('Niste prijavljeni.'); return; } const userId = user.uid; const newItem = { userId: userId, title: title, type: type, watched: watched, createdAt: firebase.firestore.FieldValue.serverTimestamp() }; if (type === 'Anime' || type === 'Serija') { newItem.season = parseInt(season) || 1; newItem.episode = parseInt(episode) || 1; } if (watched && rating) { newItem.rating = parseInt(rating); } else { newItem.rating = null; } console.log('Pripremljen za spremanje:', newItem); db.collection('watchlist').add(newItem).then((dr) => { console.log("Dokument zapisan:", dr.id); if (addItemForm) addItemForm.reset(); if (seasonEpisodeFields) seasonEpisodeFields.style.display = 'none'; if (seasonEpisodeFieldsEp) seasonEpisodeFieldsEp.style.display = 'none'; if (ratingFieldDiv) ratingFieldDiv.style.display = 'none'; if (itemTypeSelect) itemTypeSelect.value = ""; }).catch((e) => { console.error("Greška dodavanja: ", e); if (e.code === 'permission-denied') { alert("Nemate dozvolu."); } else { alert("Greška spremanja."); } }); };
  
  // --- FUNKCIJE ZA RAD S LISTOM ---
  
  const fetchAndDisplayWatchlist = (userId) => { /* ... kod ostaje isti ... */ if (!watchlistItemsDiv || !loadingIndicator) { console.error("Elementi za prikaz liste nisu pronađeni."); return; } console.log('Dohvaćam listu za:', userId); loadingIndicator.textContent = 'Učitavam...'; loadingIndicator.style.display = 'block'; watchlistItemsDiv.innerHTML = ''; stopListeningToWatchlist(); const query = db.collection('watchlist').where('userId', '==', userId)/*.orderBy('createdAt', 'desc')*/; /* Maknuto sortiranje iz queryja jer sortiramo na klijentu */ unsubscribeFromWatchlist = query.onSnapshot( (qs) => { console.log("Primljene promjene"); let items = []; qs.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); }); if (loadingIndicator) loadingIndicator.style.display = 'none'; displayItems(items); }, (e) => { console.error("Greška dohvaćanja: ", e); if (loadingIndicator) { loadingIndicator.textContent = 'Greška učitavanja.'; loadingIndicator.style.display = 'block'; } if (e.code === 'permission-denied') { alert("Nemate dozvolu čitanja."); } else if (e.code === 'unimplemented' || (e.message && e.message.includes('indexes'))) { alert("Potreban Firestore indeks."); console.warn("Potreban Firestore indeks!"); } } ); console.log("Listener postavljen."); };
  
  const stopListeningToWatchlist = () => { /* ... kod ostaje isti ... */ if (unsubscribeFromWatchlist) { console.log("Zaustavljam listener..."); unsubscribeFromWatchlist(); unsubscribeFromWatchlist = null; } };
  
  // --- FUNKCIJA ZA PRIKAZ ELEMENATA LISTE (SADA SA SORTIRANJEM) ---
  const displayItems = (items) => {
      if (!watchlistItemsDiv) return;
      watchlistItemsDiv.innerHTML = '';
  
      if (items.length === 0) {
          watchlistItemsDiv.innerHTML = '<p class="text-muted">Lista je prazna.</p>';
          return;
      }
  
      // === NOVO: SORTIRANJE LISTE ===
      items.sort((a, b) => {
          if (a.watched !== b.watched) { return a.watched - b.watched; }
          const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
          const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
          return timeB - timeA; // Noviji prvo unutar grupe
      });
      // === KRAJ SORTIRANJA ===
  
      items.forEach(item => { // Ostatak funkcije je isti
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'mb-2');
          if (item.watched) { itemDiv.classList.add('list-group-item-light', 'text-muted'); }
          let contentHTML = `<div class="ms-2 me-auto"><div class="fw-bold">${item.title || ''} <span class="badge bg-secondary">${item.type || ''}</span></div>`;
          if (item.type === 'Anime' || item.type === 'Serija') { contentHTML += `<div>S${item.season || '?'}E${item.episode || '?'}</div>`; }
          if (item.watched) { contentHTML += `<div class="mt-1 d-flex align-items-center"><label for="rating-${item.id}" class="form-label form-label-sm me-1 mb-0">Ocjena:</label><input type="number" min="1" max="10" value="${item.rating || ''}" id="rating-${item.id}" class="form-control form-control-sm rating-input me-1" style="width: 75px;" placeholder="1-10"><button class="btn btn-sm btn-outline-success save-rating-btn" data-id="${item.id}" title="Spremi ocjenu">Spremi</button></div>`; }
          contentHTML += `</div>`;
          let buttonsHTML = `<div class="d-flex flex-column align-items-end">`;
          if ((item.type === 'Anime' || item.type === 'Serija') && !item.watched) { buttonsHTML += `<button class="btn btn-sm btn-outline-primary mb-1 increase-episode-btn" data-id="${item.id}" data-season="${item.season || 1}" data-episode="${item.episode || 1}" title="Povećaj epizodu">+ Ep</button>`; }
          buttonsHTML += `<div class="form-check form-switch mb-1"><input class="form-check-input watched-toggle-cb" type="checkbox" role="switch" id="watched-${item.id}" data-id="${item.id}" ${item.watched ? 'checked' : ''} title="${item.watched ? 'Nepogledano' : 'Pogledano'}"><label class="form-check-label visually-hidden" for="watched-${item.id}">${item.watched ? 'Pogledano' : 'Nepogledano'}</label></div>`;
          buttonsHTML += `<button class="btn btn-sm btn-outline-danger delete-item-btn" data-id="${item.id}" title="Obriši"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg></button>`;
          buttonsHTML += `</div>`;
          itemDiv.innerHTML = contentHTML + buttonsHTML;
          watchlistItemsDiv.appendChild(itemDiv);
      });
  };
  
  // --- Event Listener za Akcije na Listi ---
  if (watchlistItemsDiv) {
      watchlistItemsDiv.addEventListener('click', (event) => {
          const target = event.target;
          const deleteButton = target.closest('.delete-item-btn'); if (deleteButton) { const itemId = deleteButton.dataset.id; if (itemId && confirm(`Obrisati?`)) { deleteItem(itemId); } return; }
          const increaseButton = target.closest('.increase-episode-btn'); if (increaseButton) { const itemId = increaseButton.dataset.id; const currentSeason = parseInt(increaseButton.dataset.season) || 1; const currentEpisode = parseInt(increaseButton.dataset.episode) || 1; if (itemId) { const nextEpisode = currentEpisode + 1; updateItemProgress(itemId, currentSeason, nextEpisode); } else { console.error("Nedostaje ID"); } return; }
          const saveRatingButton = target.closest('.save-rating-btn'); if (saveRatingButton) { const itemId = saveRatingButton.dataset.id; const ratingInput = document.getElementById(`rating-${itemId}`); if (itemId && ratingInput) { const val = ratingInput.value; if (val === "") { if (confirm("Ukloniti ocjenu?")) { updateItemRating(itemId, null); } } else { const nr = parseInt(val); if (!isNaN(nr) && nr >= 1 && nr <= 10) { updateItemRating(itemId, nr); } else { alert("Ocjena 1-10."); ratingInput.focus(); } } } else { console.error("Nije pronađen ID/Input."); } return; }
          if (target.classList.contains('watched-toggle-cb')) { const itemId = target.dataset.id; const newWatchedStatus = target.checked; updateItemWatchedStatus(itemId, newWatchedStatus); return; }
      });
  }
  
  // --- FUNKCIJE ZA BRISANJE I AŽURIRANJE ---
  const deleteItem = (itemId) => { /* ... kod ostaje isti ... */ console.log('Brisanje:', itemId); if (!itemId) { return; } db.collection('watchlist').doc(itemId).delete().then(() => { console.log("Obrisano:", itemId); }).catch((e) => { console.error("Greška brisanja:", e); alert("Greška brisanja."); if (e.code === 'permission-denied') { alert("Nemate dozvolu."); } }); };
  const updateItemProgress = (itemId, season, nextEpisode) => { /* ... kod ostaje isti ... */ console.log(`Ažuriram S${season}E${nextEpisode} za ${itemId}`); if (!itemId || isNaN(nextEpisode) || nextEpisode < 1) { return; } const data = { episode: nextEpisode }; db.collection('watchlist').doc(itemId).update(data).then(() => { console.log(`Progres ažuriran za ${itemId}.`); }).catch((e) => { console.error(`Greška ažuriranja progresa za ${itemId}:`, e); alert("Greška ažuriranja epizode."); if (e.code === 'permission-denied') { alert("Nemate dozvolu."); } }); };
  const updateItemWatchedStatus = (itemId, watchedStatus) => { /* ... kod ostaje isti ... */ console.log(`Ažuriram watched=${watchedStatus} za ${itemId}`); if (!itemId) { return; } const data = { watched: watchedStatus }; if (!watchedStatus) { data.rating = null; } db.collection('watchlist').doc(itemId).update(data).then(() => { console.log(`Watched status ažuriran za ${itemId}.`); }).catch((e) => { console.error(`Greška ažuriranja watched statusa za ${itemId}:`, e); alert("Greška ažuriranja statusa."); if (e.code === 'permission-denied') { alert("Nemate dozvolu."); } const cb = document.getElementById(`watched-${itemId}`); if(cb) { cb.checked = !watchedStatus; } }); }
  const updateItemRating = (itemId, rating) => { /* ... kod ostaje isti ... */ console.log(`Ažuriram rating=${rating} za ${itemId}`); if (!itemId) { return; } if (rating !== null && (isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 10)) { alert("Ocjena 1-10 ili prazno."); return; } const data = { rating: rating }; db.collection('watchlist').doc(itemId).update(data).then(() => { console.log(`Ocjena ažurirana za ${itemId}.`); const btn = document.querySelector(`.save-rating-btn[data-id="${itemId}"]`); if(btn) { btn.textContent = 'OK!'; btn.classList.replace('btn-outline-success','btn-success'); setTimeout(() => { btn.textContent = 'Spremi'; btn.classList.replace('btn-success','btn-outline-success'); }, 1500); } }).catch((e) => { console.error(`Greška ažuriranja ocjene za ${itemId}:`, e); alert("Greška spremanja ocjene."); if (e.code === 'permission-denied') { alert("Nemate dozvolu."); } }); }
  
  // === DODAVANJE EVENT LISTENER-a ZA AUTENTIFIKACIJU I FORMU ===
  if (loginButton) loginButton.addEventListener('click', handleLogin);
  if (registerButton) registerButton.addEventListener('click', handleRegister);
  if (logoutButton) { logoutButton.addEventListener('click', handleLogout); logoutButton.addEventListener('click', stopListeningToWatchlist); }
  if (addItemForm) { addItemForm.addEventListener('submit', handleAddItem); console.log('Listener za submit dodan.'); }
  else { console.error("Forma #add-item-form NIJE pronađena!"); }
  
  // ==========================================================================
  // KRAJ script.js KODA
  // ==========================================================================