// ====================================================================
// POČETAK profile_script.js KODA - ULTIMATE REDESIGN V2.0
// ====================================================================

// Firebase Konfiguracija
const firebaseConfig = { apiKey: "AIzaSyAn5aI0Rsna-cCtd_TyxAFWdnjS8TB_7v8", authDomain: "moja-watch-lista.firebaseapp.com", projectId: "moja-watch-lista", storageBucket: "moja-watch-lista.appspot.com", messagingSenderId: "473312198206", appId: "1:473312198206:web:aeb0eeacd69eb0619e9b6f" };

// Inicijaliziraj Firebase
if (!firebase.apps.length) { try { firebase.initializeApp(firebaseConfig); } catch (e) { console.error(e); } }

const auth = firebase.auth();
const db = firebase.firestore();

// === Dohvati elemente ===
function getEl(id) { return document.getElementById(id); }
const profileContent = getEl('profile-content');
const authRequiredMessage = getEl('auth-required-message');
const userEmailSpanProfile = getEl('userEmail-profile');
const logoutButtonProfile = getEl('logoutButton-profile');
const themeToggleButtonProfile = getEl('theme-toggle-button-profile');
const themeToggleIconProfile = themeToggleButtonProfile?.querySelector('i');
const changePasswordButton = getEl('changePasswordButton');
const deleteAccountButton = getEl('deleteAccountButton');
const statsLoading = getEl('stats-loading');
const statsDisplay = getEl('stats-display');
const statTotal = getEl('stat-total');
const statWatched = getEl('stat-watched');
const statWatching = getEl('stat-watching');
const statFavorites = getEl('stat-favorites');
const statAvgRating = getEl('stat-avg-rating');
const statByTypeChart = getEl('stat-by-type-chart'); // Novi element za grafikon
const statMostFrequentType = getEl('stat-most-frequent-type');
const activityLogLoading = getEl('activity-log-loading');
const activityLogList = getEl('activity-log-list');
const noActivityLogMessage = getEl('no-activity-log');

// --- FUNKCIJE ZA TEMU ---
const applyThemeProfile = (t) => {
    document.documentElement.setAttribute('data-bs-theme', t);
    if (themeToggleIconProfile) themeToggleIconProfile.className = t === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-stars-fill';
};
const toggleThemeProfile = () => {
    const newTheme = (document.documentElement.getAttribute('data-bs-theme') || 'dark') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyThemeProfile(newTheme);
};
const loadThemeProfile = () => {
    applyThemeProfile(localStorage.getItem('theme') || 'dark');
};

// --- PROVJERA AUTENTIFIKACIJE ---
auth.onAuthStateChanged(user => {
    if (user) {
        if (authRequiredMessage) authRequiredMessage.classList.add('d-none');
        if (profileContent) profileContent.classList.remove('d-none');
        if (userEmailSpanProfile) userEmailSpanProfile.textContent = user.email;
        loadUserStats(user.uid);
        loadActivityLog(user.uid);
    } else {
        if (authRequiredMessage) authRequiredMessage.classList.remove('d-none');
        if (profileContent) profileContent.classList.add('d-none');
    }
});


// =========================================================================
// === AŽURIRANA `loadUserStats` FUNKCIJA ZA NOVI IZGLED ===
// =========================================================================
const loadUserStats = async (userId) => {
    if (!statsLoading || !statsDisplay || !userId) return;
    statsLoading.classList.remove('d-none');
    statsDisplay.classList.add('d-none');

    try {
        const querySnapshot = await db.collection('watchlist').where('userId', '==', userId).get();
        const items = querySnapshot.docs.map(doc => doc.data());
        
        const totalItems = items.length;
        const watchedCount = items.filter(item => item.watched).length;
        const favoriteCount = items.filter(item => item.favorite).length;
        
        const ratedItems = items.filter(item => item.watched && typeof item.rating === 'number');
        const ratingSum = ratedItems.reduce((sum, item) => sum + item.rating, 0);
        const ratedCount = ratedItems.length;

        const typeCounts = { Film: 0, Serija: 0, Anime: 0 };
        items.forEach(item => {
            if (typeCounts.hasOwnProperty(item.type)) {
                typeCounts[item.type]++;
            }
        });

        const watchingCount = totalItems - watchedCount;
        const averageRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : 'N/A';

        let mostFrequentType = 'Nema';
        let maxCount = 0;
        for (const type in typeCounts) {
            if (typeCounts[type] > maxCount) {
                maxCount = typeCounts[type];
                mostFrequentType = type;
            } else if (typeCounts[type] === maxCount && maxCount > 0) {
                mostFrequentType += `, ${type}`;
            }
        }
        if (maxCount === 0) mostFrequentType = 'Nema unosa';

        // Popunjavanje osnovnih statsa
        if (statTotal) statTotal.textContent = totalItems;
        if (statWatched) statWatched.textContent = watchedCount;
        if (statWatching) statWatching.textContent = watchingCount;
        if (statFavorites) statFavorites.textContent = favoriteCount;
        if (statAvgRating) statAvgRating.textContent = averageRating;
        if (statMostFrequentType) statMostFrequentType.textContent = mostFrequentType;

        // Generiranje grafikona za tipove
        if (statByTypeChart) {
            statByTypeChart.innerHTML = '';
            const maxTypeCount = Math.max(...Object.values(typeCounts));
            
            for (const type in typeCounts) {
                const count = typeCounts[type];
                const percentage = totalItems > 0 ? (count / Math.max(1, maxTypeCount)) * 100 : 0;
                
                const chartItemHTML = `
                    <div class="chart-bar-wrapper">
                        <div class="chart-label fw-bold">${type}</div>
                        <div class="flex-grow-1">
                            <div class="chart-bar" style="width: ${percentage}%;"></div>
                        </div>
                        <div class="fw-bold">${count}</div>
                    </div>
                `;
                statByTypeChart.innerHTML += chartItemHTML;
            }
        }

        statsLoading.classList.add('d-none');
        statsDisplay.classList.remove('d-none');
    } catch (error) {
        console.error("Greška pri dohvaćanju statistike:", error);
        if (statsLoading) statsLoading.textContent = "Greška pri učitavanju statistike.";
    }
};


