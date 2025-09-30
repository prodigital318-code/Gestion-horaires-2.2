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

function startQRScanner() {
    if (!('BarcodeDetector' in window)) {
        console.warn('BarcodeDetector non supporté sur ce navigateur');
        showManualQRInput();
        return;
    }
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('🔒 Scanner QR nécessite HTTPS.\n\nDéployez sur Netlify pour utiliser cette fonctionnalité.');
        return;
    }
    
    const video = document.getElementById('cameraVideo');
    
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
    }).then(stream => {
        video.srcObject = stream;
        video.play();
        
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
        let scanActive = true;
        
        const detectBarcode = () => {
            if (!scanActive) return;
            
            barcodeDetector.detect(video)
                .then(barcodes => {
                    if (barcodes.length > 0) {
                        const qrData = barcodes[0].rawValue;
                        console.log('📱 QR code détecté:', qrData);
                        handleScannedQR(qrData);
                        scanActive = false;
                    } else {
                        requestAnimationFrame(detectBarcode);
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur scan QR:', error);
                    setTimeout(detectBarcode, 1000);
                });
        };
        
        detectBarcode();
        
    }).catch(error => {
        console.error('❌ Erreur caméra scan:', error);
        alert('Impossible d\'accéder à la caméra pour le scan');
        showManualQRInput();
    });
}

function showManualQRInput() {
    const manualCode = prompt(
        'Scan QR code non disponible.\n\n' +
        'Veuillez saisir manuellement le code QR ou contactez l\'administration pour obtenir un nouveau QR code.',
        ''
    );
    
    if (manualCode) {
        handleScannedQR(manualCode);
    }
}

function handleScannedQR(qrData) {
    try {
        const data = JSON.parse(qrData);
        
        if (!isValidQRCode(data)) {
            alert('❌ QR code invalide ou expiré');
            return;
        }
        
        if (data.type === 'pointage' && data.app === 'GestionHoraires') {
            showSection('cameraSection');
            startCameraForPointage();
        } else {
            alert('❌ Type de QR code non reconnu');
        }
    } catch (error) {
        console.error('❌ QR code invalide:', error);
        alert('❌ QR code invalide. Veuillez scanner un QR code valide.');
    }
}

function isValidQRCode(data) {
    if (!data || !data.type || !data.app) {
        return false;
    }
    
    if (data.security && data.security.expires) {
        if (Date.now() > data.security.expires) {
            console.warn('QR code expiré');
            return false;
        }
    }
    
    return true;
}
