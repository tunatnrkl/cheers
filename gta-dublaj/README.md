# GTA Dublaj: Canlı İngilizce → Türkçe Dublaj

Oyundaki İngilizce konuşmaları dinler, Türkçe'ye çevirir ve **her karaktere ayrı bir Türkçe ses** vererek seslendirir. Arkadaşınızla aranızdaki Türkçe konuşmalara **dokunmaz**.

```
Oyun sesi ──► Konuşma algılama ──► Whisper (dil tespiti + yazıya dökme)
                (Silero VAD)            │
                                        ├─ Türkçe / emin değil ─► ATLA
                                        ▼
                                 İngilizce metin
                                        │
              Konuşmacı ses izi (ECAPA) ─► "Karakter 3, erkek" ─► ona ayrılmış ses
                                        │
                           Çeviri (opus-mt en→tr, çevrimdışı)
                                        │
                            Edge TTS (Türkçe ses) ─► kulaklığınız
```

## Türkçe sohbetiniz neden dublajlanmaz? (iki katmanlı koruma)

1. **Sadece oyun sesi dinlenir.** Mikrofonunuz hiç dinlenmez. Oyun sesi ile Discord/sohbet sesi farklı cihazlara yönlendirilir (aşağıdaki kurulum). Böylece arkadaşınızın sesi programa hiç ulaşmaz.
2. **Dil filtresi.** Sohbet sesi bir şekilde karışsa bile her cümlenin dili Whisper ile tespit edilir. Sadece İngilizce olduğundan emin olunan cümleler çevrilir. Türkçe olasılığı %15'i geçen her şey atlanır. Programın kendi Türkçe dublajı tekrar duyulursa o da aynı filtreyle atlanır.

## Farklı karakterler nasıl farklı seslendirilir?

- Her cümleden 192 boyutlu bir **ses izi** çıkarılır (SpeechBrain ECAPA-TDNN). Benzer ses izleri aynı karaktere gruplanır.
- Sesin perdesine bakılarak **erkek veya kadın** sesi seçilir.
- Her yeni karaktere havuzdan **sabit bir ses** atanır. Örneğin Karakter 1 hep Ahmet'in sesiyle, Karakter 2 hep perdesi düşürülmüş Ahmet'in sesiyle konuşur.
- Microsoft'un yalnızca 2 Türkçe sesi var (Ahmet, Emel). Çeşitliliği artırmak için perde ve hız varyasyonlarıyla Türkçe okuyabilen "Multilingual" sesler de havuza eklendi. Havuz `config.toml` dosyasından düzenlenebilir.

---

## Kurulum (Windows)

1. **Python 3.11 veya üstünü** kurun: https://www.python.org/downloads/. Kurulumda "Add Python to PATH" kutusunu işaretleyin.
2. Bu klasörde **`kurulum.bat`** dosyasına çift tıklayın. Gerekli paketleri bir sanal ortama kurar.
   - NVIDIA ekran kartınız varsa, kurulumdan sonra çok daha hızlı çalışması için şu komutu çalıştırın:
     `.venv\Scripts\pip install torch --index-url https://download.pytorch.org/whl/cu124 --force-reinstall`
     Ardından `config.toml` içinde `model = "large-v3-turbo"` yapın.
3. İlk çalıştırmada modeller indirilir (yaklaşık 1-3 GB). Bu yüzden internet gerekir. Dublaj sesleri (Edge TTS) de internet ister.

## Ses yönlendirme

Hedef: **oyun sesi** program tarafından dinlenen bir cihaza gitsin, **Discord ve dublaj** ise kulaklığınıza gitsin.

### A) Oyunu PC'de oynuyorsanız

