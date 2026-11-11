# 9. çalışma: G-2 (tam dışa aktarma, konu tablosu), birleştirme sonrası QA, ICM stack 0

**Tarih:** 2026-11-11 · **Dal:** `claude/wizardly-meitner-g2abma` (varsayılan dalla aynı yerden, `8ffc135`)

## Başlangıç durumu

- **P-1 kapandı:** kullanıcı PR #1 (`obr3cs`, 8. çalışma) ve PR #2'yi (`ch8abk`, "Cheers" markası) varsayılan dal `claude/charming-davinci-emhvz1`'e birleştirmiş. Bu çalışma ilk kez doğrudan varsayılan daldan başladı; dal taşıma gerekmedi.
- **P-3 kapandı:** "Cheers" markası kullanıcı kararıyla ana zincirde.
- Sağlık: `npm test` 631/631, `npm run typecheck` temiz.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | **G-2** | Üyenin konu tablosu, çalışma önerisi ve CSV/JSON dökümü bütün cevaplardan gelsin | 12.345 kayıtlı test kullanıcısında konu tablosu SQL ile birebir; CSV ve JSON 12.345 satır, tekrarsız; başka kullanıcının verisi gelmiyor; giriş yoksa 401; geçersiz imleç 400; ağ hatasında yarım dosya inmiyor, hata mesajı görünüyor | Backend, Frontend, QA |
| 2 | **Birleştirme sonrası QA** | Çakışmalı birleştirmeden (PR #2) sonra site sağlam ve marka tutarlı mı | 13 sayfa 200, eski marka adı görünmüyor, 390 px'te yatay taşma yok, konsol hatası yok | QA |
| 3 | **Açık iş 6 ve 8** | "Blind savunması" filtresi ve ICM'de stack 0 | Filtre 6 spot gösteriyor; stack 0 girişi kullanıcıya söyleniyor | QA, Frontend |

**Çalışmayan roller:** Poker Uzmanı, Poker Eğitim, Content (B-1 ürün kararı gelmeden yeni spot/yazı eklenmez; açık poker içerik işi yok), Data Analyst (kullanıcı verisi yok), Davranış Bilimleri ve UI/UX (yeni mekanik ya da ekran yok; dışa aktarma düğmesine yalnızca yükleniyor/hata durumu eklendi).

## 1. G-2

### Backend

- `GET /api/attempts` artık `topics` da döndürüyor: `SELECT topic, count(*), count(*) FILTER (WHERE correct) … GROUP BY topic`. Yeni veri toplanmıyor; yalnızca mevcut kayıtların toplamı.
- Yeni `GET /api/attempts/export?before=<imleç>`: yalnızca okuma, `user_id` oturumdan gelir (istekten kullanıcı kimliği alınmaz). Sayfa 5000 kayıt, sıra `id` azalan, `next` null ise son sayfa. İmleç `^[1-9]\d{0,17}$` ile doğrulanır (bigint taşmasında 500 yerine 400). `Cache-Control: no-store`. Yanıtta iç `id` yok, yalnızca imleç.
- `db/schema.sql`: `attempts_user_id_idx ON attempts(user_id, id DESC)` (tekrar çalıştırmak güvenli, `IF NOT EXISTS`).
- Statik (GitHub Pages) sürümde `src/app/api` silindiği için uç nokta orada yok; misafir dökümü zaten tarayıcıdaki listeden.

### Frontend

- `src/lib/client/progressData.ts` (saf): `rankTopics`, `topicTotals`, `collectPages` (imleç ilerlemezse ya da 200 sayfa aşılırsa hata; yarım dosya "tam" diye inmez), `buildExport` (CSV/JSON, yeniden eskiye sıralı, girdiyi değiştirmez).
- `store.ts`: `topics` durumu; yeni cevapta yerel olarak artırılıyor. `allAttempts()` üyede sayfaları okur, misafirde yerel listeyi döner.
- `Profile.tsx`: konu tablosu ve "Çalışma önerisi" üyede sunucu toplamından. İndirme düğmeleri: "Hazırlanıyor…", `aria-busy`, iki düğme birlikte kilitli, hata `role="alert"`. Bilinmeyen konu kimliği olduğu gibi gösterilir.
- Dosya adı `poker-defteri-<tarih>` → `cheers-<tarih>` (birleştirmeden kalan eski marka).
- **Bilinçli olarak dokunulmadı:** `localStorage` anahtarları (`pd-cevaplar`, `pd-kayitli`, `pd:rhythm`). Değiştirmek misafirlerin ilerlemesini siler.

### QA

Gerçek PostgreSQL ile (yerel `initdb`), A kullanıcısına 12.345, B'ye 7 cevap yüklendi.

| Vaka | Beklenen | Sonuç |
|---|---|---|
| `GET /api/attempts` (A) | liste 5000, toplam 12.345/5806, konu toplamları SQL ile aynı | ✅ acilis 2760/1024, callshove 2911/1480, odds 1610/782, pushfold 5064/2520 |
| Döküm sayfaları (A) | 5000 + 5000 + 2345, `next` 7346 → 2346 → null, 12.345 benzersiz | ✅ (ilk denemede ❌, aşağıda) |
| Döküm (B) | 7 kayıt, `next: null`, `id` alanı yok | ✅ |
| Girişsiz | 401 | ✅ |
| `before=abc`, `0`, `-1`, `1 OR 1=1`, 19-20 hane | 400 | ✅ (18 hane 200) |
| Profil 390 ve 1366 px | konu satırlarındaki (ok/toplam) SQL ile aynı; konsol hatası yok | ✅ |
| CSV ve JSON indirme (üye, iki genişlik) | `cheers-2026-11-11.*`, 12.345 satır | ✅ |
| Döküm isteği düşürülünce | "Dosya hazırlanamadı…" görünür, düğme yeniden etkin, dosya inmez | ✅ |
| Misafir CSV | yerel 1 kayıt → 1 satır | ✅ |
| Birim testleri | `progressData.test.ts` 9 test | ✅ toplam 640/640 |

**Bulunan ve düzeltilen hata (E-1, Orta):** ilk sürümde sorgu `SELECT id::text AS id … ORDER BY id DESC` idi. Postgres `ORDER BY`'da çıktı takma adını önceler, yani **metin** sıralıyordu ("9999" > "12345"). Sonuç: döküm 12.345 yerine 11.446 kayıt döndü, 899 kayıt sessizce atlandı. `ORDER BY attempts.id` ile düzeltildi, yeniden ölçüldü. Birim testi bu hatayı yakalayamaz (sahte sunucu doğru sıralıyor). Bu yüzden uç nokta değişikliklerinde gerçek PostgreSQL denemesi zorunlu tutulmalı.

## 2. Birleştirme sonrası QA

- 13 sayfa (`/`, `/ogren`, `/cash`, `/turnuva`, `/range`, `/araclar`, `/sozluk`, `/blog`, `/alistirma`, `/sorumlu-oyun`, `/gizlilik`, `/yapay-zeka`, `/profil`) 200 döndü; başlıklar "· Cheers"; gövdede "Poker Defteri" yok; 390 px'te `scrollWidth` 390 (taşma yok); konsol hatası yok.
- Kodda kalan eski marka: indirme dosya adı (düzeltildi), `db/schema.sql` yorumu (düzeltildi), `HAFIZA.md` başlığı (düzeltildi). `localStorage` anahtarları bilerek bırakıldı.
- Not: depoda başka bir rutinin (`admiring-babbage-*`, 35 dal) açtığı el ekleme dalları var ve hiçbiri ana dalda değil. Bu ekip onlara dokunmadı. Commit mesajlarına göre birçoğu ana daldaki kimlik aralıklarını (`c34–c40`, `t25–t27`) yeniden kullanıyor; içerikler karşılaştırılmadı, ama birleştirilirse kimlik çakışması olası (P-4).

## 3. Açık iş 6 ve 8

- **Blind savunması filtresi (6):** `/alistirma?konu=savunma` → seçim kutusunda "Blind savunması (6)" seçili, "Tüm spotlar (577)". ✅ Kapandı.
- **ICM stack 0 (8):** `parse` sıfırı ve sayı olmayanları sessizce atıyordu; "5000, 0, 1500, 500" girilince 3. giriş "2. oyuncu" olarak görünüyordu. Hesap doğru (kalan oyuncular arasında ICM; 43,93 + 31,95 + 24,12 = 100), ama kullanıcı numaraların kaydığını bilmiyordu. Tabloya not eklendi: "1 giriş hesaba katılmadı (0 ya da sayı değil); oyuncular kalan stack'lerin sırasıyla numaralandı. Elenen oyuncu ICM'ye girmez: onun aldığı ödülü listeden çıkarıp yalnızca kalan ödülleri yaz." Normal girişte not görünmüyor. ✅ (Tarayıcıda 390 px'te doğrulandı; birim testi yok, mantık bileşen içinde.)

## CEO kalite kontrolü

| İş | Kriter | Durum |
|---|---|---|
| G-2 | Hepsi karşılandı; E-1 bulunup düzeltildi | ✅ |
| Birleştirme QA | Karşılandı | ✅ |
| Açık iş 6, 8 | Karşılandı | ✅ |

Poker iddiası: yalnızca ICM notu ("elenen oyuncu ICM'ye girmez, kalan ödüller girilir"). Bu standart Malmuth–Harville modelinin tanımı; hesap makinesinin kendisi değişmedi.

**Eksik kalan:** Gelişim kartı (ilk görüş/tekrar, haftalık eğilim, pozisyon) hâlâ son 5000 cevapla hesaplanıyor ve bunu söylüyor (G-1 kararı). 5000'i aşan kullanıcı sayısı bilinmiyor; gerçek veri gelmeden sunucu özetine geçilmedi.
