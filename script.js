// ==========================================================================
// POČETAK script.js KODA
// ==========================================================================

// Ovdje zalijepi SVOJ firebaseConfig objekt
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
  alert("Greška pri povezivanju s aplikacijom.");
}

// Reference na Firebase servise
const auth = firebase.auth();
const db = firebase.firestore();

// === Dohvati reference na HTML elemente ===
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) { console.warn(`Element s ID-jem '${id}' nije pronađen.`); }
  return element;
}

const authSection = getElement('auth-section'); const contentSection = getElement('content-section'); const authForm = getElement('auth-form'); const emailInput = getElement('emailInput'); const passwordInput = getElement('passwordInput'); const loginButton = getElement('loginButton'); const registerButton = getElement('registerButton'); const logoutButton = getElement('logoutButton'); const authError = getElement('auth-error'); const userEmailSpan = getElement('userEmail');
const addItemForm = getElement('add-item-form'); const itemTitleInput = getElement('itemTitle'); const itemTypeSelect = getElement('itemType'); const seasonEpisodeFields = getElement('season-episode-fields'); const seasonEpisodeFieldsEp = getElement('season-episode-fields-ep'); const itemSeasonInput = getElement('itemSeason'); const itemEpisodeInput = getElement('itemEpisode'); const itemWatchedCheckbox = getElement('itemWatched'); const ratingFieldDiv = getElement('rating-field'); const itemRatingInput = getElement('itemRating');
const watchlistItemsDiv = getElement('watchlist-items'); const loadingIndicator = getElement('loading-indicator');
const themeToggleButton = getElement('theme-toggle-button');
const themeToggleIcon = themeToggleButton ? themeToggleButton.querySelector('i') : null;
// === KRAJ DOHVAĆANJA ELEMENATA ===


// --- FUNKCIJE ZA UPRAVLJANJE TEMOM ---
const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        if (themeToggleIcon) themeToggleIcon.className = 'bi bi-brightness-high-fill'; // Sunce
    } else {
        document.documentElement.removeAttribute('data-bs-theme');
        if (themeToggleIcon) themeToggleIcon.className = 'bi bi-moon-stars-fill'; // Mjesec
    }
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme); // Spremi odabir
    applyTheme(newTheme);
    console.log("Tema promijenjena u:", newTheme);
};

const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light'; // Default je light
    applyTheme(savedTheme);
    console.log("Učitana tema:", savedTheme);
};

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
const handleLogin = () => { if (!emailInput || !passwordInput || !authError) return; const e = emailInput.value, p = passwordInput.value; authError.classList.add('d-none'); if (!e || !p) { showAuthError("Unesite email i lozinku."); return; } auth.signInWithEmailAndPassword(e, p).then(uc => console.log("Prijava OK:", uc.user.email)).catch(err => { console.error("Login err:", err.code); let msg = "Greška prijave."; if (err.code.includes('auth/invalid') || err.code.includes('auth/wrong-password')) msg = "Neispravan email/lozinka."; showAuthError(msg); }); };
const handleRegister = () => { if (!emailInput || !passwordInput || !authError) return; const e = emailInput.value, p = passwordInput.value; authError.classList.add('d-none'); if (!e || !p) { showAuthError("Unesite email i lozinku."); return; } auth.createUserWithEmailAndPassword(e, p).then(uc => console.log("Registracija OK:", uc.user.email)).catch(err => { console.error("Register err:", err.code); let msg = "Greška registracije."; if (err.code === 'auth/email-already-in-use') msg = "Email zauzet."; else if (err.code === 'auth/invalid-email') msg = "Neispravan email."; else if (err.code === 'auth/weak-password') msg = "Lozinka preslaba."; showAuthError(msg); }); };
const handleLogout = () => { auth.signOut().then(() => console.log("Odjava OK.")).catch(e => console.error("Logout err:", e)); };

// --- FUNKCIJA ZA DODAVANJE UNOSA U FIRESTORE ---
const handleAddItem = (event) => { event.preventDefault(); if (!itemTitleInput || !itemTypeSelect) return; const title = itemTitleInput.value.trim(), type = itemTypeSelect.value, season = itemSeasonInput?.value || '1', episode = itemEpisodeInput?.value || '1', watched = itemWatchedCheckbox?.checked || false, rating = itemRatingInput?.value || ''; if (!title || !type) { alert('Unesite naslov i tip.'); return; } if (watched && !rating) { alert('Unesite ocjenu.'); return; } const ratingNum = parseInt(rating); if (watched && rating && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10)) { alert('Ocjena 1-10.'); return; } const user = auth.currentUser; if (!user) return; const newItem = { userId: user.uid, title, type, watched, createdAt: firebase.firestore.FieldValue.serverTimestamp(), rating: watched && rating ? ratingNum : null }; if (type === 'Anime' || type === 'Serija') { newItem.season = parseInt(season) || 1; newItem.episode = parseInt(episode) || 1; } console.log('Spremam:', newItem); db.collection('watchlist').add(newItem).then(dr => { console.log("Spremljeno:", dr.id); addItemForm?.reset(); if (seasonEpisodeFields) seasonEpisodeFields.style.display = 'none'; if (seasonEpisodeFieldsEp) seasonEpisodeFieldsEp.style.display = 'none'; if (ratingFieldDiv) ratingFieldDiv.style.display = 'none'; if (itemTypeSelect) itemTypeSelect.value = ""; }).catch(e => { console.error("Greška dodavanja:", e); alert("Greška spremanja."); }); };

