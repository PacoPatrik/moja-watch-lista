// ====================================================================
// POČETAK profile_script.js KODA - v4: Statistika + Povijest Aktivnosti (Ispravljeno)
// ====================================================================

// Firebase Konfiguracija
const firebaseConfig = { apiKey: "AIzaSyAn5aI0Rsna-cCtd_TyxAFWdnjS8TB_7v8", authDomain: "moja-watch-lista.firebaseapp.com", projectId: "moja-watch-lista", storageBucket: "moja-watch-lista.appspot.com", messagingSenderId: "473312198206", appId: "1:473312198206:web:aeb0eeacd69eb0619e9b6f" };

// Inicijaliziraj Firebase
if (!firebase.apps.length) { try { firebase.initializeApp(firebaseConfig); console.log("Firebase inicijaliziran na profil stranici."); } catch (error) { console.error("Firebase greška pri inicijalizaciji (profil):", error); alert("Greška pri povezivanju s bazom podataka."); } }

// Reference
const auth = firebase.auth();
const db = firebase.firestore();

// === Dohvati elemente ===
function getEl(id) { const el = document.getElementById(id); return el; }
const profileContent = getEl('profile-content');
const authRequiredMessage = getEl('auth-required-message');
const userEmailSpanProfile = getEl('userEmail-profile');
const logoutButtonProfile = getEl('logoutButton-profile');
const themeToggleButtonProfile = getEl('theme-toggle-button-profile');
const themeToggleIconProfile = themeToggleButtonProfile?.querySelector('i');
const changePasswordButton = getEl('changePasswordButton');
const deleteAccountButton = getEl('deleteAccountButton');
const statsLoading = getEl('stats-loading'); const statsDisplay = getEl('stats-display'); const statTotal = getEl('stat-total'); const statWatched = getEl('stat-watched'); const statWatching = getEl('stat-watching'); const statFavorites = getEl('stat-favorites'); const statAvgRating = getEl('stat-avg-rating'); const statByType = getEl('stat-by-type'); const statMostFrequentType = getEl('stat-most-frequent-type');
const activityLogLoading = getEl('activity-log-loading');
const activityLogList = getEl('activity-log-list');
const noActivityLogMessage = getEl('no-activity-log');
// === KRAJ DOHVAĆANJA ELEMENATA ===

