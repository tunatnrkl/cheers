# Ünite o4 · Başlangıç elleri: öz denetim

Kaynak: `scripts/mufredat/icerik/o4.json`. 8 ders (5 normal + kontrol + tekrar + `o4-t` Temel testi, kapsam: ortak üniteler o1–o4), 95 alıştırma; hepsi `dogrulamaGerekli: false`. Spot tipi kullanılmadı.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|
| `o4-d1` El kategorileri | ders | 4 | 11 | dogruYanlis 1, eslestirme 1, sayi 7, secmeli 2 | 1–5 | 9 | Cep çifti, Suited, Offsuit, Connector, Broadway, Kombinasyon (combo) |
| `o4-d2` Range matrisini okumak | ders | 4 | 11 | dogruYanlis 1, range 3, sayi 4, secmeli 3 | 1–5 | 9 | Range (aralık), Kombinasyon (combo), Suited, Offsuit, Cep çifti |
| `o4-d3` Domine edilme ve kicker sorunu | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, secmeli 8 | 1–5 | 6 | Dominasyon, Kicker, Board |
| `o4-d4` Sıkı ve agresif oyunun mantığı | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, secmeli 7 | 1–5 | 1 | Tight, Loose, TAG, LAG, Open (açılış) |
| `o4-d5` Limp neden çoğunlukla zayıf | ders | 3 | 11 | dogruYanlis 3, sayi 4, secmeli 4 | 1–5 | 5 | Limp, Open (açılış), Multiway |
| `o4-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, range 1, sayi 3, secmeli 6 | 1–5 | 8 | — |
| `o4-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 2, secmeli 4 | 2–5 | 3 | — |
| `o4-t` Temel testi: pozisyon ve başlangıç elleri | test | 1 | 20 | dogruYanlis 3, range 1, sayi 6, secmeli 9, siralama 1 | 1–5 | 18 | — |

**Toplam tip dağılımı:** seçmeli 43, sayı 26, doğru/yanlış 17, range 5, eşleştirme 3, sıralama 1.

**Betik sonucu:** 95 alıştırmanın 59'u denetlendi, hata 0.
- Kombinasyon ve yüzde (16 soru, ayrıca 1326 ve 169 sayım soruları): betik destenin bütün iki kartlık ellerini tek tek sayar (1326 el, 169 el adı) ve el adı başına kombinasyonu bu sayımdan alır; sözlükteki ya da `cards.ts`'teki 6/4/12 formülüne dayanmaz. Yüzde soruları ±0,05 içinde olmalı.
- El yazımı (4): iki karttan el adı (AKs/AKo/77) betikte yeniden kurulur.
- Matris (3): satır/sütundan hücre adı hem betiğin kendi kuralıyla hem sitenin matris bileşeninin kullandığı `matrixLabel` ile karşılaştırılır; ikisi ayrışırsa hata verir.
- Range (5): sorudaki tarif ("bütün suited aslar", "suited broadway") denetimde bir kurala çevrilir (`{tip: "suited", yuksek: "A"}`); betik işaretlenmesi gereken elleri 169 el adından üretip veriyle karşılaştırır. Tarifin kurala doğru çevrildiği elle kontrol edildi.
- Kazanan / yenen (11), pot toplamı (7), konuşma sırası ve koltuk (5), efektif stack ve BB (3), el sıralaması ve nuts (2), en çok kombinasyon (1).
- Denetimsiz 36 soru kavram sorusudur (domine ilişkisinin yönü, tight/loose, limp'in sakıncaları); elle karşılaştırıldı.

## Tasarım

- **Aralık iddiası yok.** o4 hiçbir pozisyon için "şu eller açılır" demez; yalnızca matrisi okumayı, kombinasyon ve yüzde hesaplamayı öğretir. Range soruları tanım sorularıdır (bütün çiftler, suited aslar, suited papazlar, suited connector'lar, suited broadway'ler).
- **Equity sayısı yok.** Domine edilme için "çoğu zaman geride" denir; AK–AJ gibi karşılaşmalar için yüzde verilmez (equity c6-d1'de tanımlanır).
- Terimler ilk geçtikleri derste tanımlanır: cep çifti, suited, offsuit, connector, broadway, kombinasyon d1; matris ve range d2; domine etmek d3; tight, loose, agresif, pasif, TAG, LAG, açılış, inisiyatif d4; limp d5. "Açılış" o4-d4'ten sonra kullanılır.
- Belirsizlik: "connector" tanımında as-ikili (A2) tartışmalıdır; ilgili soruda "as yalnızca yüksek kart sayılır" diye açıkça yazıldı.
- Kesinlik dili: strateji ilkeleri "çoğunlukla", "genellikle", "başlangıç ilkesi" ile yumuşatıldı; "her zaman yanlış" ve "her masada aynen" ifadeleri yanlış seçenek olarak kullanıldı.
- `o4-t` 20 soru: o1 (el sıralaması, en iyi beşli, nuts, kazanan) 6, o2 (pot, call miktarı) 2, o3 (konuşma sırası, koltuk, stack) 7, o4 (yazım, kombinasyon, yüzde, aralık, domine) 5.
