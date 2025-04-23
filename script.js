// ==========================================================================
// POČETAK script.js KODA - ISPRAVLJENA VERZIJA
// ==========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAn5aI0Rsna-cCtd_TyxAFWdnjS8TB_7v8", // <-- ZAMIJENI
  authDomain: "moja-watch-lista.firebaseapp.com", // <-- ZAMIJENI
  projectId: "moja-watch-lista", // <-- ZAMIJENI
  storageBucket: "moja-watch-lista.firebasestorage.app", // <-- ZAMIJENI
  messagingSenderId: "473312198206", // <-- ZAMIJENI
  appId: "1:473312198206:web:aeb0eeacd69eb0619e9b6f" // <-- ZAMIJENI
};

// Inicijaliziraj Firebase
try { firebase.initializeApp(firebaseConfig); console.log("Firebase OK!"); }
catch (error) { console.error("Firebase Init Err:", error); alert("Greška povezivanja."); }

// Firebase reference
const auth = firebase.auth();
const db = firebase.firestore();

// === Dohvati reference na HTML elemente ===
function getEl(id) { const el = document.getElementById(id); if (!el) console.warn(`Element '${id}' nije pronađen.`); return el; }
const authSection = getEl('auth-section'); const contentSection = getEl('content-section'); const authForm = getEl('auth-form'); const emailInput = getEl('emailInput'); const passwordInput = getEl('passwordInput'); const loginButton = getEl('loginButton'); const registerButton = getEl('registerButton'); const logoutButton = getEl('logoutButton'); const authError = getEl('auth-error'); const userEmailSpan = getEl('userEmail');
const watchlistItemsDiv = getEl('watchlist-items'); const loadingIndicator = getEl('loading-indicator');
const themeToggleButton = getEl('theme-toggle-button'); const themeToggleIcon = themeToggleButton?.querySelector('i');
const addItemModalEl = getEl('addItemModal'); const addItemModal = addItemModalEl ? new bootstrap.Modal(addItemModalEl) : null; const modalForm = getEl('modal-add-item-form');
const modalTitle = getEl('modalItemTitle'); const modalType = getEl('modalItemType'); const modalWatched = getEl('modalItemWatched'); const modalRatingFields = getEl('modal-rating-fields'); const modalRating = getEl('modalItemRating'); const modalSeasonFields = getEl('modal-season-episode-fields'); const modalSeason = getEl('modalItemSeason'); const modalEpisode = getEl('modalItemEpisode'); const modalFavorite = getEl('modalItemFavorite');
const filterControls = getEl('filter-controls');
// === KRAJ DOHVAĆANJA ELEMENATA ===

// --- Globalne varijable ---
let unsubscribeFromWatchlist = null; let currentUserId = null; let allUserItems = []; let currentFilter = 'all';