// --- FUNKCIJE ZA TEMU ---
const applyThemeProfile = (t) => { document.documentElement.setAttribute('data-bs-theme', t); if (themeToggleIconProfile) themeToggleIconProfile.className = t === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-stars-fill'; };
const toggleThemeProfile = () => { const newTheme = (document.documentElement.getAttribute('data-bs-theme') || 'light') === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', newTheme); applyThemeProfile(newTheme); };
const loadThemeProfile = () => { applyThemeProfile(localStorage.getItem('theme') || 'dark'); };


// --- PROVJERA AUTENTIFIKACIJE ---
auth.onAuthStateChanged(user => {
    console.log("[Profil Auth] Stanje promijenjeno. Korisnik:", user ? user.email : 'null');
    if (user) {
        if (authRequiredMessage) authRequiredMessage.classList.add('d-none');
        if (profileContent) profileContent.classList.remove('d-none');
        if (userEmailSpanProfile) userEmailSpanProfile.textContent = user.email;
        loadUserStats(user.uid);
        loadActivityLog(user.uid); // Pozovi dohvat povijesti
    } else {
        if (authRequiredMessage) authRequiredMessage.classList.remove('d-none');
        if (profileContent) profileContent.classList.add('d-none');
        if (statsDisplay) statsDisplay.classList.add('d-none'); if (statsLoading) statsLoading.classList.remove('d-none'); if (activityLogList) activityLogList.innerHTML = ''; if (noActivityLogMessage) noActivityLogMessage.classList.add('d-none'); if (activityLogLoading) activityLogLoading.classList.remove('d-none');
    }
});

// --- Funkcija za odjavu ---
const handleLogoutProfile = () => { console.log("[Profil] Pokrećem odjavu..."); auth.signOut().then(() => { console.log("[Profil] Odjava uspješna."); }).catch(e => console.error("Logout err (Profil):", e)); };

// --- Funkcija za promjenu lozinke ---
const handleChangePassword = () => { const user = auth.currentUser; if (!user || !user.email) { alert("Niste prijavljeni ili email nije dostupan."); return; } const userEmail = user.email; if (confirm(`Poslati email za promjenu lozinke na adresu ${userEmail}?`)) { console.log(`[Profil] Šaljem email za reset lozinke na ${userEmail}`); auth.sendPasswordResetEmail(userEmail) .then(() => { console.log("[Profil] Email za reset poslan."); alert("Email za promjenu lozinke je poslan. Provjerite svoj inbox (uključujući spam/junk mapu)."); }) .catch((error) => { console.error("[Profil] Greška slanja emaila za reset lozinke:", error); alert(`Došlo je do greške prilikom slanja emaila: ${error.message}`); }); } else { console.log("[Profil] Korisnik otkazao slanje emaila za reset."); } };

// --- Funkcija za brisanje računa ---
const handleDeleteAccount = () => { const user = auth.currentUser; if (!user || !user.email) { alert("Niste prijavljeni."); return; } const emailForConfirmation = user.email; const confirmation1 = prompt(`⚠️ **UPOZORENJE!** ⚠️\n\nOva akcija će **trajno obrisati** vaš korisnički račun iz sustava autentifikacije. Vaša watch lista (${emailForConfirmation}) **neće** biti automatski obrisana iz baze podataka ovom akcijom.\n\nZa nastavak i brisanje računa, upišite vašu email adresu točno kako je prikazana:`); if (confirmation1 === null) { alert("Brisanje računa otkazano."); return; } if (confirmation1.toLowerCase() !== emailForConfirmation.toLowerCase()) { alert("Upisani email nije ispravan. Brisanje računa otkazano."); return; } const confirmation2 = confirm("JESTE LI APSOLUTNO SIGURNI DA ŽELITE OBRISATI SVOJ RAČUN?\n\nOva radnja se ne može poništiti!"); if (confirmation2) { console.warn(`[Profil] Pokušaj brisanja Auth računa za korisnika: ${emailForConfirmation}`); alert("Brisanje korisničkog računa iz autentifikacije...\nNapomena: Podaci watch liste ostat će u bazi."); user.delete() .then(() => { console.log(`[Profil] Korisnički račun ${emailForConfirmation} uspješno obrisan iz Autentifikacije.`); alert("Vaš korisnički račun je uspješno obrisan. Bit ćete odjavljeni."); }) .catch((error) => { console.error("[Profil] Greška prilikom brisanja korisničkog računa:", error); if (error.code === 'auth/requires-recent-login') { alert("Ova operacija zahtijeva nedavnu prijavu. Molimo odjavite se pa ponovo prijavite i pokušajte opet."); } else { alert(`Došlo je do greške prilikom brisanja računa: ${error.message}`); } }); } else { alert("Brisanje računa otkazano."); } };

// --- Funkcija za dohvat i prikaz statistike ---
const loadUserStats = async (userId) => { if (!statsLoading || !statsDisplay || !userId) return; console.log("[Stats] Učitavam statistiku za:", userId); statsLoading.classList.remove('d-none'); statsDisplay.classList.add('d-none'); try { const querySnapshot = await db.collection('watchlist').where('userId', '==', userId).get(); const totalItems = querySnapshot.size; let watchedCount = 0; let favoriteCount = 0; let ratingSum = 0; let ratedCount = 0; const typeCounts = { Film: 0, Serija: 0, Anime: 0, Nepoznato: 0 }; querySnapshot.forEach(doc => { const data = doc.data(); if (data.watched) { watchedCount++; if (data.rating && typeof data.rating === 'number') { ratingSum += data.rating; ratedCount++; } } if (data.favorite) favoriteCount++; const itemType = data.type || 'Nepoznato'; if (typeCounts.hasOwnProperty(itemType)) { typeCounts[itemType]++; } else { typeCounts['Nepoznato']++; } }); const watchingCount = totalItems - watchedCount; const averageRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : 'N/A'; let mostFrequentType = '-'; let maxCount = 0; for (const type in typeCounts) { if (type === 'Nepoznato' && (typeCounts.Film > 0 || typeCounts.Serija > 0 || typeCounts.Anime > 0) && typeCounts.Nepoznato === 0) continue; if (typeCounts[type] > maxCount) { maxCount = typeCounts[type]; mostFrequentType = type; } else if (typeCounts[type] === maxCount && maxCount > 0) { if (mostFrequentType !== '-') { mostFrequentType += `, ${type}`; } else { mostFrequentType = type; } } } if (maxCount === 0 && totalItems === 0) mostFrequentType = 'Nema Unosa'; if (statTotal) statTotal.textContent = totalItems; if (statWatched) statWatched.textContent = watchedCount; if (statWatching) statWatching.textContent = watchingCount; if (statFavorites) statFavorites.textContent = favoriteCount; if (statAvgRating) statAvgRating.textContent = averageRating; if (statByType) { statByType.innerHTML = `Filmovi: <strong>${typeCounts.Film}</strong><br> Serije: <strong>${typeCounts.Serija}</strong><br> Anime: <strong>${typeCounts.Anime}</strong> ${typeCounts.Nepoznato > 0 ? `<br>Nepoznato: <strong>${typeCounts.Nepoznato}</strong>` : ''} `; } if (statMostFrequentType) statMostFrequentType.textContent = mostFrequentType; statsLoading.classList.add('d-none'); statsDisplay.classList.remove('d-none'); console.log("[Stats] Statistika učitana."); } catch (error) { console.error("Greška pri dohvaćanju statistike:", error); if (statsLoading) statsLoading.textContent = "Greška pri učitavanju statistike."; } };

// --- NOVA FUNKCIJA: Dohvat i prikaz povijesti aktivnosti ---
const loadActivityLog = async (userId, limit = 10) => {
    if (!activityLogLoading || !activityLogList || !noActivityLogMessage || !userId) return;
    console.log(`[Activity Log] Učitavam zadnjih ${limit} aktivnosti za:`, userId);
    activityLogLoading.classList.remove('d-none');
    activityLogList.innerHTML = ''; // Očisti prethodne unose
    noActivityLogMessage.classList.add('d-none'); // Sakrij poruku "nema unosa"

    try {
        const query = db.collection('activityLog')
                        .where('userId', '==', userId)
                        .orderBy('timestamp', 'desc') // Najnovije prvo
                        .limit(limit); // Ograniči broj rezultata

        const querySnapshot = await query.get();

        if (querySnapshot.empty) {
            console.log("[Activity Log] Nema zapisa.");
            noActivityLogMessage.classList.remove('d-none'); // Prikaži poruku
        } else {
            querySnapshot.forEach(doc => {
                const logData = doc.data();
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-start';

                // Formatiraj vrijeme
                let timestampStr = 'N/A';
                if (logData.timestamp && logData.timestamp.toDate) {
                     try {
                          // Koristi toLocaleString za lokalni format datuma i vremena
                          timestampStr = logData.timestamp.toDate().toLocaleString('hr-HR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                          });
                     } catch (e) { console.error("Greška formatiranja datuma:", e)}
                }


                // Formatiraj poruku loga
                let actionText = logData.action;
                let iconClass = 'bi-info-circle'; // Default ikona

                switch(logData.action) {
                    case 'dodano': actionText = 'Dodano:'; iconClass = 'bi-plus-circle-fill text-success'; break;
                    case 'pogledano': actionText = 'Označeno kao pogledano:'; iconClass = 'bi-check-circle-fill text-success'; break;
                    case 'nepogledano': actionText = 'Označeno kao nepogledano:'; iconClass = 'bi-circle text-secondary'; break;
                    case 'epizoda++': actionText = `Povećana epizoda (${logData.details || ''}):`; iconClass = 'bi-arrow-up-circle text-primary'; break;
                     case `ažurirano season`: actionText = `Ažurirana sezona (${logData.details || ''}):`; iconClass = 'bi-pencil-fill text-warning'; break;
                     case `ažurirano episode`: actionText = `Ažurirana epizoda (${logData.details || ''}):`; iconClass = 'bi-pencil-fill text-warning'; break;
                    case 'obrisano': actionText = 'Obrisano:'; iconClass = 'bi-trash3-fill text-danger'; break;
                    case 'omiljeno+': actionText = 'Dodano u omiljene:'; iconClass = 'bi-star-fill text-warning'; break;
                    case 'omiljeno-': actionText = 'Uklonjeno iz omiljenih:'; iconClass = 'bi-star text-secondary'; break;
                }

                li.innerHTML = `
                    <div class="ms-2 me-auto">
                        <div class="fw-bold"><i class="bi ${iconClass} me-2"></i>${actionText}</div>
                        ${logData.itemTitle}
                        ${logData.details && !logData.action.includes('ažurirano') && logData.action !== 'epizoda++' ? `<small class="d-block text-muted">${logData.details}</small>` : ''}
                    </div>
                    <span class="badge bg-secondary rounded-pill">${timestampStr}</span>
                `;
                activityLogList.appendChild(li);
            });
        }

    } catch (error) {
        console.error("Greška pri dohvaćanju povijesti aktivnosti:", error);
        noActivityLogMessage.textContent = 'Greška pri učitavanju povijesti.';
        noActivityLogMessage.classList.remove('d-none');
    } finally {
        activityLogLoading.classList.add('d-none'); // Sakrij loading
    }
};


// --- EVENT LISTENERI za profil stranicu ---
if (logoutButtonProfile) logoutButtonProfile.addEventListener('click', handleLogoutProfile);
if (themeToggleButtonProfile) themeToggleButtonProfile.addEventListener('click', toggleThemeProfile);
if (changePasswordButton) changePasswordButton.addEventListener('click', handleChangePassword);
if (deleteAccountButton) deleteAccountButton.addEventListener('click', handleDeleteAccount);

// Učitaj temu čim se skripta pokrene
loadThemeProfile();

// ===================================
// KRAJ profile_script.js KODA
// ===================================