// --- FUNKCIJE ZA RAD S LISTOM ---
const fetchAndDisplayWatchlist = (userId) => { if (!watchlistItemsDiv || !loadingIndicator) return; console.log('Dohvaćam listu za:', userId); loadingIndicator.textContent = 'Učitavam...'; loadingIndicator.style.display = 'block'; watchlistItemsDiv.innerHTML = ''; stopListeningToWatchlist(); const query = db.collection('watchlist').where('userId', '==', userId); unsubscribeFromWatchlist = query.onSnapshot(qs => { console.log("Primljene promjene"); let items = []; qs.forEach(doc => items.push({ id: doc.id, ...doc.data() })); if (loadingIndicator) loadingIndicator.style.display = 'none'; displayItems(items); }, e => { console.error("Greška dohvaćanja:", e); if (loadingIndicator) loadingIndicator.textContent = 'Greška.'; if (e.code === 'permission-denied') alert("Nemate dozvolu čitanja."); else if (e.code === 'unimplemented' || (e.message && e.message.includes('index'))) alert("Potreban Firestore indeks."); }); console.log("Listener postavljen."); };
const stopListeningToWatchlist = () => { if (unsubscribeFromWatchlist) { console.log("Zaustavljam listener..."); unsubscribeFromWatchlist(); unsubscribeFromWatchlist = null; } };

// --- FUNKCIJA ZA PRIKAZ ELEMENATA LISTE (S IKONAMA I SORTIRANJEM) ---
const displayItems = (items) => {
    if (!watchlistItemsDiv) return;
    watchlistItemsDiv.innerHTML = '';
    if (items.length === 0) { watchlistItemsDiv.innerHTML = '<p class="text-muted text-center mt-3">Lista je prazna.</p>'; return; }

    // SORTIRANJE: Nepogledani prvi, pa po datumu
    items.sort((a, b) => { if (a.watched !== b.watched) return a.watched - b.watched; const timeA = a.createdAt?.toDate?.()?.getTime() || 0; const timeB = b.createdAt?.toDate?.()?.getTime() || 0; return timeB - timeA; });

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-start mb-2 rounded shadow-sm'; // Dodan shadow-sm
        if (item.watched) itemDiv.classList.add('item-watched');

        // Info dio
        let contentHTML = `<div class="ms-2 me-auto"><div class="fw-bold">${item.title || ''} <span class="badge bg-info text-dark fw-normal">${item.type || ''}</span></div>`; // Promijenjena boja badge-a
        if (item.type === 'Anime' || item.type === 'Serija') contentHTML += `<div>S${item.season || '?'}E${item.episode || '?'}</div>`;
        if (item.watched) { // Ocjena ili input za ocjenu
             contentHTML += `<div class="mt-1 d-flex align-items-center"><label for="rating-${item.id}" class="form-label-sm me-1 mb-0 text-body-secondary">Ocjena:</label><input type="number" min="1" max="10" value="${item.rating || ''}" id="rating-${item.id}" class="form-control form-control-sm rating-input me-1" style="width: 65px;" placeholder="1-10"><button class="btn btn-sm btn-outline-success save-rating-btn py-0 px-1" data-id="${item.id}" title="Spremi ocjenu"><i class="bi bi-save"></i></button></div>`; // Ikona za spremanje
        }
        contentHTML += `</div>`;

        // Gumbi dio
        let buttonsHTML = `<div class="d-flex align-items-center flex-nowrap">`; // flex-nowrap da se ne prelamaju
        if ((item.type === 'Anime' || item.type === 'Serija') && !item.watched) buttonsHTML += `<button class="btn btn-sm btn-outline-primary border-0 rounded-circle p-1 me-1 increase-episode-btn" data-id="${item.id}" data-season="${item.season || 1}" data-episode="${item.episode || 1}" title="Povećaj epizodu"><i class="bi bi-plus-lg"></i></button>`;
        const watchedIcon = item.watched ? 'bi-check-circle-fill text-success' : 'bi-circle text-secondary';
        const watchedTitle = item.watched ? 'Označi kao Nepogledano' : 'Označi kao Pogledano';
        buttonsHTML += `<button class="btn btn-sm border-0 rounded-circle p-1 me-1 watched-toggle-btn" data-id="${item.id}" data-watched="${item.watched}" title="${watchedTitle}"><i class="bi ${watchedIcon}" style="font-size: 1.1rem;"></i></button>`;
        buttonsHTML += `<button class="btn btn-sm btn-outline-danger border-0 rounded-circle p-1 delete-item-btn" data-id="${item.id}" title="Obriši"><i class="bi bi-trash3-fill"></i></button>`;
        buttonsHTML += `</div>`;

        itemDiv.innerHTML = contentHTML + buttonsHTML;
        watchlistItemsDiv.appendChild(itemDiv);
    });
};