// --- FUNKCIJE ZA UPRAVLJANJE TEMOM ---
const applyTheme = (theme) => { document.documentElement.setAttribute('data-bs-theme', theme); if (themeToggleIcon) themeToggleIcon.className = theme === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-stars-fill'; };
const toggleTheme = () => { const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', newTheme); applyTheme(newTheme); };
const loadTheme = () => { applyTheme(localStorage.getItem('theme') || 'light'); };

// --- Listener za promjenu statusa prijave ---
auth.onAuthStateChanged(user => {
    currentUserId = user ? user.uid : null; // Ovdje postavimo ID
    if (user) {
        console.log("Login OK:", user.email);
        if (authSection) authSection.classList.add('d-none'); if (contentSection) contentSection.classList.remove('d-none'); if (userEmailSpan) userEmailSpan.textContent = user.email; if (authError) authError.classList.add('d-none'); authForm?.reset(); // Resetiraj login formu
        fetchAndDisplayWatchlist(user.uid);
    } else {
        console.log("Logout OK.");
        stopListeningToWatchlist(); allUserItems = []; currentFilter = 'all';
        if (authSection) authSection.classList.remove('d-none'); if (contentSection) contentSection.classList.add('d-none'); if (userEmailSpan) userEmailSpan.textContent = ''; if (watchlistItemsDiv) watchlistItemsDiv.innerHTML = ''; if (loadingIndicator) { loadingIndicator.style.display = 'block'; loadingIndicator.textContent = 'Učitavanje...'; }
        const af = document.getElementById('filterAll'); if(af) af.checked = true;
    }
});

// --- Listeneri za Modal Formu ---
if (modalType) { modalType.addEventListener('change', () => { const show = modalType.value === 'Anime' || modalType.value === 'Serija'; if (modalSeasonFields) modalSeasonFields.style.display = show ? 'flex' : 'none'; }); }
if (modalWatched) { modalWatched.addEventListener('change', () => { if (modalRatingFields) modalRatingFields.classList.toggle('d-none', !modalWatched.checked); if (!modalWatched.checked && modalRating) modalRating.value = ''; }); }
if(addItemModalEl) { addItemModalEl.addEventListener('hidden.bs.modal', () => { modalForm?.reset(); if (modalSeasonFields) modalSeasonFields.style.display = 'none'; if (modalRatingFields) modalRatingFields.classList.add('d-none'); }); }

// --- FUNKCIJE ZA AUTENTIFIKACIJU (ISPRAVLJENE) ---
const showAuthError = (msg) => { if (authError) { authError.textContent = msg; authError.classList.remove('d-none'); } else alert(msg); };

const handleLogin = () => {
    if (!emailInput || !passwordInput || !authError) { console.error("Auth elementi nedostaju."); return; }
    const email = emailInput.value.trim(); // Trim za svaki slučaj
    const password = passwordInput.value;

    // Sakrij prethodnu grešku
    authError.classList.add('d-none');
    authError.textContent = '';

    if (!email || !password) {
        showAuthError("Molimo unesite email i lozinku.");
        return;
    }

    console.log("Pokušaj prijave..."); // Log za provjeru
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Uspjeh - onAuthStateChanged će odraditi ostalo
            console.log("Prijava uspješna (unutar .then):", userCredential?.user?.email);
            // Ne treba ništa ovdje raditi s UI
        })
        .catch((error) => {
            console.error("Greška pri prijavi:", error.code, error.message);
            let poruka = "Došlo je do greške pri prijavi.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
                poruka = "Neispravna email adresa ili lozinka.";
            }
            showAuthError(poruka);
        });
};

const handleRegister = () => {
    if (!emailInput || !passwordInput || !authError) { console.error("Auth elementi nedostaju."); return; }
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Sakrij prethodnu grešku
    authError.classList.add('d-none');
    authError.textContent = '';

    if (!email || !password) {
        showAuthError("Molimo unesite email i lozinku.");
        return;
    }
    if (password.length < 6) { // Firebase zahtjev
        showAuthError("Lozinka mora imati najmanje 6 znakova.");
        return;
    }

    console.log("Pokušaj registracije...");
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Uspjeh - onAuthStateChanged će odraditi ostalo
             console.log("Registracija uspješna (unutar .then):", userCredential?.user?.email);
        })
        .catch((error) => {
            console.error("Greška pri registraciji:", error.code, error.message);
            let poruka = "Došlo je do greške pri registraciji.";
            if (error.code === 'auth/email-already-in-use') {
                poruka = "Email adresa je već zauzeta.";
            } else if (error.code === 'auth/invalid-email') {
                poruka = "Unesena email adresa nije valjana.";
            } else if (error.code === 'auth/weak-password') {
                poruka = "Lozinka je preslaba.";
            }
            showAuthError(poruka);
        });
};

const handleLogout = () => { auth.signOut().catch(e => console.error("Logout err:", e)); };

// --- FUNKCIJA ZA DODAVANJE / SPREMANJE UNOSA ---
const handleSaveItem = (event) => { event.preventDefault(); if (!modalTitle || !modalType) return; const title = modalTitle.value.trim(), type = modalType.value, season = modalSeason?.value || '1', episode = modalEpisode?.value || '1', watched = modalWatched?.checked || false, rating = modalRating?.value || '', favorite = modalFavorite?.checked || false; if (!title || !type) { alert('Unesite naslov i tip.'); return; } if (watched && !rating) { alert('Unesite ocjenu.'); return; } const ratingNum = parseInt(rating); if (watched && rating && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10)) { alert('Ocjena 1-10.'); return; } if (!currentUserId) { alert("Niste prijavljeni!"); return; } /* Provjera ID-a */ const newItem = { userId: currentUserId, title, type, watched, favorite, createdAt: firebase.firestore.FieldValue.serverTimestamp(), rating: watched && rating ? ratingNum : null }; if (type === 'Anime' || type === 'Serija') { newItem.season = parseInt(season) || 1; newItem.episode = parseInt(episode) || 1; } console.log('Spremam:', newItem); db.collection('watchlist').add(newItem).then(dr => { console.log("Spremljeno:", dr.id); addItemModal?.hide(); }).catch(e => { console.error("Greška dodavanja:", e); alert("Greška spremanja."); }); };

