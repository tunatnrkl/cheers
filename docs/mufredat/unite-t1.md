# Ünite t1 · Turnuva nedir: öz denetim

Kaynak: `scripts/mufredat/icerik/t1.json` → `python3 scripts/mufredat/iskelet.py` → `src/data/mufredat.json`.
7 ders (5 normal + kontrol + tekrar), 75 alıştırma; hepsi `dogrulamaGerekli: false`. Spot tipi kullanılmadı (sitedeki turnuva spotları push/fold, ICM ve bubble kararları; t1'in konularına uymuyor).

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | dogrulamaGerekli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `t1-d1` Turnuva ile cash farkı | ders | 4 | 11 | dogruYanlis 4, eslestirme 1, sayi 2, secmeli 4 | 1–5 | 2 | 0 | Cash game, Turnuva, Stack, Blind |
| `t1-d2` Formatlar | ders | 4 | 11 | dogruYanlis 4, eslestirme 1, sayi 1, secmeli 5 | 1–5 | 1 | 0 | Freezeout, Rebuy / re-entry, Geç kayıt, Sit & go, MTT (çok masalı turnuva), Final masası |
| `t1-d3` Blind seviyeleri | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 5, secmeli 3 | 1–5 | 9 | 0 | Blind seviyesi, Stack, BB (Big Blind), Blind |
| `t1-d4` Ante ve BB ante | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 5, secmeli 2 | 1–5 | 7 | 0 | Ante, BB ante, Pot, BB (Big Blind) |
| `t1-d5` Ödül yapısı | ders | 4 | 11 | dogruYanlis 3, sayi 4, secmeli 4 | 1–5 | 7 | 0 | Ödül yapısı, ITM (in the money), Bubble, Ödül sıçraması, Final masası |
| `t1-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 3, sayi 6, secmeli 3 | 1–5 | 8 | 0 | — |
| `t1-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 3, sayi 3, secmeli 2 | 2–5 | 5 | 0 | — |

**Toplam tip dağılımı:** sayı 26, seçmeli 23, doğru/yanlış 22, eşleştirme 4.

**Betik sonucu:** 75 alıştırmanın 39'u `denetle.mts` ile denetlendi, hata 0. Türler: antePot 8, toplam 8, odul 7, carpim 6, bbErime 5, bolum 4, bolumEsleme 1.

## Betik neyi doğruluyor

- **Ante'li pot (`antePot`, 8):** pot = küçük blind + büyük blind + toplam ante (+ sonradan konanlar). Betik ante kuralını kendisi uygular: BB ante tek ante, klasik ante oyuncu × ante (oyuncu sayısı yoksa hata). Blind'ler, ante ve sonradan konan miktarlar senaryodan elle girilir; betik işlemi doğrular, senaryonun sayılara çevrilmesi elle kontrol edildi.
- **Blind artışı (`bbErime`, 5):** aynı stack için yeni BB sayısı ya da kaybedilen BB. Stack ve iki büyük blind elle girilir.
- **Ödül payları (`odul`, 7):** betik önce tablonun toplamının %100 olduğunu ve sıra büyüdükçe payın artmadığını denetler, sonra fark / ödül alan sayısı / ödül alan oranını hesaplar. Ödül tabloları örnektir (gerçek bir turnuvanın tablosu değil).
- **Toplam, çarpım, bölüm (18):** sıra hesabı (ör. 9 − 4 + 1), seviye başlama dakikası, BB'ye çevirme, ödül alan sayısı (180 × 0,15). Terimler elle girilir; betik yalnızca işlemi doğrular.
- Bir seçmeli soruda (`t1-d5/a8`) diğer seçeneklerin değerleri (`degerler`) elle girilmiştir; betik yalnızca doğru seçeneğin değerini hesaplar.

## Betikle denetlenmeyenler

36 alıştırma kavram ve kural sorusudur (format tanımları, ante'nin bahse sayılmaması, bubble, ITM, sıralamanın elenme sırasına göre belirlenmesi). `03-kaynak-guven-raporu.md`'deki listeyle elle karşılaştırıldı.

## Tasarım

- **Pist sırası.** Turnuva pistinde t1, o3'ten önce gelir (o1, o2, t1, o3 …). Bu yüzden t1 koltuk adlarını (UTG, HJ, CO) kullanmaz; "stack"i t1-d1'de, BB'ye çevirmeyi t1-d3'te kendisi tanımlar (o2-d1 BB'yi ölçü birimi olarak zaten öğretmişti). "Cash game" de burada tanımlanır.
- Varsayım: aksi yazılmadıkça BB ante 1 BB (t1-d4'te açıkça yazılır). Klasik ante de anlatılır ve hesaplatılır.
- Ödül yalnızca yüzde ve "puan" farkıyla anlatılır; para birimi, tutar ve giriş bedeli yoktur. "Katılımcıların yaklaşık %10–20'si" ifadesi "genellikle" ve "turnuvaya göre değişir" ile yazıldı; aksini soran seçenek ("her turnuvada tam %15") yanlış seçenektir.
- Sayı sorularında cevap 1.000'in altında tutuldu; binlik chip cevapları seçmeli yazıldı (bkz. 02, Öğren ekranı notu).
- Tipik yanılgılar çeldirici olarak: BB ante'yi oyuncu sayısıyla çarpmak, ante'yi call hesabında düşmek, fold eden blind'in chip'ini pottan çıkarmak, rebuy ile re-entry'yi karıştırmak, seviye başlangıcını n × süre sanmak, bubble'da ödülün garantilendiğini sanmak.
