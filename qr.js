let html5QrCode = null;
let currentCameraId = null;

function generateQRCode() {
    try {
        const canvas = document.getElementById('qrCodeCanvas');
        if (!canvas) {
            console.error('Canvas QR code non trouvé');
            return;
        }

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        const qrData = JSON.stringify({
            type: 'pointage',
            app: 'ProDigital',
            timestamp: Date.now(),
            version: '2.0'
        });

        QRCode.toCanvas(canvas, qrData, {
            width: 256,
            margin: 2,
            colorDark: '#2c3e50',
            colorLight: '#ffffff'
        }, function(error) {
            if (error) {
                console.error('Erreur génération QR:', error);
                return;
            }
            console.log('✅ QR code généré');
        });

    } catch (error) {
        console.error('Erreur génération QR:', error);
    }
}

function downloadQRCode() {
    try {
        const canvas = document.getElementById('qrCodeCanvas');
        if (!canvas) {
            alert('❌ Veuillez d\'abord générer un QR code');
            return;
        }

        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `qr-code-prodigital-${date}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        alert('✅ QR code téléchargé avec succès');
        
    } catch (error) {
        console.error('Erreur téléchargement QR:', error);
        alert('❌ Erreur lors du téléchargement');
    }
}

// Scanner QR Code Universel - Fonctionne sur tous les navigateurs
async function initializeQRScannerForEmploye() {
    const qrReader = document.getElementById('qrReader');
    
    if (!qrReader) {
        console.error('Élément QR Reader non trouvé');
        return;
    }
    
    try {
        // Utiliser html5-qrcode pour une compatibilité maximale
        html5QrCode = new Html5Qrcode("qrReader");
        
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
            currentCameraId = cameras[0].id;
            
            await html5QrCode.start(
                currentCameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                onQRCodeScanned,
                () => console.log('✅ Scanner QR démarré')
            ).catch(err => {
                console.error('Erreur démarrage scanner:', err);
                fallbackQRScanner();
            });
            
        } else {
            fallbackQRScanner();
        }
        
    } catch (error) {
        console.error('Erreur initialisation scanner:', error);
        fallbackQRScanner();
    }
}

function onQRCodeScanned(decodedText, decodedResult) {
    console.log('✅ QR Code scanné:', decodedText);
    
    try {
        const data = JSON.parse(decodedText);
        
        if (data.type === 'pointage' && data.app === 'ProDigital') {
            // Arrêter le scanner
            stopQRScanner();
            
            // Rediriger vers la sélection d'employé
            showSection('selectEmployeSection');
            loadEmployesForSelection();
            
        } else {
            alert('❌ QR code non valide pour le pointage');
        }
    } catch (error) {
        alert('❌ QR code invalide');
    }
}

function fallbackQRScanner() {
    alert('📱 Scanner non disponible. Utilisez la sélection manuelle.');
    showSection('selectEmployeSection');
    loadEmployesForSelection();
}

async function switchCamera() {
    if (!html5QrCode) return;
    
    try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length < 2) {
            alert('ℹ️ Une seule caméra disponible');
            return;
        }
        
        // Trouver l'index de la caméra actuelle
        const currentIndex = cameras.findIndex(cam => cam.id === currentCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCameraId = cameras[nextIndex].id;
        
        // Arrêter la caméra actuelle
        await html5QrCode.stop();
        
        // Démarrer la nouvelle caméra
        currentCameraId = nextCameraId;
        await html5QrCode.start(
            currentCameraId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            onQRCodeScanned,
            () => console.log('✅ Caméra changée')
        );
        
    } catch (error) {
        console.error('Erreur changement caméra:', error);
    }
}

function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log('✅ Scanner QR arrêté');
            html5QrCode.clear();
            html5QrCode = null;
            currentCameraId = null;
        }).catch(err => {
            console.error('Erreur arrêt scanner:', err);
        });
    }
}
