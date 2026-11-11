# 5. çalışma: bekleyen içeriğin siteye alınması

**Tarih:** 2026-11-11 · **Dal:** `claude/wizardly-meitner-vrsaxz` (4. çalışmanın dalı `wcrqqc` üzerine hızlı ileri alındı)

## Başlangıç durumu

- Varsayılan dal (`claude/charming-davinci-emhvz1`) hâlâ `2b7d6b5`'te. 1–4. çalışmaların hiçbiri ana dala alınmamış.
- Hafızadaki 1. öncelik gereği yeni içerik üretilmedi; bu çalışma `wcrqqc` dalından devam etti ve önceki çalışmaların bekleyen taslaklarını siteye aldı.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Bekleyen spot taslaklarını eklemek | `savunma` 2 → 6, `spr` 4 → 6 spot | Her spotun pot, fiyat ve equity iddiası `replay` + değerlendirici ile yeniden ölçülmüş ve kalıcı testle korunuyor | Poker Uzmanı, Poker Eğitim, QA |
| 2 | Blind savunması yazısını yayına almak | `blog.ts`'e 8. yazı | Sayılar test edilen değerlerle aynı, terimler ilk geçtiği yerde açıklanmış, build temiz | Content, Poker Uzmanı, QA |
| 3 | Bağlantılar | Cash rehberinden spotlara ve yazıya geçiş | `/cash` sayfasında "Blind savunması" bölümü | Frontend |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok), **Davranış Bilimleri** (yeni mekanik yok), **UI/UX ve Backend** (yeni sayfa ya da sunucu değişikliği yok).

## Poker Uzmanı: yeniden ölçüm

Varsayımlar: 6 kişilik masa, rake yok. Rakip aralıkları `ranges.json`'daki yaklaşık açılış aralıkları (UTG 37, CO 58, BTN 89 el etiketi); **solver çıktısı değil**. Monte Carlo 100.000 deneme, t26 tam sayım.

| Spot | Gereken (replay) | Ölçülen equity | Fark | Karar |
|---|---|---|---|---|
| c34 (revize: BTN 3 BB) | 2 / 6.5 = %30.8 | 72o vs BTN **%29.7** | −1.1 | Fold. Ham equity bile fiyatın altında; realization yalnızca aynı yöne iter |
| c35 | 1.5 / 5.5 = %27.3 | J4o vs UTG **%29.2** (vs BTN %34.8) | +1.9 | Fold. **Sınırda**: kararın dayanağı realization (%93 gerekiyor). Gerekçede açıkça yazıldı |
| c36 | 1.5 / 8 = %18.75 | 65s, CO + buton call aralığına karşı üç yollu **≈%28** | +9.5 | Call |
| t25 | 1.2 / 5.9 = %20.3 | K4o vs BTN **%41.0** | +20.7 | Call |
| c38 | — | Flop'ta set %11.76 → başabaş 7.5:1; en iyi durumda kazanç 21.5 / 3 = 7.17 | — | Fold (bu varsayımlarla) |
| t26 | 10 / 25.5 = %39.2 | KJ vs nottaki aralık **%63.3**; yalnızca güçlü ellere **%34.4** (tam sayım) | +24.1 / −4.8 | Call |

- c36 için butonun call aralığı varsayımı: CO aralığından AA, KK, QQ, JJ, AK, AQs çıkarılmış hali (**varsayım**, doğrulanamadı).
- c34 2.5 BB'den 3 BB'ye çevrildi (02'deki uzman önerisi). 2.5 BB'de karar solver'a göre değişebilir (**doğrulanamadı**), 3 BB'de ham equity eşiğin altında.
- 2. çalışmanın sayıları (t26 %63.3 / %34.4, J4o %29 / %35, 72o %30, T8s %41) bu ölçümle örtüşüyor. Q-1 tipi hata bulunmadı.
- **c39 eklenmedi:** call da kârlı bir seçenek; `acceptable` alanı (B-1) gelmeden tek doğru cevaplı spot olarak riskli.

## Poker Eğitim: eklenen spotlar

c34, c35, c36, c38 (cash) ve t25, t26 (turnuva). Rakip aralığına bağlı her spotta aralık `note`'ta yazılı. Seviye: c35 taslakta 1'di, realization kavramına dayandığı için 2'ye çekildi.

Konu dağılımı (elle yazılmış): `savunma` 2 → **6**, `spr` 4 → **6**. `value` hâlâ 3 (c39 beklemede).

## Content: yazı

`/blog/blind-savunmasi-fiyat-aralik-pozisyon`. Taslaktaki tablolar `RichText`'in desteklediği madde listelerine çevrildi; 3 BB satırı eklendi; "çoğu çalışma kaynağı fold önerir" gibi doğrulanamayan genelleme çıkarıldı. Yazının sonunda sorumlu oyun hatırlatması var.

## QA

| Kontrol | Sonuç |
|---|---|
| `npm test` | **614/614** (601 + 6 spot verisi + 7 yeni iddia testi) |
| `npm run typecheck` | Temiz |
| `npm run build` | Temiz; yazı statik üretildi, 8 madde listesi doğru render edildi |
| Yeni testler | c34 (ham equity < gereken), c35 (fark < 3.5 puan ve gereken/equity > 0.85; BTN'ye karşı daha iyi), c36 (üç yollu MC, fark > 5 puan), t25, c38 (set oranı), t26 (tam sayım, iki yön), blog T8s %39–44 |

Bulgular (önem sırasıyla):

1. **Orta — süreç:** Dallar hâlâ ana dala alınmadı. Bu dal da alınmazsa 6. çalışma yeniden eski koddan başlar.
2. **Düşük — CS-5:** Yeni spot metinleri mevcut biçime uymak için ondalıkta nokta kullanıyor; yazı virgül kullanıyor. Toplu dönüşüm hâlâ açık.
3. **Bilgi:** Alıştırma masasında "Blind savunması" filtresinin 6 eli gösterdiği tarayıcıda elle denenmedi (veri ve filtre kodu değişmedi, yalnızca veri eklendi).

## CEO kalite kontrolü

| Çıktı | Kriter | Durum |
|---|---|---|
| 6 spot | Yeniden ölçüldü, testli | ✅ |
| c39 | — | ⏸ B-1 kararı bekliyor |
| Blog yazısı | Sayılar testle aynı, build temiz | ✅ |
| Cash rehberi bağlantısı | Bölüm eklendi | ✅ |
