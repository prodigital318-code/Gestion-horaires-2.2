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
                    <h3>📸 Selfies</h3>
                    <p id="totalSelfies">-</p>
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
    try {
        const employes = await getEmployees();
        const pointages = await getTodayPointages();
        const selfies = await getAllSelfies();
        
        const retards = pointages.filter(p => p.retard).length;
        
        document.getElementById('totalEmployes').textContent = employes.length;
        document.getElementById('todayPointages').textContent = pointages.length;
        document.getElementById('todayRetards').textContent = retards;
        document.getElementById('totalSelfies').textContent = selfies.length;
        
        const recentActivity = pointages.slice(-5).reverse();
        const activityHTML = recentActivity.map(p => {
            return `
                <div class="activity-item" style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.userName}</strong> - ${p.heure} (${p.type})
                    </div>
                    ${p.retard ? '<span style="color: red; font-weight: bold;">⚠️ Retard</span>' : '<span style="color: green;">✅ À l\'heure</span>'}
                </div>
            `;
        }).join('') || '<p style="text-align: center; color: #666; padding: 20px;">Aucune activité aujourd\'hui</p>';
        
        document.getElementById('recentActivity').innerHTML = activityHTML;
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}

function renderEmployesManagement() {
    return `
        <div class="employes-management">
            <h2>👥 Gestion des Employés</h2>
            
            <button onclick="showAddEmployeForm()" class="btn-primary">➕ Ajouter un Employé</button>
            
            <div id="addEmployeForm" style="display: none; margin-top: 20px; padding: 25px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #3498db;">
                <h3 style="margin-bottom: 20px; color: #2c3e50;">Nouvel Employé</h3>
                <div class="form-group">
                    <input type="text" id="employeName" placeholder="Nom complet" style="margin-bottom: 15px;">
                    <input type="email" id="employeEmail" placeholder="Email" style="margin-bottom: 15px;">
                    <input type="password" id="employePassword" placeholder="Mot de passe" style="margin-bottom: 15px;">
                </div>
                
                <div style="margin: 20px 0;">
                    <h4 style="margin-bottom: 10px; color: #2c3e50;">🕐 Shift Horaires</h4>
                    <select id="employeShift" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #ddd;">
                        <option value="9h-17h">9h00 - 17h00</option>
                        <option value="8h-16h">8h00 - 16h00</option>
                        <option value="10h-18h">10h00 - 18h00</option>
                        <option value="14h-22h">14h00 - 22h00</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="addEmploye()" class="btn-primary" style="flex: 1;">Créer Employé</button>
                    <button onclick="hideAddEmployeForm()" class="btn-secondary" style="flex: 1;">Annuler</button>
                </div>
            </div>
            
            <div class="employes-list" style="margin-top: 30px;">
                <h3 style="margin-bottom: 20px; color: #2c3e50;">Liste des Employés</h3>
                <div id="employesListContainer"></div>
            </div>
        </div>
    `;
}

