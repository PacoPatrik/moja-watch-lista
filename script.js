// ==========================================================================
// POČETAK script.js KODA - ULTIMATE REDESIGN V2.0
// ==========================================================================

const firebaseConfig = { apiKey: "AIzaSyAn5aI0Rsna-cCtd_TyxAFWdnjS8TB_7v8", authDomain: "moja-watch-lista.firebaseapp.com", projectId: "moja-watch-lista", storageBucket: "moja-watch-lista.appspot.com", messagingSenderId: "473312198206", appId: "1:473312198206:web:aeb0eeacd69eb0619e9b6f" };
const TMDB_API_KEY = '59ec0f59412e524b82f4d99477af0478';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const POSTER_SIZE_CARD = 'w500'; // Veća rezolucija za bolji izgled
const POSTER_SIZE_THUMB = 'w92';
const POSTER_SIZE_MODAL = 'w500';

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase inicijaliziran uspješno!");
    }
} catch (error) {
    console.error("Firebase greška pri inicijalizaciji:", error);
    alert("Greška pri povezivanju s bazom podataka.");
}

const auth = firebase.auth();
const db = firebase.firestore();

function getEl(id) { return document.getElementById(id); }

// Dohvat elemenata
const authSection = getEl('auth-section');
const contentSection = getEl('content-section');
const authForm = getEl('auth-form');
const emailInput = getEl('emailInput');
const passwordInput = getEl('passwordInput');
const loginButton = getEl('loginButton');
const registerButton = getEl('registerButton');
const authError = getEl('auth-error');
const logoutButton = getEl('logoutButton');
const userEmailSpan = getEl('userEmail');
const watchlistItemsDiv = getEl('watchlist-items');
const loadingIndicator = getEl('loading-indicator');
const themeToggleButton = getEl('theme-toggle-button');
const themeToggleIcon = themeToggleButton?.querySelector('i');
const filterControls = getEl('filter-controls');
const searchInput = getEl('searchInput');
const addItemModalEl = getEl('addItemModal');
const addItemModal = addItemModalEl ? new bootstrap.Modal(addItemModalEl) : null;
const modalForm = getEl('modal-add-item-form');
const modalTitle = getEl('modalItemTitle');
const modalItemType = getEl('modalItemType');
const modalWatched = getEl('modalItemWatched');
const modalRatingFields = getEl('modal-rating-fields');
const modalRating = getEl('modalItemRating');
const modalSeasonFields = getEl('modal-season-episode-fields');
const modalSeason = getEl('modalItemSeason');
const modalEpisode = getEl('modalItemEpisode');
const modalFavorite = getEl('modalItemFavorite');
const titleSuggestionsDiv = getEl('title-suggestions');
const modalTmdbIdInput = getEl('modalTmdbId');
const modalMalIdInput = getEl('modalMalId');
const modalImageUrlInput = getEl('modalImageUrl');
const itemDetailsModalEl = getEl('itemDetailsModal');
const itemDetailsModalInstance = itemDetailsModalEl ? new bootstrap.Modal(itemDetailsModalEl) : null;
const itemDetailsModalBody = getEl('itemDetailsModalBody');
const itemDetailsModalLabel = getEl('itemDetailsModalLabel');

let unsubscribeFromWatchlist = null;
let currentUserId = null;
let allUserItems = [];
let currentFilter = 'all';

// --- Pomoćne funkcije ---
function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };

// --- Tema ---
const applyTheme = (t) => {
    document.documentElement.setAttribute('data-bs-theme', t);
    if (themeToggleIcon) themeToggleIcon.className = t === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-stars-fill';
};
const toggleTheme = () => {
    const newTheme = (document.documentElement.getAttribute('data-bs-theme') || 'dark') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
};
const loadTheme = () => {
    applyTheme(localStorage.getItem('theme') || 'dark');
};

// --- Autentifikacija ---
auth.onAuthStateChanged(user => {
    currentUserId = user?.uid || null;
    if (user) {
        if (authSection) authSection.style.display = 'none';
        if (contentSection) contentSection.classList.remove('d-none');
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (authError) authError.classList.add('d-none');
        fetchAndDisplayWatchlist(user.uid);
    } else {
        stopListeningToWatchlist();
        allUserItems = [];
        if (authSection) authSection.style.display = 'flex';
        if (contentSection) contentSection.classList.add('d-none');
        if (watchlistItemsDiv) watchlistItemsDiv.innerHTML = '';
        if (loadingIndicator) { loadingIndicator.style.display = 'block'; loadingIndicator.textContent = 'Učitavanje...'; }
        const filterAllRadio = getEl('filterAll');
        if (filterAllRadio) filterAllRadio.checked = true;
    }
});