// --- FUNKCIJE ZA RAD S LISTOM ---
const fetchAndDisplayWatchlist = (userId) => { if (!watchlistItemsDiv || !loadingIndicator || !userId) { console.error("Nedostaje userId ili div za listu."); return; } console.log('Dohvaćam SVE iteme za:', userId); loadingIndicator.textContent = 'Učitavam...'; loadingIndicator.style.display = 'block'; watchlistItemsDiv.innerHTML = ''; stopListeningToWatchlist(); const query = db.collection('watchlist').where('userId', '==', userId); unsubscribeFromWatchlist = query.onSnapshot(qs => { console.log("Primljene SVE promjene"); allUserItems = []; qs.forEach(doc => allUserItems.push({ id: doc.id, ...doc.data() })); if (loadingIndicator) loadingIndicator.style.display = 'none'; applyCurrentFilter(); }, e => { console.error("Greška dohvaćanja:", e); if (loadingIndicator) loadingIndicator.textContent = 'Greška.'; if (e.code === 'permission-denied') alert("Nemate dozvolu čitanja."); }); console.log("Listener postavljen."); };
const stopListeningToWatchlist = () => { if (unsubscribeFromWatchlist) { console.log("Zaustavljam listener..."); unsubscribeFromWatchlist(); unsubscribeFromWatchlist = null; } };
const applyCurrentFilter = () => { if (!watchlistItemsDiv) return; console.log(`Filter: ${currentFilter}`); let f = []; if (currentFilter === 'all') f = [...allUserItems]; else if (currentFilter === 'favorite') f = allUserItems.filter(i => i.favorite); else f = allUserItems.filter(i => i.type === currentFilter); displayItems(f); };

