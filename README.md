# Galeri Cleaner

Telefon galerindeki fotoğraf ve videoları Tinder benzeri swipe hareketiyle hızlıca ayıkla.

- **Sağa swipe** → Koru
- **Sola swipe** → Sil (iOS "Son Silinenler" klasörüne gider)
- **Geri Al** → Silme işlemi gerçekleşmeden iptal et
- Fotoğraf ve video desteği
- İlerleme sayacı ve oturum istatistikleri

---

## Ön Gereksinimler

| Araç | Versiyon | Kontrol |
|---|---|---|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| Xcode | ≥ 15 | Mac App Store |
| CocoaPods | ≥ 1.14 | `pod --version` |
| iOS cihaz | iOS 16+ | — |

CocoaPods kurulu değilse:
```bash
sudo gem install cocoapods
```

---

## Kurulum

### 1. Bağımlılıkları yükle

```bash
cd /Users/mustafa/Desktop/galeri-clenaer
npm install
```

### 2. Native iOS projesini oluştur (Expo Prebuild)

```bash
npx expo prebuild --platform ios
```

> Bu komut `ios/` klasörünü ve Xcode projesini oluşturur. `app.json`'daki izin metinleri ve bundle ID otomatik olarak `Info.plist`'e işlenir.

### 3. CocoaPods bağımlılıklarını kur

```bash
cd ios
pod install
cd ..
```

### 4. iPhone'u Mac'e bağla

- iPhone'u USB ile Mac'e bağla.
- iPhone'da **Güven** (Trust) seçeneğine dokun.
- Xcode > **Window > Devices and Simulators** menüsünden cihazın görüldüğünü doğrula.

### 5. Xcode'da aç ve cihaza yükle

```bash
open ios/GaleriCleaner.xcworkspace
```

> ⚠️ `.xcworkspace` dosyasını aç, `.xcodeproj` değil.

Xcode'da:
1. Sol panelden **GaleriCleaner** projesine tıkla.
2. **Signing & Capabilities** sekmesini aç.
3. **Team** alanında Apple ID'ni seç (ücretsiz geliştirici hesabı yeterli).
4. **Bundle Identifier**'ı benzersiz yap: örn. `com.senin_adin.galericleaner`
5. Üst araç çubuğunda hedef cihazı iPhone olarak seç.
6. **▶ Run** (Cmd+R) ile derle ve yükle.

---

## Sık Karşılaşılan Sorunlar

### "Untrusted Developer" hatası

iPhone'da: **Ayarlar → Genel → VPN ve Cihaz Yönetimi** → Geliştirici uygulamasına güven.

### Pod install hataları

```bash
cd ios
pod deintegrate
pod install
```

### Build hataları — temiz build

Xcode menüsü: **Product → Clean Build Folder** (Shift+Cmd+K), sonra tekrar çalıştır.

### "Module not found" hatası

```bash
npm install
cd ios && pod install
```

### Reanimated / Gesture Handler çalışmıyor

`babel.config.js` dosyasında `react-native-reanimated/plugin`'in en son eklenti olduğunu kontrol et (zaten ekli).

---

## Geliştirici Notu: Silme Mekanizması

- **Undo penceresi (3.5 sn)**: Kullanıcı sola swipe yapar yapmaz silme işlemi başlamaz. 3.5 saniyelik bir geri alma penceresi açılır.
- **Geri alma**: Kullanıcı "Geri Al" butonuna basarsa `deleteAssetsAsync` hiç çağrılmaz; öğe "tutuldu" sayılır.
- **iOS native silme**: Undo penceresi dolduğunda `MediaLibrary.deleteAssetsAsync([id])` çağrılır. Bu fonksiyon iOS altında `PHPhotoLibrary.performChanges { PHAssetChangeRequest.deleteAssets }` kullanır. iOS zorunlu olarak bir onay dialog'u gösterir ("Fotoğrafı Sil?" / "Videoyu Sil?"). Kullanıcı onaylarsa öğe **Son Silinenler**'e taşınır (30 gün saklanır).
- **İptal**: Kullanıcı iOS dialog'unda "İptal" seçerse `deleteAssetsAsync` false döner; öğe "tutuldu" sayılır.

---

## Proje Yapısı

```
galeri-cleaner/
├── App.tsx                          # Giriş noktası, ekran yönetimi
├── app.json                         # Expo konfigürasyonu + iOS izinleri
├── babel.config.js                  # Reanimated plugin dahil
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    │   └── index.ts                 # Ortak TypeScript tipleri
    ├── constants/
    │   └── theme.ts                 # Renkler, tipografi, sabitler
    ├── hooks/
    │   ├── useMediaAssets.ts        # Galeri okuma, sayfalama, silme
    │   └── useSwipeSession.ts       # Oturum state'i, undo mantığı
    ├── components/
    │   ├── SwipeCard.tsx            # Swipe animasyonlu kart (Reanimated)
    │   ├── MediaView.tsx            # Fotoğraf / video gösterimi
    │   ├── ProgressHeader.tsx       # "120 / 2450" sayacı + istatistikler
    │   ├── UndoToast.tsx            # Geri al bildirimi + süre çubuğu
    │   └── ActionButtons.tsx        # Alt sil/koru butonları
    └── screens/
        ├── PermissionScreen.tsx     # Galeri izin ekranı
        ├── SwipeScreen.tsx          # Ana swipe ekranı
        └── ResultScreen.tsx         # Oturum sonucu ekranı
```

---

## Bağımlılıklar

| Paket | Amaç |
|---|---|
| `expo-media-library` | Galeri okuma (sayfalama) + native iOS silme API |
| `expo-video` | Video oynatma |
| `react-native-gesture-handler` | Pan gesture (swipe) |
| `react-native-reanimated` | Akıcı kart animasyonları (Worklet tabanlı) |
| `react-native-safe-area-context` | iPhone notch / Dynamic Island uyumu |

---

## Kişisel Sideload Notu

Ücretsiz Apple geliştirici hesabıyla imzalanan uygulamalar **7 günde bir yeniden imzalanmalıdır**. Ücretli Apple Developer hesabıyla yıllık imzalama yapılabilir. Uygulama App Store'a çıkmayacağından bu durum tamamen normaldir.