// Ostatak funkcija (handleLogin, handleRegister, handleLogout, handleSaveItem, itd.)
// ostaje uglavnom nepromijenjen jer se njihova logika ne mijenja.
// Preskačem ih radi sažetosti, ali vi ih trebate imati u svojoj datoteci.
// Fokusirat ću se na funkciju koja generira HTML, `displayItems`.
// PAŽNJA: U konačnoj datoteci, SVE funkcije iz vašeg originalnog script.js moraju biti prisutne!
// Ovdje slijedi samo izmijenjena funkcija `displayItems` i `displayItems`.

// Zalijepite sve funkcije iz vašeg originalnog script.js ovdje,
// a zatim zamijenite `displayItems` i `showItemDetails` s ovima ispod.

// ... (sve vaše ostale JS funkcije odavde) ...

const showAuthError = (msg) => { if (authError) { authError.textContent = msg; authError.classList.remove('d-none'); } else { alert(msg); } };
const handleLogin = () => { const e = emailInput.value.trim(), p = passwordInput.value; authError.classList.add('d-none'); if (!e || !p) { showAuthError("Unesite email i lozinku."); return; } auth.signInWithEmailAndPassword(e, p).catch((err) => { let msg = "Greška."; switch (err.code) { case 'auth/invalid-credential': case 'auth/wrong-password': case 'auth/user-not-found': msg = "Neispravan email ili lozinka."; break; default: msg = `Dogodila se greška: ${err.message}`; } showAuthError(msg); }); };
const handleRegister = () => { const e = emailInput.value.trim(), p = passwordInput.value; authError.classList.add('d-none'); if (!e || !p) { showAuthError("Unesite email i lozinku."); return; } if (p.length < 6) { showAuthError("Lozinka mora imati najmanje 6 znakova."); return; } auth.createUserWithEmailAndPassword(e, p).catch((err) => { let msg = "Greška."; switch (err.code) { case 'auth/email-already-in-use': msg = "Email adresa je već registrirana."; break; case 'auth/weak-password': msg = "Lozinka je preslaba."; break; default: msg = `Dogodila se greška: ${err.message}`; } showAuthError(msg); }); };
const handleLogout = () => auth.signOut();
const logActivity = (action, itemTitle, details = null) => { if (!currentUserId) return; const logEntry = { userId: currentUserId, action, itemTitle: itemTitle || 'Nepoznat unos', timestamp: firebase.firestore.FieldValue.serverTimestamp(), details }; db.collection('activityLog').add(logEntry); };
const handleSaveItem = async (event) => { event.preventDefault(); const title = modalTitle.value.trim(); const type = modalItemType.value; const season = modalSeason?.value || '1'; const episode = modalEpisode?.value || '1'; const watched = modalWatched?.checked || false; const rating = modalRating?.value || ''; const favorite = modalFavorite?.checked || false; const tmdbIdValue = modalTmdbIdInput.value || null; const malIdValue = modalMalIdInput.value || null; const imageUrlValue = modalImageUrlInput.value || null; if (!title || !type) { alert('Unesite naslov i odaberite tip.'); return; } const rNum = parseInt(rating); if (watched && rating && (isNaN(rNum) || rNum < 1 || rNum > 10)) { alert('Ocjena mora biti broj između 1 i 10.'); return; } if (!currentUserId) return; const newItem = { userId: currentUserId, title, type, watched, favorite, createdAt: firebase.firestore.FieldValue.serverTimestamp(), rating: watched && rating ? rNum : null, tmdbId: (type === 'Film' || type === 'Serija') ? tmdbIdValue : null, malId: type === 'Anime' ? malIdValue : null, tmdbPosterPath: null, sourceImageUrl: type === 'Anime' ? imageUrlValue : null }; if (type === 'Anime' || type === 'Serija') { newItem.season = parseInt(season) || 1; newItem.episode = parseInt(episode) || 1; } let finalPosterPath = null; if ((newItem.type === 'Film' || newItem.type === 'Serija') && newItem.tmdbId && TMDB_API_KEY) { const endpointPath = newItem.type === 'Film' ? 'movie' : 'tv'; const detailsUrl = `https://api.themoviedb.org/3/${endpointPath}/${newItem.tmdbId}?api_key=${TMDB_API_KEY}&language=hr-HR`; try { const r = await fetch(detailsUrl); if (r.ok) { const d = await r.json(); finalPosterPath = d.poster_path; } } catch (e) { console.error(`Greška pri dohvaćanju TMDb detalja:`, e); } } newItem.tmdbPosterPath = finalPosterPath; try { await db.collection('watchlist').add(newItem); logActivity('dodano', newItem.title); if(addItemModal) addItemModal.hide(); } catch (error) { console.error("Greška pri spremanju:", error); alert("Greška prilikom spremanja."); } };
const stopListeningToWatchlist = () => { if (unsubscribeFromWatchlist) { unsubscribeFromWatchlist(); unsubscribeFromWatchlist = null; } };
const fetchAndDisplayWatchlist = (userId) => { if (!watchlistItemsDiv || !loadingIndicator || !userId) return; loadingIndicator.textContent = 'Učitavam...'; loadingIndicator.style.display = 'block'; watchlistItemsDiv.innerHTML = ''; stopListeningToWatchlist(); const query = db.collection('watchlist').where('userId', '==', userId); unsubscribeFromWatchlist = query.onSnapshot( (querySnapshot) => { allUserItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); if (loadingIndicator) loadingIndicator.style.display = 'none'; applyCurrentFilter(); }, (error) => { if (loadingIndicator) loadingIndicator.textContent = 'Greška pri učitavanju.'; console.error("Firestore greška:", error); } ); };
const applyCurrentFilter = () => { if (!watchlistItemsDiv) return; let filteredItems = []; if (currentFilter === 'all') { filteredItems = [...allUserItems]; } else if (currentFilter === 'favorite') { filteredItems = allUserItems.filter(item => item.favorite); } else if (currentFilter === 'watching') { filteredItems = allUserItems.filter(item => !item.watched); } else { filteredItems = allUserItems.filter(item => item.type === currentFilter); } const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : ''; if (searchTerm) { filteredItems = filteredItems.filter(item => item.title && item.title.toLowerCase().includes(searchTerm) ); } displayItems(filteredItems); };
const deleteItem = (id) => { const itemToDelete = allUserItems.find(i => i.id === id); if (confirm(`Jeste li sigurni da želite obrisati "${itemToDelete.title}"?`)) { db.collection('watchlist').doc(id).delete().then(() => { logActivity('obrisano', itemToDelete.title); }); } };
const updateItemWatchedStatus = (id, watchedStatus) => { const item = allUserItems.find(i => i.id === id); db.collection('watchlist').doc(id).update({ watched: watchedStatus, rating: watchedStatus ? item.rating : null }).then(() => { logActivity(watchedStatus ? 'pogledano' : 'nepogledano', item.title); }); };
const updateItemFavoriteStatus = (id, favoriteStatus) => { const item = allUserItems.find(i => i.id === id); db.collection('watchlist').doc(id).update({ favorite: favoriteStatus }).then(() => { logActivity(favoriteStatus ? 'omiljeno+' : 'omiljeno-', item.title); }); };
const fetchTMDbSuggestions = async (query) => { const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=hr-HR&page=1`; try { const r = await fetch(url); const d = await r.json(); return d.results || []; } catch (e) { return []; } };
const searchAnime = async (query) => { const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&sfw&limit=5`; try { const r = await fetch(url); const d = await r.json(); return d.data || []; } catch (e) { return []; } };
const fetchTMDbTvSuggestions = async (query) => { const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=hr-HR&page=1`; try { const r = await fetch(url); const d = await r.json(); return d.results || []; } catch (e) { return []; } };
const fetchAndShowSuggestions = async (q) => { if (q.length < 3) { if(titleSuggestionsDiv) titleSuggestionsDiv.style.display = 'none'; return; } if(titleSuggestionsDiv) { titleSuggestionsDiv.innerHTML = '<div class="list-group-item text-muted small p-2">Tražim...</div>'; titleSuggestionsDiv.style.display = 'block'; } const [tmdbMovieResults, jikanAnimeResults, tmdbTvResults] = await Promise.all([ fetchTMDbSuggestions(q), searchAnime(q), fetchTMDbTvSuggestions(q) ]); const combinedSuggestions = [ ...tmdbMovieResults.slice(0, 4).map(m => ({ idType: 'tmdbId', idValue: m.id, title: m.title, year: m.release_date?.substring(0, 4), imageUrl: m.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_THUMB}${m.poster_path}` : null, itemType: 'Film' })), ...jikanAnimeResults.slice(0, 3).map(a => ({ idType: 'malId', idValue: a.mal_id, title: a.title, year: a.year || a.aired?.prop?.from?.year, imageUrl: a.images?.jpg?.image_url, itemType: 'Anime' })), ...tmdbTvResults.slice(0, 3).map(tv => ({ idType: 'tmdbId', idValue: tv.id, title: tv.name, year: tv.first_air_date?.substring(0, 4), imageUrl: tv.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_THUMB}${tv.poster_path}` : null, itemType: 'Serija' }))]; displaySuggestions(combinedSuggestions); };
const displaySuggestions = (suggestions) => { if (!titleSuggestionsDiv) return; titleSuggestionsDiv.innerHTML = ''; if (!suggestions || suggestions.length === 0) { titleSuggestionsDiv.innerHTML = '<div class="list-group-item text-muted small p-2">Nema rezultata.</div>'; titleSuggestionsDiv.style.display = 'block'; return; } suggestions.forEach(sug => { const itemElement = document.createElement('a'); itemElement.href = "#"; itemElement.className = 'list-group-item list-group-item-action suggestion-item p-2 d-flex align-items-center'; itemElement.dataset.idValue = sug.idValue; itemElement.dataset.idType = sug.idType; itemElement.dataset.title = sug.title; itemElement.dataset.itemType = sug.itemType; itemElement.dataset.imageUrl = sug.imageUrl || ''; const thumbHTML = `<img src="${sug.imageUrl || 'https://via.placeholder.com/40x60'}" alt="Thumb" class="me-2 rounded" style="width:40px; height:60px; object-fit:cover;">`; let badgeColor = 'bg-secondary'; if (sug.itemType === 'Film') badgeColor = 'bg-primary'; else if (sug.itemType === 'Anime') badgeColor = 'bg-info'; else if (sug.itemType === 'Serija') badgeColor = 'bg-success'; const typeBadge = `<span class="badge ${badgeColor}">${sug.itemType}</span>`; const textHTML = ` <div class="flex-grow-1"><div class="d-flex w-100 justify-content-between"><h6 class="mb-1 text-truncate">${sug.title}</h6><small class="text-muted ms-2">${sug.year || ''}</small></div><small>${typeBadge}</small></div>`; itemElement.innerHTML = thumbHTML + textHTML; itemElement.addEventListener('click', (e) => { e.preventDefault(); const { idValue, idType, title, itemType, imageUrl } = e.currentTarget.dataset; if (modalTitle) modalTitle.value = title; if (modalItemType) modalItemType.value = itemType; if (modalTmdbIdInput) modalTmdbIdInput.value = (idType === 'tmdbId' ? idValue : ''); if (modalMalIdInput) modalMalIdInput.value = (idType === 'malId' ? idValue : ''); if (modalImageUrlInput) modalImageUrlInput.value = imageUrl || ''; if (titleSuggestionsDiv) titleSuggestionsDiv.style.display = 'none'; if (modalItemType) modalItemType.dispatchEvent(new Event('change')); }); titleSuggestionsDiv.appendChild(itemElement); }); titleSuggestionsDiv.style.display = 'block'; };
const debouncedFetchSuggestions = debounce(fetchAndShowSuggestions, 400);

// ... (zalijepite i ostale vaše helper funkcije i event listenere) ...


// =========================================================================
// === POTPUNO NOVA `displayItems` FUNKCIJA ===
// =========================================================================
const displayItems = (itemsToDisplay) => {
    if (!watchlistItemsDiv) return;
    watchlistItemsDiv.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        // Nova "Hero" sekcija kad nema unosa
        watchlistItemsDiv.innerHTML = `
            <div class="col-12">
                <div class="hero-section">
                    <div class="hero-icon"><i class="bi bi-film"></i></div>
                    <h2 class="fw-bold">Vaša Watch Lista je prazna</h2>
                    <p class="lead text-muted mb-4">Dodajte svoj prvi film, seriju ili anime kako biste započeli.</p>
                    <button type="button" class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#addItemModal">
                        <i class="bi bi-plus-circle-fill me-2"></i>Dodaj Prvi Unos
                    </button>
                </div>
            </div>`;
        return;
    }

    // Sortiranje: Negledani i Omiljeni prvi, zatim po datumu dodavanja
    itemsToDisplay.sort((a, b) => {
        if (a.watched !== b.watched) return a.watched ? 1 : -1;
        if (a.favorite !== b.favorite) return b.favorite ? -1 : 1;
        const tA = a.createdAt?.toDate?.()?.getTime() || 0;
        const tB = b.createdAt?.toDate?.()?.getTime() || 0;
        return tB - tA;
    });

    itemsToDisplay.forEach(item => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-4 col-lg-3 col-xl-2';

        const watchedClass = item.watched ? 'item-watched-card' : '';
        const cardDiv = document.createElement('div');
        cardDiv.className = `watchlist-item-card-v2 ${watchedClass}`;
        cardDiv.dataset.itemId = item.id;

        // Poster
        let posterSrc = '';
        if (item.tmdbPosterPath) {
            posterSrc = `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_CARD}${item.tmdbPosterPath}`;
        } else if (item.sourceImageUrl) {
            posterSrc = item.sourceImageUrl;
        }
        const posterHTML = `<img src="${posterSrc}" class="card-v2-poster" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/500x750/191A23/EAEAEA?text=Nema+Slike';">`;

        // Tip badge
        let typeBadgeClass = 'bg-secondary';
        if (item.type === 'Film') typeBadgeClass = 'bg-primary';
        else if (item.type === 'Serija') typeBadgeClass = 'bg-success';
        else if (item.type === 'Anime') typeBadgeClass = 'bg-info text-dark';
        const typeBadgeHTML = `<span class="badge rounded-pill ${typeBadgeClass} card-v2-badge">${item.type || 'N/A'}</span>`;

        // Overlay s informacijama
        let detailsText = '';
        if (item.type === 'Serija' || item.type === 'Anime') {
            detailsText += `S: ${item.season || '?'} E: ${item.episode || '?'} • `;
        }
        if (item.watched && item.rating) {
            detailsText += `Ocjena: ${item.rating}/10`;
        }
        const contentOverlayHTML = `
            <div class="card-v2-content-overlay">
                <h5 class="card-v2-title">${item.title || 'Nepoznat naslov'}</h5>
                <p class="card-v2-details">${detailsText}</p>
            </div>`;

        // Akcije (gumbi)
        const favoriteIconClass = item.favorite ? 'bi-heart-fill text-danger' : 'bi-heart';
        const watchedIconClass = item.watched ? 'bi-arrow-counterclockwise' : 'bi-check-lg'; // Promjena ikone za watched
        const watchedTitle = item.watched ? 'Označi kao nepogledano' : 'Označi kao pogledano';
        const actionsHTML = `
            <div class="card-v2-actions">
                <button class="btn favorite-toggle-btn" title="${item.favorite ? 'Makni omiljeno' : 'Dodaj omiljeno'}"><i class="bi ${favoriteIconClass}"></i></button>
                <button class="btn watched-toggle-btn" title="${watchedTitle}"><i class="bi ${watchedIconClass}"></i></button>
                <button class="btn delete-item-btn" title="Obriši"><i class="bi bi-trash3"></i></button>
            </div>`;

        // Watched overlay
        const watchedOverlayHTML = item.watched ? `<div class="card-v2-watched-overlay"><i class="bi bi-check-circle-fill"></i></div>` : '';

        cardDiv.innerHTML = posterHTML + typeBadgeHTML + contentOverlayHTML + actionsHTML + watchedOverlayHTML;
        
        // Klik na karticu (ne na gumb) otvara detalje
        cardDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                showItemDetails(item.id);
            }
        });

        colDiv.appendChild(cardDiv);
        watchlistItemsDiv.appendChild(colDiv);
    });
};


