# Ünite t3 · Derin stack oyunu: öz denetim

Kaynak: `scripts/mufredat/icerik/t3.json`. 8 ders (6 normal + kontrol + tekrar), 86 alıştırma; hepsi `dogrulamaGerekli: false`. Varsayımlar: 6 kişilik masa, BB ante 1 BB, açılış 2,2 BB.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | dogrulamaGerekli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `t3-d1` Erken aşama planı | ders | 4 | 11 | dogruYanlis 4, eslestirme 1, sayi 2, secmeli 4 | 1–5 | 3 | 0 | Derin stack, Set, Implied odds, Cep çifti, Pozisyon |
| `t3-d2` Turnuvada açılış aralıkları | ders | 4 | 11 | dogruYanlis 3, range 2, sayi 1, secmeli 5 | 1–5 | 7 | 0 | Range (aralık), Range matrisi, Solver, Erken pozisyon, Geç pozisyon, Ante |
| `t3-d3` Turnuvada açılış boyutu | ders | 4 | 11 | dogruYanlis 3, sayi 5, secmeli 3 | 1–5 | 5 | 0 | Min-raise, Open (açılış), Ante, Stack |
| `t3-d4` Ante'li potta çalma | ders | 4 | 11 | dogruYanlis 2, sayi 6, secmeli 2, spot 1 | 1–5 | 7 | 0 | Steal (blind çalma), Başabaş noktası, Ante, Geç pozisyon |
| `t3-d5` Ante ile BB savunması | ders | 4 | 11 | dogruYanlis 3, sayi 4, secmeli 3, spot 1 | 1–5 | 7 | 0 | Equity, Pot odds, Blind savunması, OOP (pozisyon dışı), Monte Carlo |
| `t3-d6` 3-bet'e kısa giriş | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 2, secmeli 4, spot 1 | 1–5 | 3 | 0 | 3-bet, 4-bet, Blöf |
| `t3-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 3, sayi 4, secmeli 3, spot 2 | 1–5 | 8 | 0 | — |
| `t3-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 3, sayi 3, secmeli 2 | 2–5 | 4 | 0 | — |

**Toplam tip dağılımı:** sayı 27, seçmeli 26, doğru/yanlış 24, spot 5, eşleştirme 2, range 2.

**Betik sonucu:** 86 alıştırmanın 44'ü `denetle.mts` ile denetlendi, hata 0. Türler: antePot 6, basabasFold 6, acilis 5, equityAraliga 5, flopTutma 4, gerekenEquity 4, toplam 4, kosulluSec 3, oranYuzde 3, acilisAraligi 2, aralikYuzde 1, efektif 1.

## Betik neyi doğruluyor

- **Açılış soruları (acilis 5, acilisAraligi 2, kosulluSec 3, aralikYuzde 1):** `src/data/ranges.json`'daki 6-max cash çalışma aralıklarına göre okunur. Turnuvaya özgü açılış aralığı yok; anlatım bunu açıkça söyler ("cash için hazırlandı, derin stack'te kabaca benzer kullanılabilir; ante ile geç pozisyonda biraz genişletmek yaygın; 8–9 kişilik masada erken koltuklar daha sıkı"). Yalnızca betiğin "ac" ya da "fold" dediği, kenar payının dışındaki eller soruldu; UTG'de A9o ve 22 gibi turnuvada tartışmalı olabilecek eller bilerek kullanılmadı.
- **Başabaş fold oranı (`basabasFold`, 6):** risk / (risk + mevcut pot). Call edildiğinde hiç kazanmama varsayımı anlatımda ve sorularda yazılı. Risk ve pot elle girilir; betik işlemi doğrular.
- **Gereken equity (4) ve ante'li pot (6):** c6 ve t1'deki türler; girdiler elle, işlem betikte.
- **Aralığa karşı equity (`equityAraliga`, 5):** sabit tohumlu Monte Carlo (40.000 deneme), ±1,5 puan. K4o BTN'ye karşı 41,0, UTG'ye karşı 32,0; 96s CO'ya karşı 36,2. Rakip aralığı ranges.json'daki cash açılış aralığıdır (t25 spotunun notundaki "%43" ile aynı).
- **Flop'ta set (`flopTutma`, 4):** betik kalan 50 karttan 19.600 flop'u tek tek sayar: 2.304 tutan (%11,8; 7,5'e 1).
- **Spotlar (5):** t24 (çalma), t25 (savunma), t20 (3-bet tanımından sonra), t12 ve t14 (kontrolde). Seçenekler ve cevap spotla birebir (test). Rakip eli hiçbir yerde yok.

## Betikle denetlenmeyenler

42 alıştırma ilke ve tanım sorusudur: erken aşamada pozisyon ve el seçimi, spekülatif ellerin derin stack'te değer kazanması, küçük açılışın bedeli, value ve blöf 3-bet'in ayrımı, OOP 3-bet'in genellikle daha büyük tutulması. Hepsi "genellikle / çoğunlukla" diliyle yazıldı; hangi ellerle 3-bet yapılacağına dair aralık verilmedi (yalnızca "AA, KK, QQ, AK en açık value örnekleri" ve "blöf için çoğu oyuncu oynanabilir elleri, ör. suited bir as, seçer").

## Tasarım

- Turnuva pistinde c5/c6 yok; bu yüzden equity, pot odds, blind savunması, solver ve Monte Carlo t3'te yeniden tanımlandı (t3-d2, t3-d5). 3-bet t3-d6'da tanımlanır; seçeneklerinde "3-bet" geçen t20, t12 ve t14 spotları yalnızca t3-d6'da ve sonrasında kullanıldı.
- t12 (25 BB), t24 (35 BB) ve t25 (30 BB) orta stack derinliğindedir; derin stack ünitesinde açılış boyutu, çalma ve savunma ilkelerini göstermek için kullanıldı; sorularda stack yazılıdır.
- Tipik yanılgılar çeldirici olarak: ante'yi call bedeline katmak, ante'yi pottan unutmak, başabaş paydasına yalnızca potu koymak, BB'nin blind'ini 3-bet toplamına ayrıca eklemek, value ile blöfü karıştırmak, kendi açılışını kazanç saymak.
