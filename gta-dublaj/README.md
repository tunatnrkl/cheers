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

## Nasıl çalışır?

Ayar ya da kablo gerekmez. Program **varsayılan mikrofondan ortamı sürekli dinler**. Konsol veya TV hoparlöründen gelen oyun sesini duyar.

- Duyduğu her cümlenin dilini tespit eder. **Sadece İngilizce cümleleri** Türkçe'ye çevirip seslendirir.
- Arkadaşınızla Türkçe konuşmalarınız **atlanır** (Türkçe olma ihtimali %15'i geçen her şey).
- Programın kendi Türkçe dublajı mikrofona geri gelse de Türkçe olduğu için atlanır.
- Hep açık kalır. Mikrofon koparsa ya da ses kesilirse dinlemeyi kendisi yeniden başlatır.

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

## İsteğe bağlı: mikrofon yerine bilgisayar sesini dinlemek

Oyun PC'deyse ve mikrofon yerine doğrudan bilgisayarın sesini dinlemek isterseniz `config.toml` içinde `mod = "loopback"` yapın.

## Çalıştırma

`baslat.bat` dosyasına çift tıklayın. O kadar.

Gelişmiş kullanım:
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