1. **VB-Audio Virtual Cable** kurun (ücretsiz): https://vb-audio.com/Cable/
2. Windows → *Ayarlar → Sistem → Ses → Uygulama ses düzeyi ve cihaz tercihleri*
   - Oyunun **Çıkış** cihazı: `CABLE Input`
   - Discord: kulaklığınız (Discord'un kendi ayarlarında da kulaklığı seçin)
3. Orijinal oyun sesini de duymak isterseniz: *Ses denetim masası → Kayıt → CABLE Output → Özellikler → Dinle → "Bu cihazı dinle"* seçeneğini işaretleyin, çalma cihazı olarak kulaklığınızı seçin. Orijinal İngilizce sesi kısık duymak için CABLE Output'un seviyesini düşürün.
4. `config.toml` dosyasında:
   ```toml
   [ses_girisi]
   mod = "loopback"
   cihaz = "CABLE Input"
   [ses_cikisi]
   cihaz = "Kulaklığınızın adı"   # python -m dublaj --cihazlar ile görün
   ```

### B) Oyunu PS5 veya Xbox'ta oynuyorsanız

Oyun sesini bilgisayara almanız gerekir:

- **Capture card** (Elgato, AVerMedia vb.) veya **HDMI ses ayırıcı + PC Line-In** kullanabilirsiniz.
- `config.toml` dosyasında:
  ```toml
  [ses_girisi]
  mod = "giris"
  cihaz = "Elgato"     # capture card'ın ses girişinin adından bir parça
  ```
- Konsol parti sohbeti HDMI sesine karışıyorsa sorun olmaz: Türkçe konuşmalar dil filtresine takılır. En temiz yöntem sohbet için PC'de Discord kullanmaktır. O zaman sohbet sesi capture card'dan hiç geçmez.

## Çalıştırma

```
baslat.bat
```
veya
```
.venv\Scripts\python -m dublaj              # canlı dublaj
.venv\Scripts\python -m dublaj --cihazlar   # ses cihazlarını listele
.venv\Scripts\python -m dublaj --dosya kayit.mp3 --kaydet dublaj.wav   # bir kayıtla dene
```

Konsolda şöyle bir çıktı görürsünüz:
```
[Karakter 1 ♂] Get in the car, we gotta go!
   → Arabaya bin, gitmemiz lazım!  (tr-TR-AhmetNeural +0Hz, 1.4s)
  (2.1s) Türkçe konuşma (tr=0.94) - atlandı
[Karakter 2 ♀] You're late again.
   → Yine geç kaldın.  (tr-TR-EmelNeural +0Hz, 1.2s)
```

## İnce ayar (`config.toml`)

| Sorun | Ayar |
|---|---|
| Aynı karakter farklı seslerle konuşuyor | `benzerlik_esigi` değerini düşürün (örn. 0.35) |
| Farklı karakterler aynı sesle konuşuyor | `benzerlik_esigi` değerini yükseltin (örn. 0.55) |
| Kadın karakter erkek sesi alıyor (ya da tersi) | `erkek_perde_siniri` değerini değiştirin |
| Bazı İngilizce cümleler atlanıyor | `min_ingilizce_olasiligi` değerini düşürün (örn. 0.5) |
| Türkçe konuşmalar arada çevriliyor | `max_turkce_olasiligi` değerini düşürün (örn. 0.08) |
| Çok gecikmeli | Daha küçük model (`base`) kullanın; GPU varsa `large-v3-turbo` |
| Cümleler ortadan bölünüyor | `min_sessizlik_ms` değerini artırın (örn. 650) |

## Bilinen sınırlar

- **Gecikme:** Cümle bittikten sonra dublaj başlar. GPU ile yaklaşık 1-2 saniye, sadece işlemciyle 2-5 saniye sürer. Ara sahnelerde dublaj konuşmanın biraz arkasından gelir.
- **Üst üste konuşma:** Aynı anda iki karakter ya da müzik ile konuşma üst üste gelirse tanıma zayıflar.
- **Çeviri kalitesi:** Çevrimdışı model argo ve küfürde zorlanabilir. `ceviri` bölümünden başka bir HuggingFace en→tr modeli seçilebilir.
- **Konuşmacı takibi** oturum boyunca hafızada tutulur. Program kapanınca sıfırlanır.

## Testler

```
pip install pytest
python -m pytest tests
```
