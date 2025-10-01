let currentEmploye = null;

function initEmployeInterface() {
    currentEmploye = currentUser;
    document.getElementById('employeUserName').textContent = currentEmploye.name;
    loadEmployeInterface();
}

function loadEmployeInterface() {
    const contentDiv = document.getElementById('employeContent');
    
    contentDiv.innerHTML = `
        <div class="employes-management">
            <div class="welcome-card">
                <h2>👋 Bonjour ${currentEmploye.name} !</h2>
                <p>🕐 Votre shift: ${currentEmploye.shift || '9h-17h'}</p>
                <div id="pointageStatus" style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 10px;">
                    <!-- Statut du pointage -->
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <button onclick="startQRScan()" class="btn-primary" style="padding: 20px 40px; font-size: 18px; margin: 10px;">
                    📱 Scanner QR Code
                </button>
                <button onclick="directPointage()" class="btn-secondary" style="padding: 20px 40px; font-size: 18px; margin: 10px;">
                    🎯 Pointer directement
                </button>
            </div>

            <div class="stats-grid">
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

            <div style="margin-top: 30px;">
                <h3 style="margin-bottom: 20px; color: #2c3e50;">📋 Vos 5 derniers pointages</h3>
                <div id="recentPointagesList"></div>
            </div>
        </div>
    `;

    loadEmployeData();
}

function startQRScan() {
    showSection('qrScanSection');
    initializeQRScannerForEmploye();
}

function directPointage() {
    showSection('cameraSection');
    startCameraForPointage();
}

async function loadEmployeData() {
    await loadPointageStatus();
    await loadEmployeStats();
    await loadRecentPointages();
}

async function loadPointageStatus() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const pointages = await getPointagesByUser(currentEmploye.id);
        const todayPointages = pointages.filter(p => p.date === today);
        
        const statusDiv = document.getElementById('pointageStatus');
        
        if (todayPointages.length === 0) {
            statusDiv.innerHTML = `
                <p style="margin: 0; font-size: 1.1rem;">🟡 Vous n'avez pas pointé aujourd'hui</p>
                <small style="opacity: 0.8;">Scannez le QR code à votre arrivée</small>
            `;
        } else {
            const dernierPointage = todayPointages[todayPointages.length - 1];
            const typeDisplay = dernierPointage.type === 'arrivée' ? '🟢 Arrivée' : '🔴 Départ';
            const retardText = dernierPointage.retard ? ` - ⚠️ Retard de ${dernierPointage.retardMinutes} minutes` : '';
            
            statusDiv.innerHTML = `
                <p style="margin: 0; font-size: 1.1rem;">✅ Dernier pointage: ${dernierPointage.heure}</p>
                <small style="opacity: 0.8;">${typeDisplay}${retardText}</small>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement statut pointage:', error);
    }
}

async function loadEmployeStats() {
    try {
        const pointages = await getPointagesByUser(currentEmploye.id);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthPointages = pointages.filter(p => {
            const pointageDate = new Date(p.date);
            return pointageDate.getMonth() === currentMonth && pointageDate.getFullYear() === currentYear;
        });
        
        const retards = monthPointages.filter(p => p.retard).length;
        const joursOuvres = 22; // Jours ouvrés moyens par mois
        const presenceRate = Math.round((monthPointages.length / (joursOuvres * 2)) * 100); // ×2 car arrivée + départ
        
        document.getElementById('monthPointages').textContent = monthPointages.length;
        document.getElementById('monthRetards').textContent = retards;
        document.getElementById('presenceRate').textContent = `${Math.min(presenceRate, 100)}%`;
    } catch (error) {
        console.error('Erreur chargement stats employé:', error);
    }
}

async function loadRecentPointages() {
    try {
        const pointages = await getPointagesByUser(currentEmploye.id);
        const recentPointages = pointages.slice(-5).reverse();
        
        const container = document.getElementById('recentPointagesList');
        
        if (recentPointages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Aucun pointage récent</p>';
            return;
        }
        
        container.innerHTML = recentPointages.map(pointage => `
            <div class="employe-card" style="border-left: 4px solid ${pointage.retard ? '#e74c3c' : '#27ae60'}; margin: 10px 0;">
                <div class="employe-info">
                    <strong>${pointage.date}</strong>
                    <span style="color: #666;">${pointage.heure} (${pointage.type === 'arrivée' ? '🟢 Arrivée' : '🔴 Départ'})</span>
                    ${pointage.retard ? 
                        `<span style="color: #e74c3c; font-weight: bold;">⚠️ Retard de ${pointage.retardMinutes} minutes</span>` : 
                        '<span style="color: #27ae60;">✅ À l\'heure</span>'
                    }
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement pointages récents:', error);
    }
}
