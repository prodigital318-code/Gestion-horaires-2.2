let cameraStream = null;
let countdownInterval = null;

async function startCameraForPointage() {
    try {
        const video = document.getElementById('cameraVideo');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('❌ Votre navigateur ne supporte pas la caméra');
            showSection('employeSection');
            return;
        }
        
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = cameraStream;
        startCountdown();
        
    } catch (error) {
        console.error('Erreur caméra:', error);
        
        if (error.name === 'NotAllowedError') {
            alert('❌ Accès à la caméra refusé. Autorisez l\'accès dans les paramètres.');
        } else if (error.name === 'NotFoundError') {
            alert('❌ Aucune caméra disponible.');
        } else {
            alert('❌ Impossible d\'accéder à la caméra');
        }
        
        showSection('employeSection');
    }
}

function startCountdown() {
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    
    countdownElement.textContent = countdown;
    
    countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            captureSelfieForPointage();
        }
    }, 1000);
}

async function captureSelfieForPointage() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
        const selfieData = {
            userId: currentUser.id,
            timestamp: new Date().toISOString(),
            type: 'selfie_pointage',
            userName: currentUser.name
        };
        
        const selfieId = await saveSelfie(selfieData);
        await enregistrerPointage(selfieId);
        
        stopCamera();
        
        if (currentUser.role === 'admin') {
            showSection('adminSection');
            alert('✅ Pointage enregistré avec succès!');
        } else {
            showSection('employeSection');
            initEmployeInterface();
        }
        
    } catch (error) {
        console.error('Erreur capture selfie:', error);
        alert('❌ Erreur lors de la capture du selfie');
        stopCamera();
        showSection('employeSection');
    }
}

async function enregistrerPointage(selfieId) {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    const today = now.toISOString().split('T')[0];
    
    const pointagesAujourdhui = await getPointagesByUser(currentUser.id);
    const pointagesToday = pointagesAujourdhui.filter(p => p.date === today);
    
    const type = pointagesToday.length % 2 === 0 ? 'arrivée' : 'départ';
    
    const shift = currentUser.shift || '9h-17h';
    const heureLimite = getHeureLimite(shift, currentUser.customShift);
    const retard = type === 'arrivée' && currentTime > heureLimite;
    
    let retardMinutes = 0;
    if (retard) {
        const [heureLimiteH, heureLimiteM] = heureLimite.split(':').map(Number);
        const [currentH, currentM] = currentTime.split(':').map(Number);
        
        const limiteTotalMinutes = heureLimiteH * 60 + heureLimiteM;
        const currentTotalMinutes = currentH * 60 + currentM;
        
        retardMinutes = currentTotalMinutes - limiteTotalMinutes;
    }
    
    const pointageData = {
        userId: currentUser.id,
        userName: currentUser.name,
        date: today,
        heure: currentTime,
        type: type,
        selfieId: selfieId,
        retard: retard,
        retardMinutes: retardMinutes,
        shift: shift,
        timestamp: now.toISOString()
    };
    
    await addPointage(pointageData);
    
    if (retard) {
        alert(`⚠️ Pointage ${type} enregistré avec RETARD de ${retardMinutes} minutes (${currentTime})`);
    } else {
        alert(`✅ Pointage ${type} enregistré avec succès à ${currentTime}`);
    }
}

function getHeureLimite(shift, customShift) {
    if (shift === 'personnalise' && customShift) {
        return customShift.start;
    }
    
    const shifts = {
        '9h-17h': '09:15',
        '8h-16h': '08:15',
        '10h-18h': '10:15', 
        '14h-22h': '14:15'
    };
    
    return shifts[shift] || '09:15';
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
            track.stop();
        });
        cameraStream = null;
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const video = document.getElementById('cameraVideo');
    if (video) {
        video.srcObject = null;
    }
}