async function loadEmployesList() {
    try {
        const employes = await getEmployees();
        const container = document.getElementById('employesListContainer');
        
        if (employes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun employé enregistré</p>';
            return;
        }
        
        container.innerHTML = employes.map(employe => `
            <div class="employe-card">
                <div class="employe-info">
                    <strong>${employe.name}</strong>
                    <span style="color: #666;">📧 ${employe.email}</span>
                    <span style="color: #666;">🕐 Shift: ${employe.shift}</span>
                    <small style="color: #999;">Créé le: ${new Date(employe.createdAt).toLocaleDateString('fr-FR')}</small>
                </div>
                <div class="employe-actions">
                    <button onclick="viewEmployeStats(${employe.id})" class="btn-info">📊 Stats</button>
                    <button onclick="deleteEmploye(${employe.id})" class="btn-danger">🗑️ Supprimer</button>
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
        loadDashboardStats(); // Mettre à jour les stats
    } catch (error) {
        alert('❌ Erreur lors de la création de l\'employé: ' + error.message);
    }
}

async function viewEmployeStats(employeId) {
    const employe = await getUserById(employeId);
    const pointages = await getPointagesByUser(employeId);
    const today = new Date().toISOString().split('T')[0];
    
    const pointagesAujourdhui = pointages.filter(p => p.date === today);
    const retardsMois = pointages.filter(p => p.retard && p.date.startsWith(new Date().toISOString().substring(0, 7))).length;
    
    alert(`📊 Statistiques de ${employe.name}:

📅 Pointages aujourd'hui: ${pointagesAujourdhui.length}
⚠️ Retards ce mois: ${retardsMois}
📋 Total pointages: ${pointages.length}
🕐 Dernier shift: ${employe.shift}
    `);
}

async function deleteEmploye(employeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.')) return;
    
    try {
        await deleteItem('users', employeId);
        alert('✅ Employé supprimé avec succès');
        loadEmployesList();
        loadDashboardStats(); // Mettre à jour les stats
    } catch (error) {
        alert('❌ Erreur lors de la suppression');
    }
}

function renderPointagesManagement() {
    const today = new Date().toISOString().split('T')[0];
    return `
        <div class="employes-management">
            <h2>⏱️ Gestion des Pointages</h2>
            
            <div style="margin-bottom: 25px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <label for="pointageDate" style="font-weight: 600; color: #2c3e50;">Date:</label>
                <input type="date" id="pointageDate" value="${today}" style="padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <button onclick="loadPointagesByDate()" class="btn-primary">🔍 Filtrer</button>
                <button onclick="exportPointages()" class="btn-info">📤 Exporter</button>
            </div>
            
            <div id="pointagesSummary" style="margin-bottom: 20px;"></div>
            
            <div id="pointagesList"></div>
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
        
        summary.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${totalPointages}</div>
                    <div style="color: #666; font-size: 0.9rem;">Total pointages</div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${retards > 0 ? '#e74c3c' : '#27ae60'};">${retards}</div>
                    <div style="color: #666; font-size: 0.9rem;">Retards</div>
                </div>
            </div>
        `;
        
        if (pointages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun pointage pour cette date</p>';
            return;
        }
        
        container.innerHTML = pointages.map(pointage => `
            <div class="employe-card" style="border-left: 4px solid ${pointage.retard ? '#e74c3c' : '#27ae60'};">
                <div class="employe-info">
                    <strong>${pointage.userName}</strong>
                    <span style="color: #666;">🕐 ${pointage.heure} - ${pointage.type === 'arrivée' ? '🟢 Arrivée' : '🔴 Départ'}</span>
                    <span style="color: #666;">📅 ${pointage.date}</span>
                    ${pointage.retard ? 
                        `<span style="color: #e74c3c; font-weight: bold;">⚠️ Retard de ${pointage.retardMinutes} minutes</span>` : 
                        '<span style="color: #27ae60;">✅ À l\'heure</span>'
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
        <div class="employes-management">
            <h2>📱 Gestion des QR Codes</h2>
            
            <div style="text-align: center; margin: 30px 0;">
                <canvas id="qrCodeCanvas" width="256" height="256" style="border: 2px solid #ddd; padding: 20px; background: white; border-radius: 10px;"></canvas>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <button onclick="generateQRCode()" class="btn-primary" style="margin: 5px;">🔄 Générer QR Code</button>
                <button onclick="downloadQRCode()" class="btn-success" style="margin: 5px;">📥 Télécharger</button>
                <button onclick="printQRCode()" class="btn-secondary" style="margin: 5px;">🖨️ Imprimer</button>
            </div>
            
            <div style="padding: 25px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #3498db;">
                <h3 style="margin-bottom: 15px; color: #2c3e50;">📋 Instructions d'utilisation:</h3>
                <div style="display: grid; gap: 10px;">
                    <p>1. <strong>Générer le QR code</strong> - Cliquez sur "Générer QR Code"</p>
                    <p>2. <strong>Télécharger/Imprimer</strong> - Téléchargez ou imprimez le QR code</p>
                    <p>3. <strong>Placer à l'entrée</strong> - Affichez le QR code à l'entrée de votre établissement</p>
                    <p>4. <strong>Utilisation employés</strong> - Les employés scannent avec leur appareil photo</p>
                    <p>5. <strong>Selfie automatique</strong> - Le système capture automatiquement un selfie</p>
                </div>
            </div>
            
            <div style="margin-top: 25px; padding: 20px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffeaa7;">
                <h4 style="color: #856404; margin-bottom: 10px;">💡 Conseil</h4>
                <p style="color: #856404; margin: 0;">Imprimez le QR code en format A4 pour une meilleure lisibilité. Placez-le dans un endroit bien éclairé.</p>
            </div>
        </div>
    `;
}

function printQRCode() {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) {
        alert('❌ Veuillez d\'abord générer un QR code');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Code ProDigital</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                    .header { margin-bottom: 30px; }
                    .instructions { margin-top: 30px; text-align: left; max-width: 500px; margin: 30px auto; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🏢 ProDigital</h1>
                    <h2>QR Code de Pointage</h2>
                    <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
                </div>
                <img src="${canvas.toDataURL('image/png')}" alt="QR Code" style="max-width: 300px;">
                <div class="instructions">
                    <h3>Instructions d'utilisation:</h3>
                    <ol>
                        <li>Imprimez ce QR code en format A4</li>
                        <li>Placez-le à l'entrée de votre établissement</li>
                        <li>Les employés le scanneront avec leur appareil photo</li>
                        <li>Un selfie automatique sera capturé pour vérification</li>
                    </ol>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}
