// ==========================================================================
// POČETAK script.js KODA - Verzija s KARTICAMA V2, Autocomplete i PRETRAGOM
// Kompletna Verzija v7 (Ispravak Auth Greške - Direktni pozivi)
// ==========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyAn5aI0Rsna-cCtd_TyxAFWdnjS8TB_7v8", // <-- ZAMIJENI SVOJIM KLJUČEM
    authDomain: "moja-watch-lista.firebaseapp.com", // <-- ZAMIJENI SVOJIM PODACIMA
    projectId: "moja-watch-lista", // <-- ZAMIJENI SVOJIM PODACIMA
    storageBucket: "moja-watch-lista.appspot.com", // <-- ZAMIJENI SVOJIM PODACIMA (provjeri format!)
    messagingSenderId: "473312198206", // <-- ZAMIJENI SVOJIM PODACIMA
    appId: "1:473312198206:web:aeb0eeacd69eb0619e9b6f" // <-- ZAMIJENI SVOJIM PODACIMA
};

// !! API Ključevi !!
const TMDB_API_KEY = '59ec0f59412e524b82f4d99477af0478'; // TVOJ TMDb KLJUČ!
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const POSTER_SIZE = 'w500';
const POSTER_SIZE_THUMB = 'w92';

// Inicijaliziraj Firebase
try { firebase.initializeApp(firebaseConfig); console.log("Firebase inicijaliziran uspješno!"); }
catch (error) { console.error("Firebase greška pri inicijalizaciji:", error); alert("Greška pri povezivanju s bazom podataka."); }

// Reference
const auth = firebase.auth();
const db = firebase.firestore();

// === Dohvati elemente ===
function getEl(id) { const el = document.getElementById(id); return el; }
// Auth
const authSection = getEl('auth-section'), contentSection = getEl('content-section'), authForm = getEl('auth-form'), emailInput = getEl('emailInput'), passwordInput = getEl('passwordInput'), loginButton = getEl('loginButton'), registerButton = getEl('registerButton'), authError = getEl('auth-error');
// Content
const logoutButton = getEl('logoutButton'), userEmailSpan = getEl('userEmail');
const watchlistItemsDiv = getEl('watchlist-items'), loadingIndicator = getEl('loading-indicator');
const themeToggleButton = getEl('theme-toggle-button'), themeToggleIcon = themeToggleButton?.querySelector('i');
const filterControls = getEl('filter-controls');
const searchInput = getEl('searchInput');
// Modal
const addItemModalEl = getEl('addItemModal'), addItemModal = addItemModalEl ? new bootstrap.Modal(addItemModalEl) : null, modalForm = getEl('modal-add-item-form');
const modalTitle = getEl('modalItemTitle'), modalType = getEl('modalItemType'), modalWatched = getEl('modalItemWatched'), modalRatingFields = getEl('modal-rating-fields'), modalRating = getEl('modalItemRating'), modalSeasonFields = getEl('modal-season-episode-fields'), modalSeason = getEl('modalItemSeason'), modalEpisode = getEl('modalItemEpisode'), modalFavorite = getEl('modalItemFavorite');
const titleSuggestionsDiv = getEl('title-suggestions');
const modalTmdbIdInput = getEl('modalTmdbId');
const modalMalIdInput = getEl('modalMalId');
const modalImageUrlInput = getEl('modalImageUrl');
// === KRAJ DOHVAĆANJA ELEMENATA ===

// --- Globalne varijable ---
let unsubscribeFromWatchlist = null, currentUserId = null, allUserItems = [], currentFilter = 'all';

// --- Debounce funkcija ---
function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; };