// =========================================================================
// === POTPUNO NOVA `showItemDetails` FUNKCIJA ===
// =========================================================================
const showItemDetails = async (itemId) => {
    if (!itemDetailsModalInstance || !itemDetailsModalBody || !itemDetailsModalLabel) return;
    
    itemDetailsModalBody.innerHTML = '<div class="text-center p-5"><div class="spinner-border" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Učitavanje...</span></div></div>';
    itemDetailsModalInstance.show();

    const item = allUserItems.find(i => i.id === itemId);
    if (!item) {
        itemDetailsModalBody.innerHTML = '<p class="text-danger p-5">Greška: Unos nije pronađen.</p>';
        return;
    }

    itemDetailsModalLabel.textContent = item.title || 'Detalji Unosa';

    // Osnovni podaci
    let posterSrc = '';
    if (item.tmdbPosterPath) posterSrc = `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_MODAL}${item.tmdbPosterPath}`;
    else if (item.sourceImageUrl) posterSrc = item.sourceImageUrl;
    
    let detailsHTML = `<div class="row g-4">`;
    detailsHTML += `<div class="col-lg-4 text-center"><img src="${posterSrc}" alt="${item.title}" class="detail-poster img-fluid" onerror="this.onerror=null;this.style.display='none';"></div>`;
    detailsHTML += `<div class="col-lg-8 d-flex flex-column">`;
    detailsHTML += `<div><h2 class="fw-bold mb-1">${item.title}</h2>`;
    detailsHTML += `<p class="mb-3"><span class="badge bg-primary me-2 fs-6">${item.type}</span>`;
    if(item.favorite) detailsHTML += `<span class="badge bg-warning text-dark fs-6"><i class="bi bi-heart-fill me-1"></i>Omiljeno</span>`;
    detailsHTML += `</p></div>`;

    // Dohvaćanje dodatnih detalja s API-ja
    let apiDetails = '';
    if (item.tmdbId && (item.type === 'Film' || item.type === 'Serija') && TMDB_API_KEY) {
        const endpoint = item.type === 'Film' ? 'movie' : 'tv';
        const url = `https://api.themoviedb.org/3/${endpoint}/${item.tmdbId}?api_key=${TMDB_API_KEY}&language=hr-HR&append_to_response=credits`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.overview) apiDetails += `<h5 class="mt-4">Opis</h5><p class="text-secondary">${data.overview}</p>`;
                if (data.genres?.length) apiDetails += `<p class="mb-1"><strong class="text-light">Žanrovi:</strong> ${data.genres.map(g => g.name).join(', ')}</p>`;
                if (data.credits?.cast?.length) apiDetails += `<p class="mb-1"><strong class="text-light">Glumci:</strong> ${data.credits.cast.slice(0, 5).map(c => c.name).join(', ')}</p>`;
                if (data.release_date) apiDetails += `<p class="mb-1"><strong class="text-light">Datum izlaska:</strong> ${new Date(data.release_date).toLocaleDateString('hr-HR')}</p>`;
                if (data.first_air_date) apiDetails += `<p class="mb-1"><strong class="text-light">Prvo emitiranje:</strong> ${new Date(data.first_air_date).toLocaleDateString('hr-HR')}</p>`;
            }
        } catch (e) { console.error("API Fetch Error:", e); }
    }
    detailsHTML += `<div class="mt-auto">`; // Forma i API detalji na dnu
    detailsHTML += apiDetails;
    detailsHTML += `<hr class="my-4">`;
    detailsHTML += `<form id="editItemForm" data-item-id="${item.id}">`;
    if (item.type === 'Serija' || item.type === 'Anime') {
        detailsHTML += `<div class="row g-3 mb-3 align-items-end"><div class="col"><label for="modalEditSeason" class="form-label">Sezona</label><input type="number" id="modalEditSeason" class="form-control" value="${item.season || 1}" min="1"></div><div class="col"><label for="modalEditEpisode" class="form-label">Epizoda</label><input type="number" id="modalEditEpisode" class="form-control" value="${item.episode || 1}" min="1"></div><div class="col-auto"><button type="button" class="btn btn-outline-light modal-episode-increment-btn" title="Povećaj epizodu za 1">+</button></div></div>`;
    }
    if (item.watched) {
        detailsHTML += `<p class="text-success mb-2"><i class="bi bi-check-circle-fill me-1"></i> Pogledano</p>`;
        detailsHTML += `<div class="row g-3"><div class="col"><label for="modalEditRating" class="form-label">Ocjena (1-10)</label><input type="number" id="modalEditRating" class="form-control" value="${item.rating || ''}" min="1" max="10" placeholder="N/A"></div></div>`;
    } else {
        detailsHTML += `<p class="text-info mb-2"><i class="bi bi-eye-fill me-1"></i> Trenutno gledam / Nepogledano</p>`;
    }
    detailsHTML += `<button type="submit" class="btn btn-primary mt-4">Spremi Promjene</button></form>`;
    detailsHTML += `</div></div></div>`; // Kraj .mt-auto, .col-lg-8 i .row
    itemDetailsModalBody.innerHTML = detailsHTML;
    
    // Ponovno dodavanje event listenera na novu formu
    const editForm = itemDetailsModalBody.querySelector('#editItemForm');
    if (editForm) editForm.addEventListener('submit', handleEditItemSubmit);
    const incBtn = itemDetailsModalBody.querySelector('.modal-episode-increment-btn');
    if (incBtn) incBtn.addEventListener('click', handleModalEpisodeIncrement);
};

