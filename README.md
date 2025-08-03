# YouTube MP3 Converter

Bu proje, YouTube videolarını **MP3 ses dosyası** veya **MP4 video dosyası** formatında indirmenize olanak sağlar. Tamamen kendi sunucunuzda barındırabileceğiniz, reklamsız ve kullanıcı dostu bir dönüştürme uygulamasıdır.

## Özellikler

- 🎵 YouTube videolarını MP3'e dönüştürme
- 🖼️ Video önizleme ve bilgileri
- 📱 Responsive tasarım
- 🔒 Güvenli - dosyalar otomatik silinir
- ⚡ Hızlı dönüştürme

## Kurulum

### Gereksinimler

1. **Node.js** (v14 veya üzeri)
2. **FFmpeg** - ses dönüştürme için gerekli

#### FFmpeg Kurulumu:

**Windows:**
```bash
# Chocolatey ile
choco install ffmpeg

# Winget ile (Windows 10/11)
winget install FFmpeg


# Veya manuel olarak https://ffmpeg.org/download.html adresinden indirin
```

**macOS:**
```bash
# Homebrew ile
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

### Proje Kurulumu

1. Proje dosyalarını bir klasöre kaydedin
2. Terminal/Command Prompt'u açın ve proje klasörüne gidin
3. Bağımlılıkları yükleyin:

```bash
npm install
```

4. Uygulamayı başlatın:

```bash
npm start
```

Veya geliştirme modunda:

```bash
npm run dev
```

5. Tarayıcınızda `http://localhost:3000` adresine gidin

## Kullanım

1. YouTube video URL'sini girin
2. "Video Bilgilerini Al" butonuna tıklayın
3. Video bilgileri görüntülendikten sonra "MP3 Olarak İndir" butonuna tıklayın
4. Dosya otomatik olarak indirilecektir



### POST /api/video-info
Video bilgilerini getirir.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

**Response:**
```json
{
  "title": "Video Başlığı",
  "duration": "180",
  "thumbnail": "https://...",
  "author": "Kanal Adı"
}
```

### POST /api/download
Video MP3 olarak indirir.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

**Response:** MP3 dosyası (binary)

## Teknik Detaylar

- **Backend:** Node.js + Express
- **YouTube API:** ytdl-core
- **Ses Dönüştürme:** FFmpeg + fluent-ffmpeg
- **Frontend:** Vanilla HTML/CSS/JavaScript

## Güvenlik ve Temizlik

- İndirilen dosyalar 5 saniye sonra otomatik olarak silinir
- CORS koruması aktif
- Input validation yapılır
- Geçersiz URL'ler reddedilir

## Sorun Giderme

### "FFmpeg not found" hatası
- FFmpeg'in doğru kurulduğundan emin olun
- PATH environment variable'ına FFmpeg eklendiğini kontrol edin



### "Video unavailable" hatası
- Video'nun herkese açık olduğundan emin olun
- URL'nin doğru formatda olduğunu kontrol edin



## Uyarı

Bu uygulama sadece eğitim amaçlıdır. YouTube'un Terms of Service'ini ihlal etmemek için dikkatli olun. Telif hakkı korumalı içerikleri indirmeden önce gerekli izinleri aldığınızdan emin olun.

<!-- Project updated -->


🧑‍💻 Author
Fatih Kaya
GitHub: github.com/Kayafth