// --- FUNKCIJA ZA PRIKAZ ELEMENATA LISTE (Ista kao prije) ---
const displayItems = (itemsToDisplay) => {
    if (!watchlistItemsDiv) return;
    watchlistItemsDiv.innerHTML = '';
    if (itemsToDisplay.length === 0) { watchlistItemsDiv.innerHTML = `<p class="text-muted text-center mt-5">Nema unosa ${currentFilter !== 'all' ? `za filter "${currentFilter}"` : ''}.</p>`; return; }

    // Sortiranje
    itemsToDisplay.sort((a, b) => { if (a.watched !== b.watched) return a.watched - b.watched; if (a.favorite !== b.favorite) return b.favorite - a.favorite; const tA = a.createdAt?.toDate?.()?.getTime() || 0; const tB = b.createdAt?.toDate?.()?.getTime() || 0; return tB - tA; });

    // Vrati prikaz u grid
    watchlistItemsDiv.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5';

    itemsToDisplay.forEach(item => {
        const colDiv = document.createElement('div'); colDiv.className = 'col';
        const card = document.createElement('div'); card.className = `card h-100 shadow-sm ${item.watched ? 'item-watched' : ''}`;
        let typeIcon = 'bi-question-circle', typeColor = 'text-muted';
        if (item.type === 'Film') { typeIcon = 'bi-film'; typeColor = 'text-primary'; }
        else if (item.type === 'Serija') { typeIcon = 'bi-tv-fill'; typeColor = 'text-success'; }
        else if (item.type === 'Anime') { typeIcon = 'bi-mask'; typeColor = 'text-info'; }

        let cardHTML = `<div class="card-body d-flex flex-column"><div class="d-flex justify-content-between align-items-start mb-2"><div><h5 class="card-title mb-1 d-flex align-items-center"><span class="me-2 favorite-icon-placeholder" data-id="${item.id}"></span><span class="item-title">${item.title || ''}</span></h5><small class="text-muted d-flex align-items-center"><i class="bi ${typeIcon} ${typeColor} me-1"></i> ${item.type || ''}</small></div><div class="item-actions d-flex flex-nowrap ms-2"></div></div><div class="item-details mb-3 flex-grow-1"></div></div>`;
        card.innerHTML = cardHTML;

        const detailsDiv = card.querySelector('.item-details');
        if (detailsDiv) {
            if (item.type === 'Anime' || item.type === 'Serija') { detailsDiv.innerHTML += `<div class="d-flex align-items-center season-episode-controls mb-2"><span class="badge text-bg-secondary me-1">S:</span><input type="number" min="1" value="${item.season || 1}" class="form-control form-control-sm season-input me-2" style="width: 60px;" data-id="${item.id}"><span class="badge text-bg-secondary me-1">E:</span><input type="number" min="1" value="${item.episode || 1}" class="form-control form-control-sm episode-input me-2" style="width: 60px;" data-id="${item.id}"><button class="btn btn-sm btn-outline-success save-progress-btn py-0 px-1 flex-shrink-0" data-id="${item.id}" title="Spremi Sez/Ep"><i class="bi bi-save"></i></button></div>`; }
            if (item.watched) { detailsDiv.innerHTML += `<div class="d-flex align-items-center rating-controls"><label for="rating-${item.id}" class="form-label-sm me-1 mb-0 text-body-secondary">Ocjena:</label><input type="number" min="1" max="10" value="${item.rating || ''}" id="rating-${item.id}" class="form-control form-control-sm rating-input me-1" style="width: 65px;" placeholder="1-10"><button class="btn btn-sm btn-outline-success save-rating-btn py-0 px-1 flex-shrink-0" data-id="${item.id}" title="Spremi ocjenu"><i class="bi bi-save"></i></button></div>`; }
             else { detailsDiv.innerHTML += '<div style="min-height: 31px;"></div>'; }
        }

        const actionsDiv = card.querySelector('.item-actions');
        if (actionsDiv) { const wi = item.watched ? 'bi-check-circle-fill text-success' : 'bi-circle text-secondary'; const wt = item.watched ? 'Nepogledano' : 'Pogledano'; actionsDiv.innerHTML += `<button class="btn btn-sm border-0 rounded-circle p-1 me-1 watched-toggle-btn" data-id="${item.id}" data-watched="${item.watched}" title="${wt}"><i class="bi ${wi}" style="font-size: 1.2rem;"></i></button>`; actionsDiv.innerHTML += `<button class="btn btn-sm btn-outline-danger border-0 rounded-circle p-1 delete-item-btn" data-id="${item.id}" title="Obriši"><i class="bi bi-trash3-fill"></i></button>`; }

        const favPlaceholder = card.querySelector('.favorite-icon-placeholder');
        if (favPlaceholder) { const fic = item.favorite ? 'bi-star-fill text-warning' : 'bi-star text-muted'; const ft = item.favorite ? 'Makni iz omiljenih' : 'Dodaj u omiljene'; favPlaceholder.innerHTML = `<i class="bi ${fic} favorite-toggle-icon" role="button" title="${ft}" style="cursor: pointer; font-size: 1.1rem;"></i>`; }

        colDiv.appendChild(card); watchlistItemsDiv.appendChild(colDiv);
    });
};


