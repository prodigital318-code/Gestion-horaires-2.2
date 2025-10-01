const DB_NAME = 'ProDigitalDB';
const DB_VERSION = 3;
let db;

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            const stores = ['users', 'pointages', 'selfies', 'conges'];
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    const objectStore = db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                    
                    if (store === 'users') {
                        objectStore.createIndex('email', 'email', { unique: true });
                    }
                    if (store === 'pointages') {
                        objectStore.createIndex('userId', 'userId', { unique: false });
                        objectStore.createIndex('date', 'date', { unique: false });
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

async function createDefaultAdmin() {
    const users = await getAllItems('users');
    const adminExists = users.some(user => user.email === 'prodigital318@gmail.com');
    
    if (!adminExists) {
        const defaultAdmin = {
            name: "Administrateur ProDigital",
            email: "prodigital318@gmail.com",
            password: "12345678",
            role: "admin",
            createdAt: new Date().toISOString()
        };
        
        await addItem('users', defaultAdmin);
    }
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
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function updateItem(storeName, key, updates) {
    const item = await getItem(storeName, key);
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
    return addItem('pointages', pointageData);
}

async function getPointagesByUser(userId) {
    const pointages = await getAllItems('pointages');
    return pointages.filter(p => p.userId === userId)
                   .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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

async function getSelfiesByUser(userId) {
    const selfies = await getAllItems('selfies');
    return selfies.filter(s => s.userId === userId);
}

async function getAllSelfies() {
    return getAllItems('selfies');
}
