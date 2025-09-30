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
            generateQRCode();
            break;
        case 'administration':
            contentDiv.innerHTML = renderAdminManagement();
            loadAdminsList();
            break;
    }
}

function renderDashboard() {
    return `
        <div class="dashboard">
            <h2>📊 Tableau de Bord</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>👥 Employés</h3>
                    <p id="totalEmployes">-</p>
                </div>
                <div class="stat-card">
                    <h3>⏱️ Pointages Aujourd'hui</h3>
                    <p id="todayPointages">-</p>
                </div>
                <div class="stat-card">
                    <h3>⚠️ Retards</h3>
                    <p id="todayRetards">-</p>
                </div>
                <div class="stat-card">
                    <h3>🏖️ Congés</h3>
                    <p id="pendingConges">-</p>
                </div>
            </div>
            
            <div class="recent-activity">
                <h3>Activité Récente</h3>
                <div id="recentActivity"></div>
            </div>
        </div>
    `;
}

async function loadDashboardStats() {
    const employes = await getEmployees();
    const pointages = await getTodayPointages();
    const conges = await getAllConges();
    
    const retards = pointages.filter(p => p.retard).length;
    const pendingConges = conges.filter(c => c.status === 'pending').length;
    
    document.getElementById('totalEmployes').textContent = employes.length;
    document.getElementById('todayPointages').textContent = pointages.length;
    document.getElementById('todayRetards').textContent = retards;
    document.getElementById('pendingConges').textContent = pendingConges;
    
    const recentActivity = pointages.slice(-5).reverse();
    const activityHTML = recentActivity.map(p => {
        const user = employes.find(e => e.id === p.userId);
        return `
            <div class="activity-item">
                <strong>${user?.name || 'Inconnu'}</strong> - ${p.heure} (${p.type})
                ${p.retard ? '<span class="retard-badge">Retard</span>' : ''}
            </div>
        `;
    }).join('') || '<p>Aucune activité aujourd\'hui</p>';
    
    document.getElementById('recentActivity').innerHTML = activityHTML;
}

function renderEmployesManagement() {
    return `
        <div class="employes-management">
            <h2>👥 Gestion des Employés</h2>
            
            <button onclick="showAddEmployeForm()" class="btn-success">➕ Ajouter un Employé</button>
            
            <div id="addEmployeForm" class="form-modal" style="display: none;">
                <h3>Nouvel Employé</h3>
                <input type="text" id="employeName" placeholder="Nom complet">
                <input type="email" id="employeEmail" placeholder="Email">
                <input type="password" id="employePassword" placeholder="Mot de passe">
                
                <div class="shift-selection">
                    <h4>🕐 Shift Horaires</h4>
                    <select id="employeShift" onchange="toggleCustomShift()">
                        <option value="9h-17h">9h00 - 17h00</option>
                        <option value="8h-16h">8h00 - 16h00</option>
                        <option value="10h-18h">10h00 - 18h00</option>
                        <option value="14h-22h">14h00 - 22h00</option>
                        <option value="personnalise">Personnalisé</option>
                    </select>
                    
                    <div id="customShift" style="display: none; margin-top: 10px;">
                        <input type="time" id="shiftStart" value="09:00">
                        <span> à </span>
                        <input type="time" id="shiftEnd" value="17:00">
                    </div>
                </div>
                
                <button onclick="addEmploye()" class="btn-primary">Créer Employé</button>
                <button onclick="hideAddEmployeForm()" class="btn-secondary">Annuler</button>
            </div>
            
            <div class="employes-list">
                <h3>Liste des Employés</h3>
                <div id="employesListContainer"></div>
            </div>
        </div>
    `;
}

function toggleCustomShift() {
    const shiftSelect = document.getElementById('employeShift');
    const customShift = document.getElementById('customShift');
    customShift.style.display = shiftSelect.value === 'personnalise' ? 'block' : 'none';
}

