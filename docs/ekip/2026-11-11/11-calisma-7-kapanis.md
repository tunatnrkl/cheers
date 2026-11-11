# 7. çalışma: Türkçe ek denetiminin tamamlanması ve gelişim istatistikleri

**Tarih:** 2026-11-11 · **Dal:** `claude/wizardly-meitner-p01f35` (6. çalışmanın dalı `9evl2r` üzerine ileri sarıldı)

## Başlangıç durumu

- Varsayılan dal (`claude/charming-davinci-emhvz1`) hâlâ `2b7d6b5`'te; 1–6. çalışmaların hiçbiri alınmamış (P-1).
- Ayrıca iki yan dal var: `05x26x` ve `ch8abk`. İkisi de 1. çalışmanın ayrı kopyaları; işleri `9evl2r` zincirinde zaten var ya da yerini almış. Birleştirilmemeli (bkz. P-2).
- Sağlık: `npm test` 617/617.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Y-1 devamı | Elle yazılmış spotlarda ve blogda yüzde eklerini denetlemek | Bütün metinler taranmış; ek testi üretilenlerle sınırlı değil; hata varsa düzeltilmiş | Poker Uzmanı (metin), QA |
| 2 | Gelişmiş istatistikler (Aşama 3) | Zaman içindeki eğilim ve pozisyon dökümü, ödül döngüsü olmadan | Spesifikasyon (`10-…spec.md`) + çalışan kart + birim testleri + iki boyutta tarayıcı kontrolü; yeni veri toplanmıyor | Davranış Bilimleri, UI/UX, Frontend, Backend, QA |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok; Playwright'taki 120 cevap test için üretilmiş örnek, analiz edilmedi), **Poker Eğitim** ve **Content** (yeni içerik gerekmedi; B-1 kararı gelmeden c39 eklenemiyor).

## 1. Y-1: yüzde ekleri

- Elle yazılmış 59 spotta ve 8 blog yazısında 18 farklı `%n'ek` kullanımı bulundu (`%19'a`, `%19'dur`, `%27,3'lük`, `%43'ü`, `%90'ından`…). **Hepsi doğru**; düzeltme gerekmedi.
- `src/lib/trSuffix.ts`'e `pctSuffixProblem` eklendi: ilk ünlü uyumu, kaynaştırma harfi (s/y/n), d/t benzeşmesi; ondalıkta ek virgülden sonraki sayıya uyar.
- `text.test.ts`: yeni test bütün spotları ve blogu tarar (400'den fazla eşleşme kontrol ediliyor) + 22 örnek vaka (13 doğru, 9 yanlış).

## 2. Gelişim istatistikleri

Ayrıntılar: [`10-gelisim-istatistikleri-spec.md`](10-gelisim-istatistikleri-spec.md).

- `src/lib/client/stats.ts` + 8 birim testi; `src/app/profil/Growth.tsx`.
- Yeni uç nokta, kolon ya da veri yok. Pozisyon `HAND_BY_ID`'den türetiliyor.
- Playwright: 390 px ve 1366 px, 120 örnek cevap; yatay kaydırma yok, konsol hatası yok, ekran görüntüsü incelendi.

## CEO kalite kontrolü

| Çıktı | Kriter | Sonuç |
|---|---|---|
| Y-1 | Tümü taranmış, testli | ✅ Tamamlandı |
| Gelişim kartı | 5 kriter | ✅ Tamamlandı. Giriş yapmış kullanıcı (PostgreSQL) yolu **denenmedi** |
| Poker iddiaları | "10 cevapta ±25 puan" | Kontrol edildi: Wilson %95 aralığı 5/10'da 0,24–0,76, 7/10'da 0,40–0,89. "Kabaca" ifadesiyle doğru |
| Davranış kanıtları | Kanıt düzeyi yazılı | ✅ Ancak Dunlosky 2013 ve Kluger–DeNisi 1996 atıfları hafızadan; bu çalışmada kaynak açılıp doğrulanmadı |

## Yeni bulgular

- **G-1 (düşük):** `GET /api/attempts` 5000 kayıtla sınırlı. Çok aktif üyede "ilk görüş" oranı, 5000'den eski kayıtları göremediği için bazı tekrarları ilk görüş sayabilir. Haftalık eğilim (8 hafta) etkilenmez, 8 haftada 5000'i aşmadıkça.
- **P-2 (bilgi):** `05x26x` ve `ch8abk` yan dalları birleştirilirse `9evl2r` zinciriyle çakışır (`ch8abk` 1628 satırlık ters fark). Yalnızca en güncel zincir dalı birleştirilmeli.
