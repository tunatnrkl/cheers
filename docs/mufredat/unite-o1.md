# Ünite o1 · Kartlar ve eller: öz denetim

Kaynak: `scripts/mufredat/icerik/o1.json` → `python3 scripts/mufredat/iskelet.py` → `src/data/mufredat.json`.
Hedef kitle: hiç poker bilmeyen. 7 ders (5 normal + kontrol + tekrar), 74 alıştırma; hepsi `dogrulamaGerekli: false`.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Betikle denetlenen | Sözlük terimleri |
|---|---|---|---|---|---|---|---|
| `o1-d1` Deste ve kartlar | ders | 4 | 11 | dogruYanlis 2, eslestirme 2, sayi 3, secmeli 3, siralama 1 | 1–5 | 4 | — |
| `o1-d2` El sıralaması: yüksek karttan üçlüye | ders | 4 | 10 | dogruYanlis 1, eslestirme 1, secmeli 6, siralama 2 | 1–5 | 10 | İki per |
| `o1-d3` El sıralaması: kentten royal floşa | ders | 4 | 12 | dogruYanlis 2, eslestirme 1, sayi 1, secmeli 6, siralama 2 | 1–5 | 12 | — |
| `o1-d4` Beş kart kuralı ve kicker | ders | 4 | 11 | dogruYanlis 2, sayi 3, secmeli 6 | 1–5 | 9 | Kapalı kartlar, Board, Kicker |
| `o1-d5` Board'u okumak | ders | 4 | 10 | dogruYanlis 2, eslestirme 1, secmeli 7 | 1–5 | 8 | Board, Nuts |
| `o1-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, sayi 1, secmeli 8, siralama 1 | 1–5 | 12 | — |
| `o1-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 1, secmeli 5 | 2–5 | 7 | — |

**Toplam tip dağılımı:** seçmeli 41, doğru/yanlış 13, sayı 9, sıralama 6, eşleştirme 5.

**Betik sonucu:** 74 alıştırmanın 62'si `denetle.mts` ile yeniden hesaplandı, hata 0. Türler: kazanan 23, el çeşidi 11, sıralama 4, nuts çeşidi 3, kapalı kart sayısı 3, aritmetik 7, nuts eli 2, eşleştirme 2, diğer 7. Denetimsiz 12 soru terim ve kural sorusudur (renk adları, harf yazımı, "kicker'ı kim bozar" gibi).

## Kurallar ve tasarım

- Her normal derste tek fikir, 4 paragraf, 10–12 alıştırma, en az 3 tip, zorluk 1'den 5'e azalmadan artar.
- Çeldiriciler gerçek yanılgılara dayanır: renkler arası üstünlük, A-2-3-4-5'i en güçlü kent sanmak, kentin astan dönmesi, altıncı kartın eşitliği bozması, iki çiftin "toplamı", board'u oynamayı görmemek, dört aynı renkli kartı floş saymak.
- Tekrar dersi bu yanılgıların her birine bir soru ayırır.
- Kartlar "A♠ K♦" biçiminde; oyuncular "Ali", "Berk", "Can". Spot tipi kullanılmadı; rakip eli sorunu doğmaz (bütün eller showdown/kural sorusu olarak açıkça verilir).
- Sözlükte olmayan el adları (per, kent, floş…) `02-bosluk-raporu.md` listesinde.