// --- Ovdje zalijepite SVE OSTALE funkcije iz vašeg originalnog profile_script.js ---
// Npr. loadActivityLog, handleChangePassword, handleDeleteAccount, itd.
// Njihova logika se ne mijenja.

const loadActivityLog = async (userId, limit = 10) => {
    if (!activityLogLoading || !activityLogList || !noActivityLogMessage || !userId) return;
    activityLogLoading.classList.remove('d-none');
    activityLogList.innerHTML = '';
    noActivityLogMessage.classList.add('d-none');
    try {
        const query = db.collection('activityLog').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(limit);
        const querySnapshot = await query.get();
        if (querySnapshot.empty) {
            noActivityLogMessage.classList.remove('d-none');
        } else {
            querySnapshot.forEach(doc => {
                const logData = doc.data();
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-start bg-transparent';
                let timestampStr = logData.timestamp?.toDate()?.toLocaleString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'N/A';
                let actionText = logData.action, iconClass = 'bi-info-circle';
                switch(logData.action) {
                    case 'dodano': actionText = 'Dodano:'; iconClass = 'bi-plus-circle-fill text-success'; break;
                    case 'pogledano': actionText = 'Označeno kao pogledano:'; iconClass = 'bi-check-circle-fill text-success'; break;
                    case 'nepogledano': actionText = 'Označeno kao nepogledano:'; iconClass = 'bi-circle text-secondary'; break;
                    case 'epizoda++': actionText = `Povećana epizoda (${logData.details || ''}):`; iconClass = 'bi-arrow-up-circle text-primary'; break;
                    case 'uređeno': actionText = 'Uređeno:'; iconClass = 'bi-pencil-fill text-warning'; break;
                    case 'obrisano': actionText = 'Obrisano:'; iconClass = 'bi-trash3-fill text-danger'; break;
                    case 'omiljeno+': actionText = 'Dodano u omiljene:'; iconClass = 'bi-star-fill text-warning'; break;
                    case 'omiljeno-': actionText = 'Uklonjeno iz omiljenih:'; iconClass = 'bi-star text-secondary'; break;
                }
                li.innerHTML = `<div class="ms-2 me-auto"><div class="fw-bold"><i class="bi ${iconClass} me-2"></i>${actionText}</div>${logData.itemTitle}</div><span class="badge bg-secondary rounded-pill">${timestampStr}</span>`;
                activityLogList.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Greška kod povijesti aktivnosti:", error);
        noActivityLogMessage.textContent = 'Greška pri učitavanju povijesti.';
        noActivityLogMessage.classList.remove('d-none');
    } finally {
        activityLogLoading.classList.add('d-none');
    }
};
const handleLogoutProfile = () => auth.signOut();
const handleChangePassword = () => { const user = auth.currentUser; if (!user || !user.email) return; if (confirm(`Poslati email za promjenu lozinke na adresu ${user.email}?`)) { auth.sendPasswordResetEmail(user.email).then(() => alert("Email poslan.")).catch(e => alert(`Greška: ${e.message}`)); } };
const handleDeleteAccount = () => { const user = auth.currentUser; if (!user) return; const conf = prompt(`UPOZORENJE! Za trajno brisanje računa upišite vaš email: ${user.email}`); if (conf === user.email) { if (confirm("JESTE LI SIGURNI? Radnja se ne može poništiti!")) { user.delete().then(() => alert("Račun obrisan.")).catch(e => alert(`Greška: ${e.message}. Možda se trebate ponovno prijaviti.`)); } } else if (conf !== null) { alert("Email nije ispravan. Brisanje otkazano."); } };

// --- EVENT LISTENERI ---
if (logoutButtonProfile) logoutButtonProfile.addEventListener('click', handleLogoutProfile);
if (themeToggleButtonProfile) themeToggleButtonProfile.addEventListener('click', toggleThemeProfile);
if (changePasswordButton) changePasswordButton.addEventListener('click', handleChangePassword);
if (deleteAccountButton) deleteAccountButton.addEventListener('click', handleDeleteAccount);

// Učitaj temu
loadThemeProfile();