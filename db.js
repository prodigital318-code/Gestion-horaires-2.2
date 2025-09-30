const DB_NAME = 'GestionHorairesDB';
const DB_VERSION = 4;
let db;

const DB_STORES = {
    users: { keyPath: 'id', autoIncrement: true },
    pointages: { keyPath: 'id', autoIncrement: true },
    selfies: { keyPath: 'id', autoIncrement: true },
    settings: { keyPath: 'key' },
    conges: { keyPath: 'id', autoIncrement: true }
};

async function createDefaultAdmin() {
    const users = await getAllItems('users');
    const adminExists = users.some(user => user.role === 'admin');
    
    if (!adminExists) {
        const defaultAdmin = {
            name: "Administrateur ProDigital",
            email: "prodigital318@gmail.com",
            password: "12345678",
            role: "admin",
            createdAt: new Date().toISOString(),
            isDefaultAdmin: true
        };
        
        await addItem('users', defaultAdmin);
        console.log('✅ Admin par défaut créé');
    }
}

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            Object.keys(DB_STORES).forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, DB_STORES[storeName]);
                    
                    if (storeName === 'users') {
                        store.createIndex('email', 'email', { unique: true });
                        store.createIndex('role', 'role', { unique: false });
                    }
                    if (storeName === 'pointages') {
                        store.createIndex('userId', 'userId', { unique: false });
                        store.createIndex('date', 'date', { unique: false });
                    }
                    if (storeName === 'conges') {
                        store.createIndex('userId', 'userId', { unique: false });
                        store.createIndex('status', 'status', { unique: false });
                    }
                }
            });
        };
        
        request.onsuccess = async (event) => {
            db = event.target.result;
            await createDefaultAdmin();
            resolve(db);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function addItem(storeName, item) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getItem(storeName, key) {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllItems(storeName) {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateItem(storeName, key, updates) {
    const item = await getItem(storeName, key);
    if (!item) throw new Error('Item non trouvé');
    
    const updatedItem = { ...item, ...updates };
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
        const request = store.put(updatedItem);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteItem(storeName, key) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function createUser(userData) {
    return addItem('users', userData);
}

async function authenticateUser(email, password) {
    const users = await getAllItems('users');
    return users.find(user => user.email === email && user.password === password);
}

async function getUserById(id) {
    return getItem('users', id);
}

async function getAllUsers() {
    return getAllItems('users');
}

async function getEmployees() {
    const users = await getAllItems('users');
    return users.filter(user => user.role === 'employe');
}

async function addPointage(pointageData) {
    return addItem('pointages', {
        ...pointageData,
        timestamp: new Date().toISOString()
    });
}

async function getPointagesByUser(userId) {
    const pointages = await getAllItems('pointages');
    return pointages.filter(p => p.userId === userId);
}

async function getTodayPointages() {
    const today = new Date().toISOString().split('T')[0];
    const pointages = await getAllItems('pointages');
    return pointages.filter(p => p.date === today);
}

async function getPointagesByDate(date) {
    const pointages = await getAllItems('pointages');
    return pointages.filter(p => p.date === date);
}

async function saveSelfie(selfieData) {
    return addItem('selfies', selfieData);
}

async function getSelfieByPointage(pointageId) {
    const selfies = await getAllItems('selfies');
    return selfies.find(s => s.pointageId === pointageId);
}

async function addCongeRequest(congeData) {
    return addItem('conges', congeData);
}

async function getCongesByUser(userId) {
    const conges = await getAllItems('conges');
    return conges.filter(c => c.userId === userId);
}

async function getAllConges() {
    return getAllItems('conges');
}
