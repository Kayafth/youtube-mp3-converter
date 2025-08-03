const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Video bilgilerini al
app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        const cleanUrl = url.includes('&') ? url.split('&')[0] : url;

        if (!cleanUrl || (!url.includes('youtube.com') && !cleanUrl.includes('youtu.be'))) {
            return res.status(400).json({ error: 'Geçersiz YouTube URL' });
        }

        try {
            const { execSync } = require('child_process');

            const infoCommand = `yt-dlp --dump-json "${cleanUrl}"`;
            const infoResult = execSync(infoCommand, {
                encoding: 'utf8',
                timeout: 30000
            });

            const videoData = JSON.parse(infoResult);

            const videoDetails = {
                title: videoData.title || 'Bilinmeyen Video',
                duration: videoData.duration ? Math.floor(videoData.duration) + ' saniye' : 'N/A',
                thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.id}/maxresdefault.jpg`,
                author: videoData.uploader || videoData.channel || 'Bilinmeyen Kanal',
                description: videoData.description ? videoData.description.substring(0, 200) + '...' : 'Açıklama bulunamadı'
            };

            res.json(videoDetails);

        } catch (infoError) {
            console.error('Video bilgisi alınamadı:', infoError.message);

            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;

            const fallbackDetails = {
                title: `Video ${videoId}`,
                duration: 'N/A',
                thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '',
                author: 'YouTube',
                description: 'Video bilgisi alınamadı ama indirme çalışabilir.'
            };

            res.json(fallbackDetails);
        }

    } catch (error) {
        console.error('Genel hata:', error);
        res.status(500).json({
            error: 'Video bilgisi alınamadı.'
        });
    }
});

// MP3 & MP4 indirme
app.post('/api/download', async (req, res) => {
    try {
        const { url, format = 'mp3' } = req.body;
        const cleanUrl = url.includes('&') ? url.split('&')[0] : url;


        if (!cleanUrl || (!cleanUrl.includes('youtube.com') && !cleanUrl.includes('youtu.be'))) {
            return res.status(400).json({ error: 'Geçersiz YouTube URL' });
        }

        const videoIdMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';

        let videoTitle = `Video_${videoId}`;
        try {
            const { execSync } = require('child_process');

            const infoCommand = `yt-dlp --dump-json "${cleanUrl}"`;
            const infoResult = execSync(infoCommand, {
                encoding: 'utf8',
                timeout: 30000
            });

            const videoData = JSON.parse(infoResult);

            if (videoData.title) {
                videoTitle = videoData.title
                    .replace(/[çÇ]/g, 'c')
                    .replace(/[ğĞ]/g, 'g')
                    .replace(/[ıİ]/g, 'i')
                    .replace(/[öÖ]/g, 'o')
                    .replace(/[şŞ]/g, 's')
                    .replace(/[üÜ]/g, 'u')
                    .replace(/[^\w\s\-]/g, '')
                    .replace(/\s+/g, '_')
                    .substring(0, 50);
            }
        } catch (titleError) {
        }

        let ffmpegAvailable = false;
        if (format === 'mp3') {
            try {
                const { execSync } = require('child_process');
                execSync('ffmpeg -version', { stdio: 'ignore' });
                ffmpegAvailable = true;
            } catch (e) {

            }
        }

        try {
            const { execSync } = require('child_process');

            if (format === 'mp4') {
                // MP4 video indirme
                const mp4Command = `yt-dlp --format "best[ext=mp4]/best" -o "${videoTitle}.%(ext)s" "${cleanUrl}"`;

                const result = execSync(mp4Command, {
                    encoding: 'utf8',
                    cwd: downloadsDir,
                    timeout: 120000
                });

                const files = fs.readdirSync(downloadsDir);

                const mp4File = files.find(f =>
                    (f.includes(videoTitle.substring(0, 20)) || f.includes(videoId)) &&
                    (f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mkv'))
                );

                if (mp4File) {
                    const finalPath = path.join(downloadsDir, mp4File);

                    res.download(finalPath, mp4File, (err) => {
                        if (err) {
                            console.error('Download hatası:', err);
                            res.status(500).json({ error: 'Dosya gönderilemedi' });
                        } else {
                            setTimeout(() => {
                                if (fs.existsSync(finalPath)) {
                                    fs.unlinkSync(finalPath);
                                }
                            }, 15000);
                        }
                    });
                    return;
                }

            } else if (format === 'mp3' && ffmpegAvailable) {
                const mp3Command = `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 128K -o "${videoTitle}.%(ext)s" "${cleanUrl}"`;

                const result = execSync(mp3Command, {
                    encoding: 'utf8',
                    cwd: downloadsDir,
                    timeout: 60000
                });

                const files = fs.readdirSync(downloadsDir);

                const mp3File = files.find(f =>
                    (f.includes(videoTitle.substring(0, 20)) || f.includes(videoId)) &&
                    f.endsWith('.mp3')
                );

                if (mp3File) {
                    const finalPath = path.join(downloadsDir, mp3File);

                    res.download(finalPath, mp3File, (err) => {
                        if (err) {
                            console.error('Download hatası:', err);
                            res.status(500).json({ error: 'Dosya gönderilemedi' });
                        } else {
                            setTimeout(() => {
                                if (fs.existsSync(finalPath)) {
                                    fs.unlinkSync(finalPath);
                                }
                            }, 10000);
                        }
                    });
                    return;
                }

            } else {
                const webmCommand = `yt-dlp --format "bestaudio[ext=webm]/bestaudio" -o "${videoTitle}.%(ext)s" "${cleanUrl}"`;

                const result = execSync(webmCommand, {
                    encoding: 'utf8',
                    cwd: downloadsDir,
                    timeout: 60000
                });

                const files = fs.readdirSync(downloadsDir);

                const webmFile = files.find(f =>
                    f.includes(videoTitle.substring(0, 20)) || f.includes(videoId)
                );

                if (webmFile) {
                    const finalPath = path.join(downloadsDir, webmFile);

                    res.download(finalPath, webmFile, (err) => {
                        if (err) {
                            console.error('Download hatası:', err);
                            res.status(500).json({ error: 'Dosya gönderilemedi' });
                        } else {
                            setTimeout(() => {
                                if (fs.existsSync(finalPath)) {
                                    fs.unlinkSync(finalPath);
                                }
                            }, 10000);
                        }
                    });
                    return;
                }
            }

            throw new Error(`${format.toUpperCase()} dosyası oluşturulamadı`);

        } catch (downloadError) {
            console.error('İndirme hatası:', downloadError.message);

            let errorMessage = downloadError.message;
            if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
                errorMessage = 'Bu video 403 Forbidden hatası veriyor. Farklı bir video deneyin.';
            }

            // Demo dosyası
            const demoFileName = `Demo_${format.toUpperCase()}_${videoId}_${Date.now()}.txt`;
            const demoPath = path.join(downloadsDir, demoFileName);

            const demoContent = `YouTube ${format.toUpperCase()} Converter - Debug

Video URL: ${url}
Video ID: ${videoId}
Format: ${format.toUpperCase()}
Tarih: ${new Date().toLocaleString()}

Hata: ${errorMessage}

Bu video muhtemelen 403 Forbidden veriyor.
YouTube bazı videolar için indirme kısıtlaması koyuyor.

Çalışan test videoları:
- https://www.youtube.com/watch?v=dQw4w9WgXcQ
- https://www.youtube.com/watch?v=9bZkp7q19f0
- https://www.youtube.com/watch?v=kJQP7kiw5Fk

Terminal test:
yt-dlp -x --audio-format mp3 "${url}"
`;

            fs.writeFileSync(demoPath, demoContent);

            res.download(demoPath, demoFileName, (err) => {
                if (!err) {
                    setTimeout(() => fs.unlink(demoPath, () => { }), 5000);
                }
            });
        }

    } catch (error) {
        console.error('Genel hata:', error);
        res.status(500).json({ error: 'İndirme başarısız: ' + error.message });
    }
});

// System durumu endpoint'i
app.get('/api/status', (req, res) => {
    res.json({
        library: 'Direct yt-dlp commands',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        features: [
            '100% Self-hosted',
            'No external APIs',
            'Direct YouTube download',
            'MP3 & MP4 support'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Sistem: Tamamen bağımsız (direkt yt-dlp)`);
    console.log(`Node.js: ${process.version}`);
    console.log(`✅ Hiçbir external API kullanılmıyor`);
    console.log(`✅ Tamamen kendi sunucunuzda çalışır`);
});

process.on('SIGINT', () => {
    console.log('\nSunucu kapatılıyor...');
    process.exit(0);
});