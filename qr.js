// QR Code unique et permanent
let qrScanner = null;
let isScanning = false;

// Générer le QR code unique au chargement
function generateUniqueQRCode() {
    try {
        const canvas = document.getElementById('qrCodeCanvas');
        if (!canvas) {
            console.error('Canvas QR code non trouvé');
            return;
        }

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        // QR code permanent avec identifiant unique
        const qrData = JSON.stringify({
            type: 'pointage',
            app: 'ProDigital',
            company: 'VotreEntreprise',
            action: 'employe_pointage',
            permanent: true,
            id: 'prodigital-permanent-qr-2024'
        });

        QRCode.toCanvas(canvas, qrData, {
            width: 300,
            margin: 2,
            colorDark: '#2c3e50',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        }, function(error) {
            if (error) {
                console.error('Erreur génération QR:', error);
                showQRCodeError();
                return;
            }
            console.log('✅ QR code permanent généré');
        });

    } catch (error) {
        console.error('Erreur génération QR:', error);
        showQRCodeError();
    }
}

function showQRCodeError() {
    const container = document.querySelector('.qr-management');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'qr-error';
        errorDiv.innerHTML = `
            <div class="error-message">
                <h3>❌ Erreur QR Code</h3>
                <p>Le QR code n'a pas pu être généré.</p>
                <button onclick="generateUniqueQRCode()" class="btn-primary">🔄 Réessayer</button>
            </div>
        `;
        container.appendChild(errorDiv);
    }
}

// Scanner QR Code
async function initializeQRScannerForEmploye() {
    const statusDiv = document.getElementById('qrScanStatus');
    
    if (!statusDiv) {
        console.error('Élément status non trouvé');
        return;
    }

    statusDiv.innerHTML = `
        <div class="scan-loading">
            <div class="loading-spinner"></div>
            <p>🔄 Initialisation du scanner...</p>
        </div>
    `;

    try {
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error('Librairie QR scanner non chargée');
        }

        qrScanner = new Html5Qrcode("qrReader");
        
        const cameras = await Html5Qrcode.getCameras();
        
        if (cameras.length === 0) {
            throw new Error('Aucune caméra disponible');
        }

        const cameraId = cameras.find(cam => cam.label.toLowerCase().includes('back'))?.id || cameras[0].id;

        statusDiv.innerHTML = `
            <div class="scan-active">
                <div class="scan-animation"></div>
                <p>🔍 Scanner actif</p>
                <p class="scan-tip">Pointez la caméra vers le QR code</p>
            </div>
        `;

        await qrScanner.start(
            cameraId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            onQRCodeScanned,
            () => console.log('✅ Scanner QR démarré')
        );

        isScanning = true;

    } catch (error) {
        console.error('❌ Erreur scanner:', error);
        handleScannerError(error, statusDiv);
    }
}

function onQRCodeScanned(decodedText, decodedResult) {
    console.log('✅ QR Code détecté:', decodedText);
    
    try {
        const data = JSON.parse(decodedText);
        
        // Accepter tous les QR codes ProDigital
        if (data.app === 'ProDigital' && data.type === 'pointage') {
            handleValidQRCode();
        } else {
            showNotification('❌ QR code non reconnu', 'error');
        }
    } catch (error) {
        console.error('QR code invalide:', error);
        showNotification('❌ QR code invalide', 'error');
    }
}

function handleValidQRCode() {
    if (!isScanning) return;
    
    stopQRScanner();
    
    const statusDiv = document.getElementById('qrScanStatus');
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="scan-success">
                <div class="success-icon">✅</div>
                <h3>QR Code Validé !</h3>
                <p>Redirection vers le pointage...</p>
            </div>
        `;
    }
    
    setTimeout(() => {
        showSection('selectEmployeSection');
        loadEmployesForSelection();
    }, 1500);
}

function handleScannerError(error, statusDiv) {
    statusDiv.innerHTML = `
        <div class="scan-error">
            <div class="error-icon">❌</div>
            <h3>Erreur du scanner</h3>
            <p>Utilisez la sélection directe</p>
            <button onclick="showSection('selectEmployeSection')" class="btn-primary">
                👤 Pointer directement
            </button>
        </div>
    `;
}

function stopQRScanner() {
    if (qrScanner && isScanning) {
        qrScanner.stop().then(() => {
            qrScanner.clear();
            qrScanner = null;
            isScanning = false;
        }).catch(err => {
            console.error('Erreur arrêt scanner:', err);
        });
    }
}

function showNotification(message, type = 'info') {
    alert(message); // Version simplifiée
}