// --- Event Listener za Akcije na Listi ---
if (watchlistItemsDiv) {
    watchlistItemsDiv.addEventListener('click', (event) => {
        const target = event.target;
        const deleteButton = target.closest('.delete-item-btn'); if (deleteButton) { const itemId = deleteButton.dataset.id; if (itemId && confirm(`Obrisati?`)) deleteItem(itemId); return; }
        const increaseButton = target.closest('.increase-episode-btn'); if (increaseButton) { const itemId = increaseButton.dataset.id; const cs = parseInt(increaseButton.dataset.season) || 1; const ce = parseInt(increaseButton.dataset.episode) || 1; if (itemId) updateItemProgress(itemId, cs, ce + 1); return; }
        const saveRatingButton = target.closest('.save-rating-btn'); if (saveRatingButton) { const itemId = saveRatingButton.dataset.id; const ri = document.getElementById(`rating-${itemId}`); if (itemId && ri) { const v = ri.value; if (v === "") { if (confirm("Ukloniti ocjenu?")) updateItemRating(itemId, null); } else { const n = parseInt(v); if (!isNaN(n) && n >= 1 && n <= 10) updateItemRating(itemId, n); else alert("Ocjena 1-10."); } } return; }
        const watchedButton = target.closest('.watched-toggle-btn'); if (watchedButton) { const itemId = watchedButton.dataset.id; const cw = watchedButton.dataset.watched === 'true'; updateItemWatchedStatus(itemId, !cw); return; }
    });
}

// --- FUNKCIJE ZA BRISANJE I AŽURIRANJE ---
const deleteItem = (itemId) => { if (!itemId) return; db.collection('watchlist').doc(itemId).delete().then(() => console.log("Obrisano:", itemId)).catch(e => console.error("Greška brisanja:", e)); };
const updateItemProgress = (itemId, season, nextEpisode) => { if (!itemId || isNaN(nextEpisode) || nextEpisode < 1) return; db.collection('watchlist').doc(itemId).update({ episode: nextEpisode }).then(() => console.log(`Epizoda++ OK za ${itemId}`)).catch(e => console.error(`Greška Ep++ za ${itemId}:`, e)); };
const updateItemWatchedStatus = (itemId, watchedStatus) => { if (!itemId) return; const data = { watched: watchedStatus }; if (!watchedStatus) data.rating = null; db.collection('watchlist').doc(itemId).update(data).then(() => console.log(`Watched=${watchedStatus} OK za ${itemId}`)).catch(e => { console.error(`Greška watched=${watchedStatus} za ${itemId}:`, e); const cb = document.getElementById(`watched-${itemId}`); if (cb) cb.checked = !watchedStatus; }); };
const updateItemRating = (itemId, rating) => { if (!itemId) return; if (rating !== null && (isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 10)) { alert("Ocjena 1-10."); return; } db.collection('watchlist').doc(itemId).update({ rating: rating }).then(() => { console.log(`Rating=${rating} OK za ${itemId}`); const btn = document.querySelector(`.save-rating-btn[data-id="${itemId}"]`); if (btn) { const icon = btn.querySelector('i'); const originalIcon = 'bi-save'; if (icon) icon.className = 'bi bi-check-lg'; btn.classList.replace('btn-outline-success', 'btn-success'); setTimeout(() => { if (icon) icon.className = `bi ${originalIcon}`; btn.classList.replace('btn-success', 'btn-outline-success'); }, 1500); } }).catch(e => console.error(`Greška rating=${rating} za ${itemId}:`, e)); };

// === DODAVANJE EVENT LISTENER-a ===
if (loginButton) loginButton.addEventListener('click', handleLogin);
if (registerButton) registerButton.addEventListener('click', handleRegister);
if (logoutButton) { logoutButton.addEventListener('click', handleLogout); logoutButton.addEventListener('click', stopListeningToWatchlist); }
if (addItemForm) { addItemForm.addEventListener('submit', handleAddItem); console.log('Listener za submit dodan.'); } else { console.error("Forma #add-item-form NIJE pronađena!"); }
if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);

// Učitaj temu kod pokretanja
loadTheme();

// ==========================================================================
// KRAJ script.js KODA
// ==========================================================================