// ... Ovdje idu ostale vaše funkcije, kao handleEditItemSubmit, handleModalEpisodeIncrement, itd.
// One ne zahtijevaju velike izmjene.

const handleEditItemSubmit = async (event) => { event.preventDefault(); const form = event.target; const itemId = form.dataset.itemId; if (!itemId) return; const item = allUserItems.find(i => i.id === itemId); if (!item) return; const updates = {}; const modalSeasonInput = form.querySelector('#modalEditSeason'); if (modalSeasonInput) { const newSeason = parseInt(modalSeasonInput.value); if (newSeason !== (item.season || 1)) updates.season = newSeason; } const modalEpisodeInput = form.querySelector('#modalEditEpisode'); if (modalEpisodeInput) { const newEpisode = parseInt(modalEpisodeInput.value); if (newEpisode !== (item.episode || 1)) updates.episode = newEpisode; } const modalRatingInput = form.querySelector('#modalEditRating'); if (modalRatingInput && item.watched) { const newRatingRaw = modalRatingInput.value; if (newRatingRaw === '') { if (item.rating !== null) updates.rating = null; } else { const newRating = parseInt(newRatingRaw); if (newRating >= 1 && newRating <= 10 && newRating !== item.rating) updates.rating = newRating; } } if (Object.keys(updates).length > 0) { await db.collection('watchlist').doc(itemId).update(updates); logActivity('uređeno', item.title, Object.keys(updates).join(', ')); if (itemDetailsModalInstance) itemDetailsModalInstance.hide(); } else { if (itemDetailsModalInstance) itemDetailsModalInstance.hide(); } };
const handleModalEpisodeIncrement = (event) => { const form = event.target.closest('form'); if (!form) return; const episodeInput = form.querySelector('#modalEditEpisode'); if (episodeInput) { episodeInput.value = (parseInt(episodeInput.value) || 0) + 1; } };