// --- FUNKCIJE ZA TEMU ---
const applyTheme = (t) => { document.documentElement.setAttribute('data-bs-theme', t); if (themeToggleIcon) themeToggleIcon.className = t === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-stars-fill'; };
const toggleTheme = () => { const newTheme = (document.documentElement.getAttribute('data-bs-theme') || 'light') === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', newTheme); applyTheme(newTheme); };
const loadTheme = () => { applyTheme(localStorage.getItem('theme') || 'dark'); }; // Default tema

// --- AUTH LISTENER ---
auth.onAuthStateChanged(user => {
    currentUserId = user?.uid || null;
    if (user) {
        console.log("[Auth] Korisnik prijavljen:", user.email, user.uid);
        if (authSection) authSection.classList.add('d-none');
        if (contentSection) contentSection.classList.remove('d-none');
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (authError) authError.classList.add('d-none');
        authForm?.reset();
        fetchAndDisplayWatchlist(user.uid);
    } else {
        console.log("[Auth] Korisnik odjavljen.");
        stopListeningToWatchlist();
        allUserItems = []; currentUserId = null; currentFilter = 'all';
        if (authSection) authSection.classList.remove('d-none');
        if (contentSection) contentSection.classList.add('d-none');
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (watchlistItemsDiv) watchlistItemsDiv.innerHTML = '';
        if (loadingIndicator) { loadingIndicator.style.display = 'block'; loadingIndicator.textContent = 'Učitavanje...'; }
        const filterAllRadio = getEl('filterAll'); if (filterAllRadio) filterAllRadio.checked = true;
        if (searchInput) searchInput.value = '';
        console.log("[Auth] Stanje resetirano nakon odjave.");
    }
});

// --- MODAL LISTENERS ---
if (modalType) { modalType.addEventListener('change', () => { const show = modalType.value === 'Anime' || modalType.value === 'Serija'; if (modalSeasonFields) modalSeasonFields.style.display = show ? 'flex' : 'none'; if (!show) { if (modalSeason) modalSeason.value = '1'; if (modalEpisode) modalEpisode.value = '1'; } }); }
if (modalWatched) { modalWatched.addEventListener('change', () => { if (modalRatingFields) modalRatingFields.classList.toggle('d-none', !modalWatched.checked); if (!modalWatched.checked && modalRating) modalRating.value = ''; }); }
if (addItemModalEl) { addItemModalEl.addEventListener('hidden.bs.modal', () => { modalForm?.reset(); if (modalTmdbIdInput) modalTmdbIdInput.value = ''; if (modalMalIdInput) modalMalIdInput.value = ''; if (modalImageUrlInput) modalImageUrlInput.value = ''; if (modalSeasonFields) modalSeasonFields.style.display = 'none'; if (modalRatingFields) modalRatingFields.classList.add('d-none'); if (titleSuggestionsDiv) { titleSuggestionsDiv.innerHTML = ''; titleSuggestionsDiv.style.display = 'none'; } if (modalItemType) modalItemType.value = ''; if (modalWatched) modalWatched.checked = false; if (modalFavorite) modalFavorite.checked = false; }); }

// --- AUTH FUNKCIJE (Vraćeno na direktne pozive) ---
const showAuthError = (msg) => { console.log("[Auth Error Msg]:", msg); if (authError) { authError.textContent = msg; authError.classList.remove('d-none'); } else { alert(msg); } };

const handleLogin = () => {
    console.log("[Auth] Pokrećem prijavu (direktni poziv)...");
    if (!emailInput || !passwordInput || !authError) { console.error("[Auth] Nedostaju input polja ili error div."); return; }
    const e = emailInput.value.trim(), p = passwordInput.value;
    authError.classList.add('d-none');
    console.log("[Auth] Email:", e ? '<unesen>' : '<prazan>', "Lozinka unesena:", p ? 'Da' : 'Ne');
    if (!e || !p) { showAuthError("Unesite email i lozinku."); return; }

    console.log("[Auth] Pozivam signInWithEmailAndPassword...");
    auth.signInWithEmailAndPassword(e, p)
        .then(userCredential => {
            console.log("[Auth] Prijava uspješna za:", userCredential?.user?.email);
            // onAuthStateChanged će odraditi ostatak
        })
        .catch(err => {
            console.error("[Auth] Firebase greška kod prijave:", err);
            let msg = "Greška.";
             if (err && typeof err.code === 'string') {
                switch (err.code) {
                    case 'auth/invalid-credential':
                    case 'auth/wrong-password':
                    case 'auth/user-not-found': msg = "Neispravan email/lozinka."; break;
                    case 'auth/invalid-email': msg = "Neispravan format email adrese."; break;
                    case 'auth/too-many-requests': msg = "Previše neuspješnih pokušaja. Pokušajte ponovo kasnije."; break;
                    default: msg = `Nepoznata greška: ${err.code}`;
                }
             } else {
                 msg = "Dogodila se neočekivana greška.";
                 console.log("[Auth] Neočekivana greška bez koda kod prijave:", err.message);
             }
            showAuthError(msg);
        });
};

const handleRegister = () => {
    console.log("[Auth] Pokrećem registraciju (direktni poziv)...");
    if (!emailInput || !passwordInput || !authError) { console.error("[Auth] Nedostaju input polja ili error div."); return; }
    const e = emailInput.value.trim(), p = passwordInput.value;
    authError.classList.add('d-none');
    console.log("[Auth] Email:", e ? '<unesen>' : '<prazan>', "Lozinka unesena:", p ? 'Da' : 'Ne');
    if (!e || !p) { showAuthError("Unesite email i lozinku."); return; }
    if (p.length < 6) { showAuthError("Lozinka min 6 znakova."); return; }

    console.log("[Auth] Pozivam createUserWithEmailAndPassword...");
    auth.createUserWithEmailAndPassword(e, p)
        .then(userCredential => {
             console.log("[Auth] Registracija uspješna za:", userCredential?.user?.email);
             // onAuthStateChanged će odraditi ostatak
        })
        .catch(err => {
            console.error("[Auth] Firebase greška kod registracije:", err);
            let msg = "Greška.";
             if (err && typeof err.code === 'string') {
                switch (err.code) {
                    case 'auth/email-already-in-use': msg = "Email adresa je već registrirana."; break;
                    case 'auth/weak-password': msg = "Lozinka preslaba."; break;
                    case 'auth/invalid-email': msg = "Neispravan format email adrese."; break;
                    default: msg = `Nepoznata greška: ${err.code}`;
                }
             } else {
                 msg = "Dogodila se neočekivana greška.";
                 console.log("[Auth] Neočekivana greška bez koda kod registracije:", err.message);
             }
            showAuthError(msg);
        });
};

const handleLogout = () => { console.log("[Auth] Pokrećem odjavu..."); auth.signOut().catch(e => console.error("Logout err:", e)); };

// --- SPREMANJE UNOSA ---
const handleSaveItem = async (event) => { event.preventDefault(); if (!modalTitle || !modalType || !modalTmdbIdInput || !modalMalIdInput || !modalImageUrlInput) { console.error("Ključni modalni elementi nedostaju."); alert("Došlo je do greške. Osvježite stranicu."); return; } const title = modalTitle.value.trim(); const type = modalItemType.value; const season = modalSeason?.value || '1'; const episode = modalEpisode?.value || '1'; const watched = modalWatched?.checked || false; const rating = modalRating?.value || ''; const favorite = modalFavorite?.checked || false; const tmdbIdValue = modalTmdbIdInput.value || null; const malIdValue = modalMalIdInput.value || null; const imageUrlValue = modalImageUrlInput.value || null; if (!title || !type) { alert('Unesite naslov i odaberite tip.'); return; } if (watched && !rating) { alert('Ako je pogledano, unesite ocjenu.'); return; } const rNum = parseInt(rating); if (watched && rating && (isNaN(rNum) || rNum < 1 || rNum > 10)) { alert('Ocjena mora biti broj između 1 i 10.'); return; } if (!currentUserId) { console.error("Nema ID-a korisnika kod spremanja."); return; } const newItem = { userId: currentUserId, title, type, watched, favorite, createdAt: firebase.firestore.FieldValue.serverTimestamp(), rating: watched && rating ? rNum : null, tmdbId: (type === 'Film' || type === 'Serija') ? tmdbIdValue : null, malId: type === 'Anime' ? malIdValue : null, tmdbPosterPath: null, sourceImageUrl: type === 'Anime' ? imageUrlValue : null }; if (type === 'Anime' || type === 'Serija') { newItem.season = parseInt(season) || 1; newItem.episode = parseInt(episode) || 1; } let finalPosterPath = null; if ((newItem.type === 'Film' || newItem.type === 'Serija') && newItem.tmdbId && TMDB_API_KEY && TMDB_API_KEY !== 'TVOJ_STVARNI_API_KLJUČ_V3') { const endpointPath = newItem.type === 'Film' ? 'movie' : 'tv'; const detailsUrl = `https://api.themoviedb.org/3/${endpointPath}/${newItem.tmdbId}?api_key=${TMDB_API_KEY}&language=hr-HR`; try { console.log(`Dohvaćam TMDb detalje za poster (${newItem.type}): ${newItem.tmdbId}`); const r = await fetch(detailsUrl); if (r.ok) { const d = await r.json(); finalPosterPath = d.poster_path; console.log(`Pronađen TMDb poster path za ${newItem.type}:`, finalPosterPath); } else { console.warn(`TMDb detalji za ${newItem.type} nisu pronađeni ili greška: ${r.status}`); } } catch (e) { console.error(`Greška pri dohvaćanju TMDb detalja za ${newItem.type}:`, e); } } newItem.tmdbPosterPath = finalPosterPath; console.log('Spremam u Firestore:', newItem); try { const docRef = await db.collection('watchlist').add(newItem); console.log("Dokument uspješno spremljen s ID:", docRef.id); addItemModal?.hide(); } catch (error) { console.error("Greška pri spremanju u Firestore:", error); alert("Došlo je do greške prilikom spremanja unosa."); } };

// --- LISTA & FILTRIRANJE ---
const fetchAndDisplayWatchlist = (userId) => { if (!watchlistItemsDiv || !loadingIndicator || !userId) { console.warn("Nedostaju elementi za prikaz liste ili ID korisnika."); return; } console.log('[Firestore] Dohvaćam watch listu za korisnika:', userId); loadingIndicator.textContent = 'Učitavam...'; loadingIndicator.style.display = 'block'; watchlistItemsDiv.innerHTML = ''; stopListeningToWatchlist(); const query = db.collection('watchlist').where('userId', '==', userId); unsubscribeFromWatchlist = query.onSnapshot( (querySnapshot) => { console.log("[Firestore] Primljene promjene s Firestore-a"); allUserItems = []; querySnapshot.forEach((doc) => { allUserItems.push({ id: doc.id, ...doc.data() }); }); console.log(`[Firestore] Dohvaćeno ${allUserItems.length} unosa.`); if (loadingIndicator) loadingIndicator.style.display = 'none'; applyCurrentFilter(); }, (error) => { console.error("[Firestore] Greška pri dohvaćanju watch liste:", error); if (loadingIndicator) loadingIndicator.textContent = 'Greška pri učitavanju.'; if (error.code === 'permission-denied') { alert("Nemate dozvolu za čitanje podataka. Provjerite Firestore pravila."); } } ); console.log("[Firestore] Listener postavljen."); };
const stopListeningToWatchlist = () => { if (unsubscribeFromWatchlist) { console.log("[Firestore] Zaustavljam Firestore listener..."); unsubscribeFromWatchlist(); unsubscribeFromWatchlist = null; } };

// --- PRIMJENA FILTERA I PRETRAGE ---
const applyCurrentFilter = () => { if (!watchlistItemsDiv) return; console.log(`[Filter] Primjenjujem filter: ${currentFilter}`); let filteredItems = []; if (currentFilter === 'all') { filteredItems = [...allUserItems]; } else if (currentFilter === 'favorite') { filteredItems = allUserItems.filter(item => item.favorite); } else if (currentFilter === 'watching') { filteredItems = allUserItems.filter(item => !item.watched); } else { filteredItems = allUserItems.filter(item => item.type === currentFilter); } const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : ''; if (searchTerm) { console.log(`[Filter] Primjenjujem pretragu: "${searchTerm}"`); filteredItems = filteredItems.filter(item => item.title && typeof item.title === 'string' && item.title.toLowerCase().includes(searchTerm) ); } console.log(`[Filter] Broj itema za prikaz: ${filteredItems.length}`); displayItems(filteredItems); };

// --- FUNKCIJA ZA PRIKAZ ELEMENATA LISTE (KARTICE V2) ---
const displayItems = (itemsToDisplay) => { if (!watchlistItemsDiv) return; watchlistItemsDiv.className = 'row g-3 mb-5'; watchlistItemsDiv.innerHTML = ''; if (itemsToDisplay.length === 0) { let filterText = ''; const searchTerm = searchInput ? searchInput.value.trim() : ''; switch(currentFilter) { case 'all': filterText = ''; break; case 'watching': filterText = ' koje trenutno gledate'; break; case 'favorite': filterText = ' omiljenih'; break; default: filterText = ` tipa "${currentFilter}"`; break; } let searchText = searchTerm ? ` koji odgovaraju pretrazi "${searchTerm}"` : ''; watchlistItemsDiv.innerHTML = `<div class="col-12"><p class="text-muted text-center mt-5">Nema${filterText} unosa${searchText}.</p></div>`; return; } itemsToDisplay.sort((a, b) => { if (a.watched !== b.watched) return a.watched ? 1 : -1; if (a.favorite !== b.favorite) return b.favorite ? -1 : 1; const tA = a.createdAt?.toDate?.()?.getTime() || 0; const tB = b.createdAt?.toDate?.()?.getTime() || 0; return tB - tA; }); itemsToDisplay.forEach(item => { const colDiv = document.createElement('div'); colDiv.className = 'col-12 col-md-6 col-lg-4 d-flex'; const cardDiv = document.createElement('div'); cardDiv.className = `card watchlist-card-v2 flex-fill shadow-sm text-white`; cardDiv.dataset.id = item.id; let backgroundStyle = ''; let overlayClass = 'card-overlay-dark'; if ((item.type === 'Film' || item.type === 'Serija') && item.tmdbPosterPath) { const posterUrl = `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE}${item.tmdbPosterPath}`; backgroundStyle = `background-image: url('${posterUrl}');`; overlayClass = 'card-overlay-blur'; } else if (item.type === 'Anime' && item.sourceImageUrl) { backgroundStyle = `background-image: url('${item.sourceImageUrl}');`; overlayClass = 'card-overlay-blur'; } cardDiv.style.cssText = backgroundStyle; cardDiv.dataset.overlay = overlayClass; let cardContentHTML = `<div class="card-body-content p-3 d-flex flex-column h-100">`; cardContentHTML += `<div class="d-flex justify-content-between align-items-start mb-2"> <div class="d-flex align-items-center me-2 flex-grow-1" style="min-width: 0;"> <span class="favorite-icon-placeholder me-2 flex-shrink-0" title="${item.favorite ? 'Makni omiljeno' : 'Dodaj omiljeno'}" style="cursor:pointer; line-height: 1;"> <i class="bi ${item.favorite ? 'bi-star-fill text-warning' : 'bi-star'} favorite-toggle-card-icon" style="font-size:1.1rem; vertical-align: middle;"></i> </span> <h6 class="card-title mb-0 text-truncate">${item.title || 'N/A'}</h6> </div> <div class="d-flex flex-nowrap card-actions-top flex-shrink-0"> <button class="btn btn-sm border-0 p-0 me-2 watched-toggle-card-btn" data-watched="${item.watched}" title="${item.watched ? 'Označi kao Nepogledano' : 'Označi kao Pogledano'}"> <i class="bi ${item.watched ? 'bi-check-circle-fill text-success' : 'bi-circle'}" style="font-size:1.1rem;"></i> </button> <button class="btn btn-sm border-0 p-0 delete-card-btn" title="Obriši"> <i class="bi bi-trash3-fill text-danger" style="font-size:1.1rem;"></i> </button> </div> </div>`; let typeIconClass = 'bi-question-circle'; let typeIconColor = 'text-secondary'; let typeText = item.type || 'Nepoznato'; if (item.type === 'Serija') { typeIconClass = 'bi-square-fill'; typeIconColor = 'text-success'; } else if (item.type === 'Anime') { typeIconClass = 'bi-circle-fill'; typeIconColor = 'text-info'; } else if (item.type === 'Film') { typeIconClass = 'bi-film'; typeIconColor = 'text-primary'; } cardContentHTML += `<div class="d-flex align-items-center mb-3"> <i class="${typeIconClass} ${typeIconColor} me-2" style="font-size: 0.8rem;"></i> <small class="text-uppercase item-type-text">${typeText}</small> </div>`; cardContentHTML += `<div class="mt-auto">`; if ((item.type === 'Anime' || item.type === 'Serija') && !item.watched) { cardContentHTML += `<div class="se-controls d-flex align-items-center justify-content-center mb-2"> <label for="card-s-${item.id}" class="form-label mb-0 me-1 small fw-bold">S:</label> <input type="number" id="card-s-${item.id}" value="${item.season || '1'}" data-field="season" class="form-control form-control-sm se-input me-2" min="1"> <label for="card-e-${item.id}" class="form-label mb-0 me-1 small fw-bold">E:</label> <input type="number" id="card-e-${item.id}" value="${item.episode || '1'}" data-field="episode" class="form-control form-control-sm se-input me-1" min="1"> <button class="btn btn-sm btn-outline-light episode-increment-btn flex-shrink-0" title="Povećaj epizodu">+</button> </div>`; } else if (item.watched && item.rating) { cardContentHTML += `<div class="text-center mb-2 rating-display"> <span class="fw-bold">Ocjena: ${item.rating}</span> </div>`; } else { cardContentHTML += `<div class="mb-2" style="min-height: 31px;"></div>`; } cardContentHTML += `</div>`; cardContentHTML += `</div>`; cardDiv.innerHTML = cardContentHTML; colDiv.appendChild(cardDiv); watchlistItemsDiv.appendChild(colDiv); }); };

// --- FUNKCIJE ZA AŽURIRANJE ITEM-a ---
const incrementEpisode = (itemId) => { if (!itemId || !currentUserId) return; const item = allUserItems.find(i => i.id === itemId); if (!item || (item.type !== 'Anime' && item.type !== 'Serija')) { console.warn("Item not found or not a Series/Anime:", itemId); return; } const currentEpisode = parseInt(item.episode || '0'); const newEpisode = currentEpisode + 1; db.collection('watchlist').doc(itemId).update({ episode: newEpisode }) .then(() => { console.log(`Epizoda ažurirana na ${newEpisode} za ${itemId}`); }) .catch(e => { console.error(`Greška pri ažuriranju epizode za ${itemId}:`, e); showFeedback(`Greška pri ažuriranju epizode.`, 'danger'); }); };
const updateItemField = (itemId, field, value) => { if (!itemId || !currentUserId || !field) return; const numericValue = parseInt(value); if (isNaN(numericValue) || numericValue < 1) { console.warn(`Neispravna vrijednost za ${field}: ${value}. Vraćam na staro.`); const item = allUserItems.find(i => i.id === itemId); const inputElement = document.getElementById(`card-${field.substring(0, 1)}-${itemId}`); if (inputElement && item) { inputElement.value = item[field] || '1'; } return; } console.log(`Ažuriram polje ${field} na ${numericValue} za ${itemId}`); const updateData = {}; updateData[field] = numericValue; db.collection('watchlist').doc(itemId).update(updateData) .then(() => { console.log(`${field} uspješno ažurirano na ${numericValue} za ${itemId}`); }) .catch(e => { console.error(`Greška pri ažuriranju ${field} za ${itemId}:`, e); showFeedback(`Greška pri ažuriranju polja ${field}.`, 'danger'); }); };
const deleteItem = (id) => { if (!id || !currentUserId) return; db.collection('watchlist').doc(id).delete() .then(() => console.log(`Item ${id} obrisan.`)) .catch(e => console.error(`Greška pri brisanju itema ${id}:`, e)); };
const updateItemWatchedStatus = (id, watchedStatus) => { if (!id || !currentUserId) return; const updateData = { watched: watchedStatus }; if (!watchedStatus) { updateData.rating = null; } db.collection('watchlist').doc(id).update(updateData) .then(() => console.log(`Status watched za ${id} ažuriran na ${watchedStatus}.`)) .catch(e => console.error(`Greška pri ažuriranju watched statusa za ${id}:`, e)); };
const updateItemFavoriteStatus = (id, favoriteStatus) => { if (!id || !currentUserId) return; db.collection('watchlist').doc(id).update({ favorite: favoriteStatus }) .then(() => console.log(`Status favorite za ${id} ažuriran na ${favoriteStatus}.`)) .catch(e => console.error(`Greška pri ažuriranju favorite statusa za ${id}:`, e)); };
const showFeedback = (msg, type = 'info') => { console.log(`FEEDBACK (${type}): ${msg}`); /* TODO: Implementiraj bolji feedback (npr. Toast notifikacije) */ };

// --- AUTOCOMPLETE FUNKCIJE ---
const searchAnime = async (query) => { if (!query || query.length < 3) return []; const encodedQuery = encodeURIComponent(query); const url = `https://api.jikan.moe/v4/anime?q=${encodedQuery}&sfw&limit=5`; console.log(`[API Jikan] Search URL: ${url}`); try { const response = await fetch(url); if (!response.ok) { console.error(`[API Jikan] Greška: ${response.status} ${response.statusText}`); if (response.status === 429) console.warn("[API Jikan] Rate limit premašen!"); return []; } const data = await response.json(); return data.data || []; } catch (error) { console.error("[API Jikan] Greška pri dohvaćanju:", error); return []; } };
const fetchTMDbSuggestions = async (query) => { if (!TMDB_API_KEY || TMDB_API_KEY === 'TVOJ_STVARNI_API_KLJUČ_V3') { console.warn("[API TMDb] Ključ nije postavljen."); return []; } const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=hr-HR&include_adult=false&page=1`; console.log(`[API TMDb Film] Search URL: ${url}`); try { const r = await fetch(url); if (!r.ok) { console.error(`[API TMDb Film] Greška: ${r.status} ${r.statusText}`); return []; } const d = await r.json(); return d.results || []; } catch (e) { console.error("[API TMDb Film] AC greška:", e); return []; } };
const fetchTMDbTvSuggestions = async (query) => { if (!TMDB_API_KEY || TMDB_API_KEY === 'TVOJ_STVARNI_API_KLJUČ_V3') { console.warn("[API TMDb] Ključ nije postavljen."); return []; } const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=hr-HR&include_adult=false&page=1`; console.log(`[API TMDb TV] Search URL: ${url}`); try { const r = await fetch(url); if (!r.ok) { console.error(`[API TMDb TV] Greška: ${r.status} ${r.statusText}`); return []; } const d = await r.json(); return d.results || []; } catch (e) { console.error("[API TMDb TV] AC greška:", e); return []; } };
const fetchAndShowSuggestions = async (q) => { if (!q || q.length < 3) { if (titleSuggestionsDiv) {titleSuggestionsDiv.innerHTML = ''; titleSuggestionsDiv.style.display = 'none';} return; } if (titleSuggestionsDiv) { titleSuggestionsDiv.innerHTML = '<div class="list-group-item text-muted small p-2">Tražim...</div>'; titleSuggestionsDiv.style.display = 'block'; } try { console.log("[Autocomplete] Dohvaćam prijedloge za:", q); const [tmdbMovieResults, jikanAnimeResults, tmdbTvResults] = await Promise.all([ fetchTMDbSuggestions(q), searchAnime(q), fetchTMDbTvSuggestions(q) ]); const combinedSuggestions = []; tmdbMovieResults .filter(m => m.release_date) .slice(0, 4) .forEach(m => { combinedSuggestions.push({ idType: 'tmdbId', idValue: m.id, title: m.title, year: m.release_date.substring(0, 4), imageUrl: m.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_THUMB}${m.poster_path}` : null, itemType: 'Film' }); }); jikanAnimeResults .slice(0, 3) .forEach(a => { let year = a.year || a.aired?.prop?.from?.year || null; combinedSuggestions.push({ idType: 'malId', idValue: a.mal_id, title: a.title, year: year, imageUrl: a.images?.jpg?.image_url || null, itemType: 'Anime' }); }); tmdbTvResults .filter(tv => tv.first_air_date) .slice(0, 3) .forEach(tv => { combinedSuggestions.push({ idType: 'tmdbId', idValue: tv.id, title: tv.name, year: tv.first_air_date.substring(0, 4), imageUrl: tv.poster_path ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE_THUMB}${tv.poster_path}` : null, itemType: 'Serija' }); }); combinedSuggestions.sort((a, b) => a.title.localeCompare(b.title)); displaySuggestions(combinedSuggestions); } catch (error) { console.error("[Autocomplete] Greška pri dohvaćanju kombiniranih prijedloga:", error); if (titleSuggestionsDiv) { titleSuggestionsDiv.innerHTML = '<div class="list-group-item text-danger small p-2">Greška pri pretrazi.</div>'; titleSuggestionsDiv.style.display = 'block'; } } };
const displaySuggestions = (suggestions) => { if (!titleSuggestionsDiv) return; titleSuggestionsDiv.innerHTML = ''; if (!suggestions || suggestions.length === 0) { titleSuggestionsDiv.innerHTML = '<div class="list-group-item text-muted small p-2">Nema rezultata.</div>'; titleSuggestionsDiv.style.display = 'block'; return; } suggestions.forEach(sug => { const itemElement = document.createElement('a'); itemElement.href = "#"; itemElement.className = 'list-group-item list-group-item-action suggestion-item p-2 d-flex align-items-center'; itemElement.dataset.idValue = sug.idValue; itemElement.dataset.idType = sug.idType; itemElement.dataset.title = sug.title; itemElement.dataset.itemType = sug.itemType; itemElement.dataset.imageUrl = sug.imageUrl || ''; const placeholderUrl = 'https://via.placeholder.com/40x60.png?text=N/A'; const thumbUrl = sug.imageUrl || placeholderUrl; const thumbHTML = `<img src="${thumbUrl}" alt="Thumb" class="me-2 suggestion-thumb" loading="lazy">`; let badgeColor = 'bg-secondary'; if (sug.itemType === 'Film') badgeColor = 'bg-primary'; else if (sug.itemType === 'Anime') badgeColor = 'bg-info'; else if (sug.itemType === 'Serija') badgeColor = 'bg-success'; const typeBadge = `<span class="badge rounded-pill ${badgeColor} ms-1 suggestion-type-badge">${sug.itemType}</span>`; const textHTML = ` <div class="flex-grow-1" style="min-width: 0;"> <div class="d-flex w-100 justify-content-between"> <h6 class="mb-0 suggestion-title text-truncate">${sug.title}</h6> <small class="text-muted ms-1 flex-shrink-0">${sug.year ? `(${sug.year})` : ''}</small> </div> <small class="text-muted d-block">${typeBadge}</small> </div>`; itemElement.innerHTML = thumbHTML + textHTML; itemElement.addEventListener('click', (e) => { e.preventDefault(); const { idValue, idType, title, itemType, imageUrl } = e.currentTarget.dataset; console.log(`[Autocomplete] Odabrano: Tip=${itemType}, ID Tip=${idType}, ID Vrijednost=${idValue}, Naslov=${title}, Slika=${imageUrl}`); if (modalTitle) modalTitle.value = title; if (modalItemType) modalItemType.value = itemType; if (modalTmdbIdInput) modalTmdbIdInput.value = (idType === 'tmdbId' ? idValue : ''); if (modalMalIdInput) modalMalIdInput.value = (idType === 'malId' ? idValue : ''); if (modalImageUrlInput) modalImageUrlInput.value = imageUrl || ''; if (titleSuggestionsDiv) { titleSuggestionsDiv.innerHTML = ''; titleSuggestionsDiv.style.display = 'none'; } const showSE = itemType === 'Anime' || itemType === 'Serija'; if (modalSeasonFields) modalSeasonFields.style.display = showSE ? 'flex' : 'none'; if (!showSE) { if (modalSeason) modalSeason.value = '1'; if (modalEpisode) modalEpisode.value = '1'; } if (modalItemType) modalItemType.dispatchEvent(new Event('change')); }); titleSuggestionsDiv.appendChild(itemElement); }); titleSuggestionsDiv.style.display = 'block'; };
const debouncedFetchSuggestions = debounce(fetchAndShowSuggestions, 400);

// === OSTALI EVENT LISTENERI ===
if (loginButton) loginButton.addEventListener('click', handleLogin);
if (registerButton) registerButton.addEventListener('click', handleRegister);
if (logoutButton) logoutButton.addEventListener('click', handleLogout);
if (modalForm) modalForm.addEventListener('submit', handleSaveItem);
if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);
if (authForm) authForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
// Listener za input u polje naslova (Autocomplete)
if (modalTitle) {
    modalTitle.addEventListener('input', (e) => { const query = e.target.value; if (modalTmdbIdInput) modalTmdbIdInput.value = ''; if (modalMalIdInput) modalMalIdInput.value = ''; if (modalImageUrlInput) modalImageUrlInput.value = ''; debouncedFetchSuggestions(query); });
    modalTitle.addEventListener('blur', () => { setTimeout(() => { if (titleSuggestionsDiv && !titleSuggestionsDiv.matches(':hover')) { titleSuggestionsDiv.style.display = 'none';} }, 300); });
    modalTitle.addEventListener('focus', (e) => { if (e.target.value.length >= 3) { debouncedFetchSuggestions(e.target.value); } });
}
// --- Event listeneri za akcije na karticama ---
if (watchlistItemsDiv) {
    watchlistItemsDiv.addEventListener('click', (e) => { const target = e.target; const card = target.closest('.watchlist-card-v2'); if (!card) return; const itemId = card.dataset.id; if (!itemId) return; if (target.closest('.delete-card-btn')) { const title = card.querySelector('.card-title')?.textContent || 'ovaj unos'; if (confirm(`Jeste li sigurni da želite obrisati "${title}"?`)) { deleteItem(itemId); } } else if (target.closest('.watched-toggle-card-btn')) { const watchedButton = target.closest('.watched-toggle-card-btn'); const currentWatchedStatus = watchedButton.dataset.watched === 'true'; updateItemWatchedStatus(itemId, !currentWatchedStatus); } else if (target.closest('.favorite-toggle-card-icon')) { const isCurrentlyFavorite = target.classList.contains('bi-star-fill'); updateItemFavoriteStatus(itemId, !isCurrentlyFavorite); } else if (target.closest('.episode-increment-btn')) { incrementEpisode(itemId); } });
    watchlistItemsDiv.addEventListener('change', (e) => { const target = e.target; if (target.matches('.se-input')) { const card = target.closest('.watchlist-card-v2'); if (!card) return; const itemId = card.dataset.id; const field = target.dataset.field; const newValue = target.value; if (itemId && field) { updateItemField(itemId, field, newValue); } } });
}
// Listener za promjenu filtera
if (filterControls) { filterControls.addEventListener('change', (e) => { if (e.target.type === 'radio' && e.target.name === 'listFilter') { currentFilter = e.target.value; applyCurrentFilter(); } }); }
// Listener za pretragu
if (searchInput) { searchInput.addEventListener('input', () => { applyCurrentFilter(); }); }

// --- Load & Service Worker ---
loadTheme();
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').then(r => console.log('SW OK:', r.scope)).catch(e => console.error('SW Err:', e)); });
} else if (window.location.protocol === 'file:') { console.warn("Service Worker se ne može registrirati na 'file://' protokolu. Pokrenite preko servera (npr. Live Server)."); }
else { console.log("Service Worker nije podržan u ovom pregledniku."); }

// ==========================================================================
// KRAJ script.js KODA
// ==========================================================================