async function loadEmployesList() {
    const employes = await getEmployees();
    const container = document.getElementById('employesListContainer');
    
    if (employes.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun employé enregistré</p>';
        return;
    }
    
    container.innerHTML = employes.map(employe => `
        <div class="employe-card">
            <div class="employe-info">
                <strong>${employe.name}</strong>
                <span>📧 ${employe.email}</span>
                <span>🕐 Shift: ${getShiftDisplay(employe.shift, employe.customShift)}</span>
                <small>Créé le: ${new Date(employe.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="employe-actions">
                <button onclick="viewEmployeDetails(${employe.id})" class="btn-info">👁️ Voir</button>
                <button onclick="editEmploye(${employe.id})" class="btn-secondary">✏️ Modifier</button>
                <button onclick="deleteEmploye(${employe.id})" class="btn-danger">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

function getShiftDisplay(shift, customShift) {
    if (shift === 'personnalise' && customShift) {
        return `${customShift.start} - ${customShift.end}`;
    }
    return shift;
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
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    if (password.length < 4) {
        alert('Le mot de passe doit faire au moins 4 caractères');
        return;
    }
    
    const employe = {
        name: name,
        email: email,
        password: password,
        role: 'employe',
        shift: shift,
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.name
    };
    
    if (shift === 'personnalise') {
        const start = document.getElementById('shiftStart').value;
        const end = document.getElementById('shiftEnd').value;
        employe.customShift = { start, end };
    }
    
    try {
        await createUser(employe);
        alert('✅ Employé créé avec succès !');
        hideAddEmployeForm();
        loadEmployesList();
    } catch (error) {
        alert('❌ Erreur lors de la création de l\'employé');
    }
}

async function viewEmployeDetails(employeId) {
    const employe = await getUserById(employeId);
    const pointages = await getPointagesByUser(employeId);
    const conges = await getCongesByUser(employeId);
    
    const details = `
📋 **Détails de l'employé**

👤 Nom: ${employe.name}
📧 Email: ${employe.email}
🕐 Shift: ${getShiftDisplay(employe.shift, employe.customShift)}
📊 Total pointages: ${pointages.length}
⚠️ Retards: ${pointages.filter(p => p.retard).length}
🏖️ Congés en attente: ${conges.filter(c => c.status === 'pending').length}
    `;
    
    alert(details);
}

async function deleteEmploye(employeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;
    
    try {
        await deleteItem('users', employeId);
        alert('✅ Employé supprimé avec succès');
        loadEmployesList();
    } catch (error) {
        alert('❌ Erreur lors de la suppression');
    }
}

function renderPointagesManagement() {
    return `
        <div class="pointages-management">
            <h2>⏱️ Gestion des Pointages</h2>
            
            <div class="date-filter">
                <label for="pointageDate">Date:</label>
                <input type="date" id="pointageDate" value="${new Date().toISOString().split('T')[0]}">
                <button onclick="loadPointagesByDate()" class="btn-primary">Filtrer</button>
            </div>
            
            <div class="pointages-summary">
                <div class="summary-item">
                    <span>Total pointages:</span>
                    <strong id="totalPointages">0</strong>
                </div>
                <div class="summary-item">
                    <span>Retards:</span>
                    <strong id="totalRetards">0</strong>
                </div>
            </div>
            
            <div id="pointagesList" class="pointages-list"></div>
        </div>
    `;
}

async function loadTodayPointages() {
    await loadPointagesByDate();
}

async function loadPointagesByDate() {
    const date = document.getElementById('pointageDate').value || new Date().toISOString().split('T')[0];
    const pointages = await getPointagesByDate(date);
    const employes = await getEmployees();
    
    const container = document.getElementById('pointagesList');
    const totalPointages = document.getElementById('totalPointages');
    const totalRetards = document.getElementById('totalRetards');
    
    totalPointages.textContent = pointages.length;
    totalRetards.textContent = pointages.filter(p => p.retard).length;
    
    if (pointages.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun pointage pour cette date</p>';
        return;
    }
    
    container.innerHTML = pointages.map(pointage => {
        const employe = employes.find(e => e.id === pointage.userId);
        return `
            <div class="pointage-card ${pointage.retard ? 'retard' : ''}">
                <div class="pointage-info">
                    <strong>${employe?.name || 'Inconnu'}</strong>
                    <span>🕐 ${pointage.heure} - ${pointage.type}</span>
                    <span>📅 ${pointage.date}</span>
                </div>
                <div class="pointage-status">
                    ${pointage.retard ? '<span class="retard-badge">⚠️ Retard</span>' : '<span class="on-time">✅ À l\'heure</span>'}
                </div>
            </div>
        `;
    }).join('');
}

function renderQRManagement() {
    return `
        <div class="qr-management">
            <h2>📱 QR Codes de Pointage</h2>
            
            <div class="qr-container">
                <canvas id="qrCodeCanvas"></canvas>
            </div>
            
            <div class="qr-actions">
                <button onclick="downloadQRCode()" class="btn-primary">📥 Télécharger QR Code</button>
                <button onclick="generateQRCode()" class="btn-secondary">🔄 Regénérer</button>
            </div>
            
            <div class="qr-instructions">
                <h3>📋 Instructions d'utilisation:</h3>
                <p>1. Téléchargez et imprimez ce QR code</p>
                <p>2. Placez-le à l'entrée de votre établissement</p>
                <p>3. Les employés le scanneront pour pointer</p>
                <p>4. Un selfie automatique sera capturé</p>
            </div>
        </div>
    `;
}

function renderAdminManagement() {
    return `
        <div class="admin-management">
            <h2>⚙️ Administration</h2>
            
            <div class="password-change-section">
                <h3>🔐 Changer mon mot de passe</h3>
                <div class="form-group">
                    <input type="password" id="currentPassword" placeholder="Mot de passe actuel">
                    <input type="password" id="newPassword" placeholder="Nouveau mot de passe (min 6 caractères)">
                    <input type="password" id="confirmPassword" placeholder="Confirmer le nouveau mot de passe">
                </div>
                <button onclick="changeMyPassword()" class="btn-primary">Changer le mot de passe</button>
            </div>
            
            <div class="admin-actions-section">
                <h3>👨‍💼 Gestion des Administrateurs</h3>
                <button onclick="showAddAdminForm()" class="btn-success">➕ Ajouter un Administrateur</button>
                
                <div id="addAdminForm" class="form-modal" style="display: none;">
                    <h4>Nouvel Administrateur</h4>
                    <input type="text" id="newAdminName" placeholder="Nom complet">
                    <input type="email" id="newAdminEmail" placeholder="Email">
                    <input type="password" id="newAdminPassword" placeholder="Mot de passe (min 6 caractères)">
                    <button onclick="addNewAdmin()" class="btn-primary">Créer</button>
                    <button onclick="hideAddAdminForm()" class="btn-secondary">Annuler</button>
                </div>
                
                <div class="admins-list">
                    <h4>Administrateurs actuels</h4>
                    <div id="adminsList"></div>
                </div>
            </div>
            
            <div class="backup-section">
                <h3>💾 Sauvegarde des données</h3>
                <p>Sauvegarde manuelle export/import (Netlify)</p>
                <button onclick="exportBackup()" class="btn-primary">📥 Exporter sauvegarde</button>
                <button onclick="showImportDialog()" class="btn-secondary">📤 Importer sauvegarde</button>
                
                <div id="importDialog" style="display: none; margin-top: 15px;">
                    <input type="file" id="backupFile" accept=".json">
                    <button onclick="importBackup()" class="btn-primary">Importer</button>
                    <button onclick="hideImportDialog()" class="btn-secondary">Annuler</button>
                </div>
            </div>
        </div>
    `;
}

async function changeMyPassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Le nouveau mot de passe doit faire au moins 6 caractères');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Les nouveaux mots de passe ne correspondent pas');
        return;
    }
    
    if (currentPassword !== currentAdmin.password) {
        alert('Mot de passe actuel incorrect');
        return;
    }
    
    try {
        await updateItem('users', currentAdmin.id, { 
            password: newPassword,
            lastPasswordChange: new Date().toISOString()
        });
        
        currentAdmin.password = newPassword;
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        alert('✅ Mot de passe changé avec succès !');
        
    } catch (error) {
        alert('❌ Erreur lors du changement de mot de passe');
    }
}

function showAddAdminForm() {
    document.getElementById('addAdminForm').style.display = 'block';
}

function hideAddAdminForm() {
    document.getElementById('addAdminForm').style.display = 'none';
    document.getElementById('newAdminName').value = '';
    document.getElementById('newAdminEmail').value = '';
    document.getElementById('newAdminPassword').value = '';
}

async function addNewAdmin() {
    const name = document.getElementById('newAdminName').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    
    if (!name || !email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    if (password.length < 6) {
        alert('Le mot de passe doit faire au moins 6 caractères');
        return;
    }
    
    const admin = {
        name: name,
        email: email,
        password: password,
        role: 'admin',
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.name
    };
    
    try {
        await createUser(admin);
        alert('✅ Administrateur créé avec succès !');
        hideAddAdminForm();
        loadAdminsList();
    } catch (error) {
        alert('❌ Erreur lors de la création de l\'administrateur');
    }
}

async function loadAdminsList() {
    const users = await getAllUsers();
    const admins = users.filter(user => user.role === 'admin');
    
    const container = document.getElementById('adminsList');
    container.innerHTML = admins.map(admin => `
        <div class="admin-card">
            <div class="admin-info">
                <strong>${admin.name}</strong>
                <span>${admin.email}</span>
                ${admin.createdBy ? `<small>Créé par: ${admin.createdBy}</small>` : ''}
                <small>Membre depuis: ${new Date(admin.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="admin-actions">
                ${admin.id !== currentAdmin.id ? 
                    `<button onclick="deleteAdmin(${admin.id})" class="btn-danger">Supprimer</button>` : 
                    '<span class="current-user">👤 (Vous)</span>'
                }
            </div>
        </div>
    `).join('');
}

async function deleteAdmin(adminId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) return;
    
    const users = await getAllUsers();
    const admins = users.filter(user => user.role === 'admin');
    
    if (admins.length <= 1) {
        alert('❌ Impossible de supprimer le dernier administrateur');
        return;
    }
    
    try {
        await deleteItem('users', adminId);
        alert('✅ Administrateur supprimé avec succès');
        loadAdminsList();
    } catch (error) {
        alert('❌ Erreur lors de la suppression');
    }
}

function generateQRCode() {
    const qrData = JSON.stringify({
        type: 'pointage',
        app: 'GestionHoraires',
        timestamp: Date.now(),
        location: 'entrée_principale',
        version: '2.0'
    });
    
    const canvas = document.getElementById('qrCodeCanvas');
    
    if (!canvas) {
        console.error('Canvas QR code non trouvé');
        return;
    }
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    QRCode.toCanvas(canvas, qrData, {
        width: 256,
        margin: 2,
        color: {
            dark: '#2c3e50',
            light: '#ecf0f1'
        },
        errorCorrectionLevel: 'H'
    }, function(error) {
        if (error) {
            console.error('❌ Erreur génération QR:', error);
            alert('Erreur lors de la génération du QR code');
        }
    });
}

function downloadQRCode() {
    const canvas = document.getElementById('qrCodeCanvas');
    
    if (!canvas) {
        alert('Veuillez d\'abord générer un QR code');
        return;
    }
    
    try {
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `qr-code-pointage-${date}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        console.log('📥 QR code téléchargé');
    } catch (error) {
        console.error('❌ Erreur téléchargement QR:', error);
        alert('Erreur lors du téléchargement du QR code');
    }
}

async function exportBackup() {
    try {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `sauvegarde-horaires-${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        
        alert('✅ Sauvegarde exportée avec succès !');
    } catch (error) {
        alert('❌ Erreur lors de l\'export');
    }
}

function showImportDialog() {
    document.getElementById('importDialog').style.display = 'block';
}

function hideImportDialog() {
    document.getElementById('importDialog').style.display = 'none';
}

async function importBackup() {
    const fileInput = document.getElementById('backupFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Veuillez sélectionner un fichier');
        return;
    }
    
    if (!confirm('Importer ces données ? Les données actuelles seront remplacées.')) {
        return;
    }
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importAllData(data.data);
        alert('✅ Données importées avec succès !');
        hideImportDialog();
        location.reload();
    } catch (error) {
        alert('❌ Erreur lors de l\'import : fichier invalide');
    }
}

async function exportAllData() {
    const [
        users,
        pointages, 
        selfies,
        settings,
        conges
    ] = await Promise.all([
        getAllItems('users'),
        getAllItems('pointages'),
        getAllItems('selfies'),
        getAllItems('settings'),
        getAllItems('conges')
    ]);
    
    return {
        version: 'netlify-1.0',
        exportDate: new Date().toISOString(),
        data: { users, pointages, selfies, settings, conges },
        stats: {
            totalUsers: users.length,
            totalPointages: pointages.length,
            totalSelfies: selfies.length
        }
    };
}

async function importAllData(data) {
    const db = await initDB();
    const stores = ['users', 'pointages', 'selfies', 'settings', 'conges'];
    
    for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        await store.clear();
        
        if (data[storeName] && Array.isArray(data[storeName])) {
            for (const item of data[storeName]) {
                await store.add(item);
            }
        }
    }
}
