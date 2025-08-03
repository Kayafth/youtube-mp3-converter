const form = document.getElementById('converterForm');
const urlInput = document.getElementById('youtubeUrl');
const getInfoBtn = document.getElementById('getInfoBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const success = document.getElementById('success');
const videoInfo = document.getElementById('videoInfo');
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');

const formatBtns = document.querySelectorAll('.format-btn');
let selectedFormat = 'mp3';

function showLoading() {
    loading.style.display = 'block';
    error.style.display = 'none';
    success.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    success.style.display = 'none';
}

function showSuccess(message) {
    success.textContent = message;
    success.style.display = 'block';
    error.style.display = 'none';
}

formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        formatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFormat = btn.dataset.format;
        
        // Download buton metnini güncelle
        const btnText = selectedFormat === 'mp3' ? 'MP3 Olarak İndir' : 'MP4 Olarak İndir';
        downloadBtn.textContent = btnText;
    });
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    if (!url) {
        showError('Lütfen geçerli bir YouTube URL\'si girin');
        return;
    }

    showLoading();
    getInfoBtn.disabled = true;

    try {
        const response = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Bir hata oluştu');
        }

        // Video bilgilerini göster
        thumbnail.src = data.thumbnail;
        videoTitle.textContent = data.title;
        videoAuthor.textContent = `Kanal: ${data.author}`;
        
        videoInfo.style.display = 'block';
        showSuccess('Video bilgileri başarıyla alındı!');

    } catch (err) {
        showError('Video bilgileri alınamadı: ' + err.message);
        videoInfo.style.display = 'none';
    } finally {
        hideLoading();
        getInfoBtn.disabled = false;
    }
});

downloadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;

    const formatText = selectedFormat.toUpperCase();
    showLoading();
    downloadBtn.disabled = true;
    downloadBtn.textContent = `${formatText} İndiriliyor...`;

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, format: selectedFormat })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `${formatText} indirme başarısız`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `${videoTitle.textContent || 'video'}.${selectedFormat}`;
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch) {
                fileName = fileNameMatch[1];
            }
        }
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        showSuccess(`${formatText} dosyası başarıyla indirildi!`);

    } catch (err) {
        showError(`${formatText} indirme hatası: ` + err.message);
    } finally {
        hideLoading();
        downloadBtn.disabled = false;
        downloadBtn.textContent = `${selectedFormat.toUpperCase()} Olarak İndir`;
    }
});