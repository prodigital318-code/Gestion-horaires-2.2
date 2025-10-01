let currentAdmin = null;

function initAdminInterface() {
    currentAdmin = currentUser;
    document.getElementById('adminUserName').textContent = currentAdmin.name;
    showAdminTab('dashboard');
}

function showAdminTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const contentDiv = document.getElementById('adminContent');
    
    switch(tabName) {
        case 'dashboard':
            contentDiv.innerHTML = renderDashboard();
            loadDashboardStats();
            break;
        case 'employes':
            contentDiv.innerHTML = renderEmployesManagement();
            loadEmployesList();
            break;
        case 'pointages':
            contentDiv.innerHTML = renderPointagesManagement();
            loadTodayPointages();
            break;
        case 'qr':
            contentDiv.innerHTML = renderQRManagement();
            // Générer le QR code unique automatiquement
            setTimeout(() => {
                generateUniqueQRCode();
            }, 100);
            break;
    }
}

function renderDashboard() {
    return `
        <div class="dashboard">
            <div class="dashboard-header">
                <h2>📊 Tableau de Bord</h2>
                <p>Vue d'ensemble de votre activité</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <h3>Employés</h3>
                        <p id="totalEmployes">-</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-content">
                        <h3>Pointages Aujourd'hui</h3>
                        <p id="todayPointages">-</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-content">
                        <h3>Retards</h3>
                        <p id="todayRetards">-</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📸</div>
                    <div class="stat-content">
                        <h3>Selfies</h3>
                        <p id="totalSelfies">-</p>
                    </div>
                </div>
            </div>
            
            <div class="recent-activity-section">
                <h3>Activité Récente</h3>
                <div id="recentActivity" class="activity-list">
                    <div class="activity-placeholder">
                        <p>Chargement des activités...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadDashboardStats() {
    try {
        const employes = await getEmployees();
        const pointages = await getTodayPointages();
        const selfies = await getAllSelfies();
        
        const retards = pointages.filter(p => p.retard).length;
        
        document.getElementById('totalEmployes').textContent = employes.length;
        document.getElementById('todayPointages').textContent = pointages.length;
        document.getElementById('todayRetards').textContent = retards;
        document.getElementById('totalSelfies').textContent = selfies.length;
        
        const recentActivity = pointages.slice(-8).reverse();
        const activityHTML = recentActivity.map(p => {
            return `
                <div class="activity-item">
                    <div class="activity-icon">${p.type === 'arrivée' ? '🟢' : '🔴'}</div>
                    <div class="activity-info">
                        <strong>${p.userName}</strong>
                        <span>${p.heure} - ${p.type}</span>
                    </div>
                    <div class="activity-status">
                        ${p.retard ? '<span class="retard-badge">⚠️ Retard</span>' : '<span class="on-time">✅ À l\'heure</span>'}
                    </div>
                </div>
            `;
        }).join('') || '<div class="activity-placeholder"><p>Aucune activité aujourd\'hui</p></div>';
        
        document.getElementById('recentActivity').innerHTML = activityHTML;
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}

function renderEmployesManagement() {
    return `
        <div class="employes-management">
            <div class="section-header">
                <h2>👥 Gestion des Employés</h2>
                <p>Créez et gérez vos équipes</p>
            </div>
            
            <div class="action-bar">
                <button onclick="showAddEmployeForm()" class="btn-primary">
                    ➕ Ajouter un Employé
                </button>
            </div>
            
            <div id="addEmployeForm" class="form-modal" style="display: none;">
                <div class="modal-header">
                    <h3>Nouvel Employé</h3>
                    <button onclick="hideAddEmployeForm()" class="btn-close">×</button>
                </div>
                <div class="form-group">
                    <input type="text" id="employeName" placeholder="Nom complet" required>
                    <input type="email" id="employeEmail" placeholder="Email" required>
                    <input type="password" id="employePassword" placeholder="Mot de passe (min 4 caractères)" required>
                </div>
                
                <div class="shift-selection">
                    <h4>🕐 Shift Horaires</h4>
                    <select id="employeShift">
                        <option value="9h-17h">9h00 - 17h00</option>
                        <option value="8h-16h">8h00 - 16h00</option>
                        <option value="10h-18h">10h00 - 18h00</option>
                        <option value="14h-22h">14h00 - 22h00</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button onclick="addEmploye()" class="btn-primary">Créer Employé</button>
                    <button onclick="hideAddEmployeForm()" class="btn-secondary">Annuler</button>
                </div>
            </div>
            
            <div class="employes-list-section">
                <h3>Liste des Employés</h3>
                <div id="employesListContainer" class="employes-grid">
                    <div class="loading-state">
                        <p>Chargement des employés...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadEmployesList() {
    try {
        const employes = await getEmployees();
        const container = document.getElementById('employesListContainer');
        
        if (employes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h4>Aucun employé</h4>
                    <p>Commencez par ajouter votre premier employé</p>
                    <button onclick="showAddEmployeForm()" class="btn-primary">➕ Ajouter un employé</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = employes.map(employe => `
            <div class="employe-card">
                <div class="employe-avatar">
                    ${employe.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div class="employe-info">
                    <h4>${employe.name}</h4>
                    <p class="employe-email">📧 ${employe.email}</p>
                    <p class="employe-shift">🕐 ${employe.shift}</p>
                    <p class="employe-date">Créé le ${new Date(employe.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div class="employe-actions">
                    <button onclick="viewEmployeStats(${employe.id})" class="btn-info" title="Voir les statistiques">
                        📊
                    </button>
                    <button onclick="deleteEmploye(${employe.id})" class="btn-danger" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement employés:', error);
    }
}

function showAddEmployeForm() {
    document.getElementById('addEmployeForm').style.display = 'block';
}

function hideAddEmployeForm() {
    document.getElementById('addEmployeForm').style.display = 'none';
    document.getElementById('employeName').value = '';
    document.getElementById('employeEmail').value = '';
    document.getElementById('employePassword').value = '';
}

async function addEmploye() {
    const name = document.getElementById('employeName').value.trim();
    const email = document.getElementById('employeEmail').value.trim();
    const password = document.getElementById('employePassword').value;
    const shift = document.getElementById('employeShift').value;
    
    if (!name || !email || !password) {
        alert('❌ Veuillez remplir tous les champs');
        return;
    }
    
    if (password.length < 4) {
        alert('❌ Le mot de passe doit faire au moins 4 caractères');
        return;
    }
    
    const employe = {
        name: name,
        email: email,
        password: password,
        role: 'employe',
        shift: shift,
        createdAt: new Date().toISOString()
    };
    
    try {
        await createUser(employe);
        alert('✅ Employé créé avec succès !');
        hideAddEmployeForm();
        loadEmployesList();
        loadDashboardStats();
    } catch (error) {
        alert('❌ Erreur lors de la création: ' + error.message);
    }
}

async function viewEmployeStats(employeId) {
    const employe = await getUserById(employeId);
    const pointages = await getPointagesByUser(employeId);
    const today = new Date().toISOString().split('T')[0];
    
    const pointagesAujourdhui = pointages.filter(p => p.date === today);
    const retardsMois = pointages.filter(p => p.retard && p.date.startsWith(new Date().toISOString().substring(0, 7))).length;
    const totalPointages = pointages.length;
    
    alert(`📊 Statistiques de ${employe.name}:

📅 Pointages aujourd'hui: ${pointagesAujourdhui.length}
⚠️ Retards ce mois: ${retardsMois}
📋 Total pointages: ${totalPointages}
🕐 Shift: ${employe.shift}
📧 Email: ${employe.email}
    `);
}

async function deleteEmploye(employeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.')) return;
    
    try {
        await deleteItem('users', employeId);
        alert('✅ Employé supprimé avec succès');
        loadEmployesList();
        loadDashboardStats();
    } catch (error) {
        alert('❌ Erreur lors de la suppression');
    }
}

function renderPointagesManagement() {
    const today = new Date().toISOString().split('T')[0];
    return `
        <div class="pointages-management">
            <div class="section-header">
                <h2>⏱️ Gestion des Pointages</h2>
                <p>Suivez les présences et retards</p>
            </div>
            
            <div class="filters-bar">
                <div class="date-filter">
                    <label for="pointageDate">📅 Date:</label>
                    <input type="date" id="pointageDate" value="${today}">
                    <button onclick="loadPointagesByDate()" class="btn-primary">🔍 Filtrer</button>
                </div>
                <div class="export-section">
                    <button onclick="exportPointages()" class="btn-secondary">📤 Exporter les données</button>
                </div>
            </div>
            
            <div id="pointagesSummary" class="summary-cards"></div>
            
            <div id="pointagesList" class="pointages-list">
                <div class="loading-state">
                    <p>Chargement des pointages...</p>
                </div>
            </div>
        </div>
    `;
}

async function loadTodayPointages() {
    await loadPointagesByDate();
}

async function loadPointagesByDate() {
    try {
        const date = document.getElementById('pointageDate').value || new Date().toISOString().split('T')[0];
        const pointages = await getPointagesByDate(date);
        const container = document.getElementById('pointagesList');
        const summary = document.getElementById('pointagesSummary');
        
        const totalPointages = pointages.length;
        const retards = pointages.filter(p => p.retard).length;
        const aLHeure = totalPointages - retards;
        
        summary.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card total">
                    <div class="summary-number">${totalPointages}</div>
                    <div class="summary-label">Total Pointages</div>
                </div>
                <div class="summary-card on-time">
                    <div class="summary-number">${aLHeure}</div>
                    <div class="summary-label">À l'heure</div>
                </div>
                <div class="summary-card late">
                    <div class="summary-number">${retards}</div>
                    <div class="summary-label">Retards</div>
                </div>
            </div>
        `;
        
        if (pointages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⏱️</div>
                    <h4>Aucun pointage</h4>
                    <p>Aucun pointage enregistré pour cette date</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = pointages.map(pointage => `
            <div class="pointage-card ${pointage.retard ? 'retard' : 'on-time'}">
                <div class="pointage-avatar">
                    ${pointage.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div class="pointage-info">
                    <h4>${pointage.userName}</h4>
                    <div class="pointage-details">
                        <span class="time">🕐 ${pointage.heure}</span>
                        <span class="type">${pointage.type === 'arrivée' ? '🟢 Arrivée' : '🔴 Départ'}</span>
                        <span class="date">📅 ${pointage.date}</span>
                    </div>
                </div>
                <div class="pointage-status">
                    ${pointage.retard ? 
                        `<div class="status-badge retard">
                            ⚠️ Retard de ${pointage.retardMinutes} min
                        </div>` : 
                        `<div class="status-badge on-time">
                            ✅ À l'heure
                        </div>`
                    }
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement pointages:', error);
    }
}

function exportPointages() {
    alert('📤 Fonction d\'export à implémenter');
}

function renderQRManagement() {
    return `
        <div class="qr-management">
            <div class="qr-header">
                <h2>📱 QR Code de Pointage</h2>
                <p class="qr-subtitle">QR code permanent - À utiliser par tous les employés</p>
            </div>
            
            <div class="qr-display-section">
                <div class="qr-container">
                    <canvas id="qrCodeCanvas" width="300" height="300"></canvas>
                </div>
                
                <div class="qr-actions">
                    <button onclick="downloadQRCode()" class="btn-primary">
                        📥 Télécharger QR Code
                    </button>
                    <button onclick="printQRCode()" class="btn-secondary">
                        🖨️ Imprimer
                    </button>
                </div>
            </div>

            <div class="qr-instructions">
                <h3>📋 Comment utiliser le QR code</h3>
                <div class="instruction-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <strong>Téléchargez ou imprimez ce QR code</strong>
                            <p>Ce QR code est permanent et unique à votre entreprise</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <strong>Placez-le à l'entrée</strong>
                            <p>Affichage visible et bien éclairé pour un scan facile</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <strong>Les employés scannent</strong>
                            <p>Ils pointent simplement leur caméra vers le QR code</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">4</span>
                        <div class="step-content">
                            <strong>Selfie automatique</strong>
                            <p>Le système capture automatiquement un selfie de vérification</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="qr-info-card">
                <div class="info-icon">💡</div>
                <div class="info-content">
                    <h4>Information importante</h4>
                    <p>Ce QR code fonctionne <strong>indéfiniment</strong>. Vous n'avez pas besoin de le régénérer.</p>
                    <p>Il est compatible avec <strong>tous les navigateurs</strong> et <strong>tous les appareils</strong>.</p>
                </div>
            </div>
        </div>
    `;
}

function printQRCode() {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) {
        alert('❌ QR code non disponible');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Code ProDigital</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 40px;
                        margin: 0;
                    }
                    .header { 
                        margin-bottom: 30px; 
                    }
                    .instructions { 
                        margin-top: 30px; 
                        text-align: left; 
                        max-width: 500px; 
                        margin: 30px auto;
                        font-size: 14px;
                    }
                    img { 
                        max-width: 300px; 
                        height: auto;
                    }
                    @media print {
                        body { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏢 ProDigital</h1>
                    <h2>QR Code de Pointage Permanent</h2>
                    <p><strong>Entreprise:</strong> Votre Société</p>
                    <p><strong>Généré le:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                <img src="${canvas.toDataURL('image/png')}" alt="QR Code ProDigital">
                <div class="instructions">
                    <h3>Instructions:</h3>
                    <ol>
                        <li>Placez ce QR code à l'entrée de l'établissement</li>
                        <li>Les employés le scanneront avec leur appareil photo</li>
                        <li>Le système capturera automatiquement un selfie</li>
                        <li>Le pointage sera enregistré avec horodatage</li>
                    </ol>
                    <p><em>Ce QR code est permanent et ne nécessite pas de régénération.</em></p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}