// --- Event Listener za Akcije na Listi (Isti kao prije) ---
if (watchlistItemsDiv) { watchlistItemsDiv.addEventListener('click', (e) => { const t = e.target; const delBtn = t.closest('.delete-item-btn'); if (delBtn) { const id = delBtn.dataset.id; if (id && confirm(`Obrisati?`)) deleteItem(id); return; } const saveRateBtn = t.closest('.save-rating-btn'); if (saveRateBtn) { const id = saveRateBtn.dataset.id; const ri = document.getElementById(`rating-${id}`); if (id && ri) { const v = ri.value; if (v === "") { if (confirm("Ukloniti ocjenu?")) updateItemRating(id, null); } else { const n = parseInt(v); if (!isNaN(n) && n >= 1 && n <= 10) updateItemRating(id, n); else alert("Ocjena 1-10."); } } return; } const watchBtn = t.closest('.watched-toggle-btn'); if (watchBtn) { const id = watchBtn.dataset.id; const cw = watchBtn.dataset.watched === 'true'; updateItemWatchedStatus(id, !cw); return; } const favIcon = t.closest('.favorite-toggle-icon'); if (favIcon) { const ph = favIcon.closest('.favorite-icon-placeholder'); const id = ph?.dataset.id; const cf = favIcon.classList.contains('bi-star-fill'); if (id) updateItemFavoriteStatus(id, !cf); return; } const saveProgBtn = t.closest('.save-progress-btn'); if (saveProgBtn) { const id = saveProgBtn.dataset.id; const cardBody = saveProgBtn.closest('.card-body'); const si = cardBody?.querySelector(`.season-input[data-id="${id}"]`); const ei = cardBody?.querySelector(`.episode-input[data-id="${id}"]`); if (id && si && ei) { const ns = parseInt(si.value) || 1; const ne = parseInt(ei.value) || 1; updateItemProgress(id, ns, ne); } return; } }); }
// --- Event Listener za Filtere ---
if (filterControls) { filterControls.addEventListener('change', (e) => { if (e.target.type === 'radio') { currentFilter = e.target.value; applyCurrentFilter(); } }); }

// --- FUNKCIJE ZA BRISANJE I AŽURIRANJE (Iste kao prije) ---
const deleteItem = (id) => { if (!id) return; db.collection('watchlist').doc(id).delete().catch(e => console.error("Err del:", e)); };
const updateItemProgress = (id, s, e) => { if (!id || isNaN(s) || s < 1 || isNaN(e) || e < 1) { alert("Err S/E."); return; } db.collection('watchlist').doc(id).update({ season: s, episode: e }).then(() => showFeedback(`S${s}E${e} spremljeno`)).catch(e => console.error(`Err S/E ${id}:`, e)); };
const updateItemWatchedStatus = (id, ws) => { if (!id) return; const d = { watched: ws }; if (!ws) d.rating = null; db.collection('watchlist').doc(id).update(d).catch(e => console.error(`Err watched=${ws} ${id}:`, e)); };
const updateItemRating = (id, r) => { if (!id) return; if (r !== null && (isNaN(parseInt(r)) || parseInt(r) < 1 || parseInt(r) > 10)) { alert("Ocjena 1-10."); return; } db.collection('watchlist').doc(id).update({ rating: r }).then(() => showFeedback(`Ocjena spremljena`)).catch(e => console.error(`Err rating=${r} ${id}:`, e)); };
const updateItemFavoriteStatus = (id, fs) => { if (!id) return; db.collection('watchlist').doc(id).update({ favorite: fs }).catch(e => console.error(`Err fav=${fs} ${id}:`, e)); };
const showFeedback = (msg, type = 'success') => { console.log(`FEEDBACK (${type}): ${msg}`); /* TODO: Toast */ };

// === DODAVANJE OSTALIH EVENT LISTENER-a ===
if (loginButton) loginButton.addEventListener('click', handleLogin);
if (registerButton) registerButton.addEventListener('click', handleRegister);
if (logoutButton) { logoutButton.addEventListener('click', handleLogout); logoutButton.addEventListener('click', stopListeningToWatchlist); }
if (modalForm) { modalForm.addEventListener('submit', handleSaveItem); console.log('Listener modal submit.'); } else { console.error("Modal forma ?!"); }
if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);

// === Listener za Enter na Login formi ===
// Dovoljno je na password inputu ili cijeloj formi
if (authForm) {
    authForm.addEventListener('submit', (event) => {
         event.preventDefault(); // Spriječi standardno slanje forme
         console.log("Submit forme (Enter?), pokrećem prijavu...");
         handleLogin(); // Pozovi login funkciju
    });
} else if (passwordInput) { // Fallback ako forma nema ID
     passwordInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            console.log("Enter na lozinci, pokrećem prijavu...");
            handleLogin();
        }
    });
}

// Učitaj temu
loadTheme();

// ==========================================================================
// KRAJ script.js KODA
// ==========================================================================