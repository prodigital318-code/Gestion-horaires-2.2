let currentEmploye = null;

function initEmployeInterface() {
    currentEmploye = currentUser;
    document.getElementById('employeUserName').textContent = currentEmploye.name;
    loadEmployeInterface();
}

function loadEmployeInterface() {
    const contentDiv = document.getElementById('employeContent');
    
    contentDiv.innerHTML = `
        <div class="employe-dashboard">
            <div class="welcome-card">
                <h2>👋 Bonjour ${currentEmploye.name} !</h2>
                <p>🕐 Votre shift: ${getShiftDisplay(currentEmploye.shift, currentEmploye.customShift)}</p>
                <div id="pointageStatus" class="pointage-status">
                    <!-- Statut du pointage chargé dynamiquement -->
                </div>
            </div>

            <div class="action-buttons">
                <button onclick="startQRScan()" class="btn-primary btn-large">
                    📱 Scanner QR Code & Pointer
                </button>
            </div>

            <div class="employe-stats">
                <div class="stat-card">
                    <h3>📅 Pointages ce mois</h3>
                    <p id="monthPointages">-</p>
                </div>
                <div class="stat-card">
                    <h3>⏰ Retards</h3>
                    <p id="monthRetards">-</p>
                </div>
                <div class="stat-card">
                    <h3>🎯 Présence</h3>
                    <p id="presenceRate">-</p>
                </div>
            </div>

            <div class="recent-pointages">
                <h3>📋 Vos 5 derniers pointages</h3>
                <div id="recentPointagesList"></div>
            </div>

            <div class="conges-section">
                <h3>🏖️ Gestion des Congés</h3>
                <button onclick="showCongeForm()" class="btn-secondary">Faire une demande de congé</button>
                <div id="congeForm" style="display: none; margin-top: 15px;">
                    <div class="form-group">
                        <label>Date de début:</label>
                        <input type="date" id="congeStart">
                    </div>
                    <div class="form-group">
                        <label>Date de fin:</label>
                        <input type="date" id="congeEnd">
                    </div>
                    <div class="form-group">
                        <label>Motif:</label>
                        <input type="text" id="congeReason" placeholder="Raison du congé">
                    </div>
                    <button onclick="submitCongeRequest()" class="btn-primary">Soumettre la demande</button>
                    <button onclick="hideCongeForm()" class="btn-secondary">Annuler</button>
                </div>
                
                <div id="mesConges" style="margin-top: 20px;">
                    <h4>Mes demandes de congé</h4>
                    <div id="congesList"></div>
                </div>
            </div>
        </div>
    `;

    loadEmployeData();
}

function getShiftDisplay(shift, customShift) {
    if (shift === 'personnalise' && customShift) {
        return `${customShift.start} - ${customShift.end}`;
    }
    return shift;
}

async function loadEmployeData() {
    await loadPointageStatus();
    await loadEmployeStats();
    await loadRecentPointages();
    await loadMesConges();
}

async function loadPointageStatus() {
    const today = new Date().toISOString().split('T')[0];
    const pointages = await getPointagesByUser(currentEmploye.id);
    const todayPointages = pointages.filter(p => p.date === today);
    
    const statusDiv = document.getElementById('pointageStatus');
    
    if (todayPointages.length === 0) {
        statusDiv.innerHTML = `
            <div class="status-not-pointed">
                <p>🟡 Vous n'avez pas pointé aujourd'hui</p>
                <small>Scannez le QR code à votre arrivée</small>
            </div>
        `;
    } else {
        const dernierPointage = todayPointages[todayPointages.length - 1];
        const typeDisplay = dernierPointage.type === 'arrivée' ? '🟢 Arrivée' : '🔴 Départ';
        statusDiv.innerHTML = `
            <div class="status-pointed">
                <p>✅ Dernier pointage: ${dernierPointage.heure}</p>
                <small>${typeDisplay} ${dernierPointage.retard ? ' - ⚠️ Retard' : ''}</small>
            </div>
        `;
    }
}

async function loadEmployeStats() {
    const pointages = await getPointagesByUser(currentEmploye.id);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthPointages = pointages.filter(p => {
        const pointageDate = new Date(p.date);
        return pointageDate.getMonth() === currentMonth && pointageDate.getFullYear() === currentYear;
    });
    
    const retards = monthPointages.filter(p => p.retard).length;
    const joursOuvres = 22;
    const presenceRate = Math.round((monthPointages.length / joursOuvres) * 100);
    
    document.getElementById('monthPointages').textContent = monthPointages.length;
    document.getElementById('monthRetards').textContent = retards;
    document.getElementById('presenceRate').textContent = `${Math.min(presenceRate, 100)}%`;
}

async function loadRecentPointages() {
    const pointages = await getPointagesByUser(currentEmploye.id);
    const recentPointages = pointages.slice(-5).reverse();
    
    const container = document.getElementById('recentPointagesList');
    
    if (recentPointages.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun pointage récent</p>';
        return;
    }
    
    container.innerHTML = recentPointages.map(pointage => `
        <div class="pointage-item ${pointage.retard ? 'retard' : ''}">
            <div class="pointage-date">${pointage.date}</div>
            <div class="pointage-time">
                ${pointage.heure} (${pointage.type})
            </div>
            ${pointage.retard ? '<span class="retard-badge">⚠️ Retard</span>' : ''}
        </div>
    `).join('');
}

async function loadMesConges() {
    const conges = await getCongesByUser(currentEmploye.id);
    const container = document.getElementById('congesList');
    
    if (conges.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune demande de congé</p>';
        return;
    }
    
    container.innerHTML = conges.map(conge => `
        <div class="conge-item status-${conge.status}">
            <div class="conge-dates">
                ${conge.startDate} → ${conge.endDate}
            </div>
            <div class="conge-reason">
                ${conge.reason}
            </div>
            <div class="conge-status">
                ${getStatusBadge(conge.status)}
            </div>
        </div>
    `).join('');
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': '🟡 En attente',
        'approved': '✅ Approuvé',
        'rejected': '❌ Refusé'
    };
    return statusMap[status] || status;
}

function startQRScan() {
    showSection('cameraSection');
    startCameraForPointage();
}

function showCongeForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('congeStart').min = today;
    document.getElementById('congeEnd').min = today;
    
    document.getElementById('congeForm').style.display = 'block';
}

function hideCongeForm() {
    document.getElementById('congeForm').style.display = 'none';
    document.getElementById('congeStart').value = '';
    document.getElementById('congeEnd').value = '';
    document.getElementById('congeReason').value = '';
}

async function submitCongeRequest() {
    const start = document.getElementById('congeStart').value;
    const end = document.getElementById('congeEnd').value;
    const reason = document.getElementById('congeReason').value.trim();
    
    if (!start || !end || !reason) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    if (new Date(start) > new Date(end)) {
        alert('La date de fin doit être après la date de début');
        return;
    }
    
    const congeRequest = {
        userId: currentEmploye.id,
        userName: currentEmploye.name,
        startDate: start,
        endDate: end,
        reason: reason,
        status: 'pending',
        submittedAt: new Date().toISOString()
    };
    
    try {
        await addCongeRequest(congeRequest);
        alert('✅ Demande de congé soumise ! En attente de validation par l\'administration.');
        hideCongeForm();
        loadMesConges();
    } catch (error) {
        alert('❌ Erreur lors de la soumission de la demande');
    }
}
