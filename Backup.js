class BackupManager {
    constructor() {
        this.lastExport = null;
    }
    
    async exportData() {
        const data = await this.exportAllData();
        const timestamp = new Date().toISOString();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `sauvegarde-horaires-${timestamp.split('T')[0]}.json`;
        link.href = url;
        link.click();
        
        this.lastExport = timestamp;
        return true;
    }
    
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    await this.importAllData(data);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    async exportAllData() {
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
    
    async importAllData(data) {
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
}

const netlifyBackup = new BackupManager();

async function initBackupSystem() {
    console.log('💾 Système de sauvegarde Netlify initialisé');
}

async function createBackup() {
    try {
        await netlifyBackup.exportData();
        alert('✅ Sauvegarde exportée avec succès !');
    } catch (error) {
        alert('❌ Erreur lors de l\'export');
    }
}

async function restoreBackup() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!confirm('Importer ces données ? Les données actuelles seront remplacées.')) {
            return;
        }
        
        try {
            await netlifyBackup.importData(file);
            alert('✅ Données importées avec succès !');
            location.reload();
        } catch (error) {
            alert('❌ Erreur lors de l\'import : fichier invalide');
        }
    };
    
    fileInput.click();
}