// --- Event Listeneri ---
if (loginButton) loginButton.addEventListener('click', handleLogin);
if (registerButton) registerButton.addEventListener('click', handleRegister);
if (logoutButton) logoutButton.addEventListener('click', handleLogout);
if (modalForm) modalForm.addEventListener('submit', handleSaveItem);
if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);
if (authForm) authForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
if (modalTitle) { modalTitle.addEventListener('input', (e) => { debouncedFetchSuggestions(e.target.value); }); modalTitle.addEventListener('blur', () => { setTimeout(() => { if (titleSuggestionsDiv && !titleSuggestionsDiv.matches(':hover')) { titleSuggestionsDiv.style.display = 'none';} }, 300); }); }
if (filterControls) { filterControls.addEventListener('change', (e) => { if (e.target.name === 'listFilter') { currentFilter = e.target.value; applyCurrentFilter(); } }); }
if (searchInput) { searchInput.addEventListener('input', debounce(applyCurrentFilter, 300)); }

if (watchlistItemsDiv) {
    watchlistItemsDiv.addEventListener('click', (e) => {
        const button = e.target.closest('.btn');
        if (!button) return;

        const card = e.target.closest('.watchlist-item-card-v2');
        if (!card) return;

        const itemId = card.dataset.itemId;
        if (!itemId) return;

        const item = allUserItems.find(i => i.id === itemId);
        if (!item) return;

        if (button.classList.contains('favorite-toggle-btn')) {
            updateItemFavoriteStatus(itemId, !item.favorite);
        } else if (button.classList.contains('watched-toggle-btn')) {
            updateItemWatchedStatus(itemId, !item.watched);
        } else if (button.classList.contains('delete-item-btn')) {
            deleteItem(itemId);
        }
    });
}

// Pokreni sve na učitavanju stranice
loadTheme();
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }