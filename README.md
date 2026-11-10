# Poker Defteri

Türkçe bir Texas Hold'em alıştırma masası: 591 spot, masanın yanında kısa cevap veren yapay zeka koçu, range matrisi, hesap makineleri, sözlük ve blog. Site bir strateji çalışma aracıdır; gerçek parayla oyun oynatmaz, bahis önermez. 18 yaş ve üzeri içindir.

- **Ön yüz:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Arka yüz:** Node.js — Next.js route handler'ları ile REST API
- **Veritabanı:** PostgreSQL (`pg`, düz SQL)
- **Yapay zeka:** Claude API (`@anthropic-ai/sdk`), akışlı yanıt, önbellek, kullanım sınırı

## Çalıştırma

```bash
npm install
cp .env.example .env.local      # değerleri doldur
npm run db:migrate              # db/schema.sql'i uygular (DATABASE_URL gerekir)
npm run dev                     # http://localhost:3000
```

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yayında evet | Sitemap, kanonik adres, OAuth yönlendirmesi |
| `DATABASE_URL` | hesap için | Yoksa site çalışır; ilerleme yalnızca tarayıcıda tutulur |
| `ANTHROPIC_API_KEY` | asistan için | Yalnızca sunucuda okunur. Yoksa asistan "etkin değil" der |
| `AI_MODEL` | hayır | Varsayılan `claude-opus-5-5` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | hayır | Tanımlıysa "Google ile devam et" görünür. Yönlendirme adresi: `<site>/api/auth/google/callback` |

Diğer komutlar: `npm test` (poker matematiği testleri), `npm run typecheck`, `npm run build`, `npm run ranges` (range verisini yeniden üretir).

## 1. Klasör yapısı

```
db/schema.sql                 PostgreSQL şeması
scripts/
  migrate.mjs                 Şemayı uygular
  generate-ranges.mts         Range verisini Monte Carlo ile üretir
src/
  app/                        Sayfalar ve API (Next.js App Router)
    page.tsx                  Ana sayfa
    alistirma/                Alıştırma masası (Trainer.tsx)
    ogren/                    Rehber, araç ve okuma merkezi
    yapay-zeka/               Kendi elini sor (form ve serbest soru)
    profil/                   Giriş, ilerleme, kayıtlı eller, dışa aktarma
    range/                    13x13 range matrisi
    araclar/                  Hesap makineleri
    cash/  turnuva/           Modül sayfaları
    sozluk/  blog/            İçerik
    gizlilik/  sorumlu-oyun/  KVKK ve sorumlu oyun
    sitemap.ts  robots.ts     SEO
    api/
      ai/chat/                POST  — asistan (akışlı düz metin)
      auth/{register,login,logout,me}/   e-posta ile hesap
      auth/google/ (+callback)           Google ile giriş
      attempts/               GET/POST — alıştırma cevapları
      saved/                  GET/PUT/DELETE — kayıtlı eller ve notlar
      hands/ (+[id])          GET — el kütüphanesi
  components/                 PokerTable, ActionStrip, CoachChat, AiPanel, Cards, Nav, ...
  data/                       hands.ts (elle yazılan spotlar), drills.json (üretilen spotlar),
                              ranges.json, glossary.ts, blog.ts
  lib/
    poker/                    evaluator.ts, replay.ts (aksiyon motoru), math.ts, cards.ts
                              hands.test.ts: tüm spotların doğrulaması
    server/                   db.ts, auth.ts, http.ts, ai.ts  (yalnızca sunucu)
    client/store.ts           İlerleme deposu (API ya da localStorage)
    glossaryLinker.ts         Metindeki terimleri sözlüğe bağlar
```

İçerik (eller, sözlük, blog) depoda sürümlenen dosyalardadır: sayfalar statik üretilir, hızlı yüklenir ve arama motorlarına tam metin gider. Veritabanı yalnızca kullanıcıya ait veriyi ve yapay zeka önbelleğini tutar.

### Veritabanı şeması

Tam hali: [`db/schema.sql`](db/schema.sql)

| Tablo | İçerik |
|---|---|
| `users` | `email`, `password_hash` (scrypt), `google_sub`, `display_name`, `consent_at` |
| `sessions` | `token_hash` (çerezdeki token'ın SHA-256'sı), `user_id`, `expires_at` |
| `attempts` | `user_id`, `hand_id`, `chosen`, `correct`, `topic`, `created_at` |
| `saved_hands` | `user_id`, `hand_id`, `note`, `updated_at` |
| `ai_cache` | `key` (soru özeti), `answer`, `hits`, `created_at` |

Kullanıcıya bağlı tüm tablolar `ON DELETE CASCADE` ile bağlıdır; hesap silme tek sorguyla tüm veriyi temizler.

## 2. Sayfalar

| Adres | Ne yapar |
|---|---|
| `/` | Tanıtım, gerçek masa bileşeniyle önizleme, spot türlerine kısayollar |
| `/alistirma` | Alıştırma masası: üstte aksiyon geçmişi, ortada 6 kişilik masa, altta renkli hamle butonları, yanda koç sohbeti. Soru sayısı yok; eller arka arkaya gelir, yanlışlar ara ara geri döner. Oyun tipi ve spot filtresi, oturum özeti, el kaydetme, klavye kısayolları (1–3, Enter). `?el=`, `?oyun=`, `?konu=` ile doğrudan açılır |
| `/yapay-zeka` | Serbest soru, el formu ya da geçmiş alıştırma sonuçlarının analizi |
| `/profil` | E-posta / Google ile giriş; çözülen soru, doğruluk, spot bazında oran, kayıtlı eller (masada yeniden açılır); CSV/JSON indirme; hesap silme |
| `/ogren` | Cash ve turnuva rehberleri, araçlar, sözlük ve blog için tek giriş |
| `/range` | Pozisyona göre açılış (cash) ve push/fold (turnuva) aralıkları; kendi range'ini işaretle, karşılaştır, asistana değerlendir |
| `/araclar` | Pot odds ve gerekli equity, outs'tan yüzde, efektif stack ve SPR, ICM; her birinde "Ne anlama geliyor?" notu |
| `/cash`, `/turnuva` | Konu anlatımı (stack derinliği, rake, blind yapısı, push/fold, ICM, bubble, final masası) ve ilgili el/araç bağlantıları |
| `/sozluk` | 138 terim, kategorili ve aranabilir; sitedeki terimler buraya bağlanır |
| `/blog`, `/blog/[slug]` | 6 özgün yazı |
| `/gizlilik`, `/sorumlu-oyun` | KVKK aydınlatma metni şablonu; sorumlu oyun ilkeleri ve destek hattı |

## 3. Yapay zeka entegrasyonu

Tüm mantık [`src/lib/server/ai.ts`](src/lib/server/ai.ts) içindedir; uç nokta [`src/app/api/ai/chat/route.ts`](src/app/api/ai/chat/route.ts).

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // ANTHROPIC_API_KEY sunucu ortamından okunur

const stream = client.beta.messages.stream({
  model: "claude-opus-5-5",
  max_tokens: detailed ? 4000 : 1500,              // token sınırı
  output_config: { effort: detailed ? "medium" : "low" },
  betas: ["server-side-fallback-2026-07-01"],      // model reddederse yedek modele geçer
  fallbacks: "default",
  system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
  messages: [...history, { role: "user", content: userMessage }],
});

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    send(event.delta.text); // tarayıcıya parça parça
  }
}
const final = await stream.finalMessage(); // stop_reason: end_turn | max_tokens | refusal
```

İstemciden çağrı:

```bash
curl -N -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"question":"Bu eli neden call etmeliyim?","detailed":false,"context":{"type":"hand","handId":"c17"}}'
```

- **Bağlam sunucuda kurulur.** İstemci yalnızca `handId` gönderir; el bilgisi, alıştırma dökümü ve range farkı sunucuda hesaplanıp `<baglam>` bloğu olarak eklenir.
- **Kısa / detaylı.** Varsayılan yanıt 3–5 cümledir; "Detaylı anlat" aynı sohbeti `detailed: true` ile sürdürür.
- **Önbellek.** Bir ele ya da genel bir kavrama dair ilk soru, normalleştirilmiş metnin özetiyle `ai_cache` tablosunda 30 gün tutulur (veritabanı yoksa bellekte). Sistem talimatı ayrıca prompt cache ile işaretlidir.
- **Sınırlar.** Soru 1500 karakter, geçmiş 8 mesaj; misafir için 10 dakikada 12, üye için 30 istek.
- **Alıştırma koçu:** Masadaki sohbet `drill` bağlamıyla gider: yanıt en fazla 2-3 kısa cümle (700 token sınırı), konu o el ve poker ile sınırlı. Kullanıcı henüz cevap vermediyse bağlamdan doğru cevap çıkarılır ve koç yalnızca ipucu verir.
- **Sistem talimatı** şartnamedeki maddeleri içerir: önce kısa cevap, kesinlik iddia etmeme, eksik bilgide en fazla iki soru, yargılamayan dil, alıştırma analizi biçimi, kumar teşviki ve kazanç vaadi yasağı, bağımlılık belirtisinde destek kaynağına yönlendirme (YEDAM 115), 18+ hatırlatması. Sözlük terimleri talimata eklidir; böylece yanıttaki terimler sitedeki sözlükle aynı yazılır ve otomatik bağlanır.

## 4. Spotlar ve doğruluk

Her spot aksiyonlarıyla birlikte yapılandırılmış olarak tutulur. `src/lib/poker/replay.ts` diziyi oynatır; masa, aksiyon şeridi ve yapay zeka bağlamı buradan çizilir.

```json
{
  "id": "c17",
  "title": "Nut floş çekişi ve pot odds",
  "game": "cash", "street": "flop", "heroPos": "BB", "stackBB": 100,
  "hero": "Ah5h", "board": "Kh9h3c", "potBB": 9.2,
  "seq": ["BTN r2.5", "SB f", "BB c", "F Kh9h3c", "BB x", "BTN b3.7"],
  "options": ["Fold", "Call (3.7 BB)", "All-in"],
  "correct": 1,
  "topic": "odds",
  "reasoning": "9.2 BB'lik pota 3.7 BB ödüyorsun: gereken equity yaklaşık %29. ..."
}
```

Dizi biçimi: `f` fold, `x` check, `c` call, `l` limp, `r2.5` raise (toplam), `b3.7` bet, `a` all-in; `F`/`T`/`R` flop/turn/river kartları. Preflop'ta sırası geçen ve dizide olmayan oyuncu fold etmiş sayılır. İsteğe bağlı alanlar: `note` (rakip tipi, turnuva durumu), `stacks`, `ante`, `players`, `villain` (kartları açık rakip).

**591 spot:**

| Tür | Sayı | Doğru cevap nasıl belirlenir |
|---|---|---|
| Elle yazılmış spotlar (preflop + postflop, cash + turnuva, ICM) | 69 | Elle yazıldı. Sınırda kalan, tartışmalı bir el çıkarıldı |
| Cash açılış (herkes fold etti) | 115 | Referans açılış aralığı. Aralık sınırına yakın eller ve pozisyona göre sık açılan suited eller dışarıda |
| Turnuva push/fold (6, 10, 15 BB) | 211 | Temkinli push aralıkları. Fold cevabı yalnızca açıkça zayıf ellerde |
| All-in'e karşı call (BB) | 126 | Monte Carlo ile elin, rakibin belirtilen aralığına karşı equity'si. Gerekli equity'ye 3,5 puandan yakın olanlar dışarıda |
| Turn all-in, rakip kartları açık | 70 | Kalan 44 river kartı tek tek sayılır; tahmin yok |

`npm test` her spotu doğrular: aksiyon sırası kurallara uygun, sıra kahramanda, pot verisi hesaplananla aynı, kartlar geçerli ve tekrarsız. Ayrıca pot odds spotlarının cevabı kart sayımıyla, açılış/push spotlarının cevabı referans aralıkla yeniden kontrol edilir.

Üretilen spotlar `npm run ranges` ile yeniden oluşturulur (sabit tohum, tekrarlanabilir).

## 5. Güvenlik ve KVKK

- Şifreler `scrypt` ile tuzlanarak özetlenir; oturum token'ının veritabanında yalnızca SHA-256 özeti durur.
- Oturum çerezi `HttpOnly`, `SameSite=Lax`, yayında `Secure`. Durum değiştiren tüm isteklerde `Origin` kontrolü yapılır.
- Tüm API girdileri `zod` ile doğrulanır; SQL sorguları parametrelidir.
- API anahtarları yalnızca sunucu kodunda (`server-only`) okunur.
- Giriş, kayıt ve asistan uç noktalarında istek sınırı vardır (tek süreçlik; çok sunuculu kurulumda Redis'e taşınmalı).
- Kayıtta 18+ beyanı ve aydınlatma metni onayı zorunludur. Kullanıcı verisini CSV/JSON indirebilir ve hesabını kalıcı olarak silebilir.
- `/gizlilik` metni bir **şablondur**: yayından önce veri sorumlusu bilgisi eklenmeli ve bir hukukçuya gözden geçirtilmelidir.

## 6. İçerik ve telif

- Eller, gerekçeler, sözlük tanımları ve blog yazıları bu proje için özgün yazılmıştır.
- Range verisi `scripts/generate-ranges.mts` ile üretilir: 169 başlangıç elinin rastgele ele karşı equity'si kendi el değerlendiricimizle Monte Carlo (60.000 deneme) hesaplanır, oynanabilirlik düzeltmesi eklenir ve pozisyon başına hedef yüzdeye kadar el alınır. Bunlar **yaklaşık çalışma aralıklarıdır, solver çıktısı değildir**; sitede de böyle belirtilir.
- Hesap makineleri `src/lib/poker/math.ts` içindeki kendi formüllerimizi kullanır (ICM: Malmuth-Harville).

## 7. Geliştirme aşamaları

### Aşama 1 (MVP) — adım adım plan ve durum

| # | Adım | Durum |
|---|---|---|
| 1 | Proje iskeleti: Next.js, Tailwind, tema değişkenleri, karanlık/aydınlık | ✅ |
| 2 | Navigasyon: mobilde alt menü, masaüstünde üst menü; ana sayfa | ✅ |
| 3 | Veri modeli ve 50+ el (575 spot, hepsi testli) | ✅ |
| 4 | Alıştırma masası (kütüphanenin yerini aldı) | ✅ |
| 5 | Sözlük: 100+ terim (138), arama, terim bağlayıcı | ✅ |
| 6 | Poker matematiği ve testleri; pot odds, outs, SPR hesap makineleri | ✅ |
| 7 | Yapay zeka: sistem talimatı, `/api/ai/chat`, akış, önbellek, sınırlar, sohbet paneli | ✅ |
| 8 | SEO: meta etiketler, sitemap, robots, yapılandırılmış veri | ✅ |
| 9 | Erişilebilirlik ve mobil kontrolü (44px hedefler, kontrast, klavye) | ✅ |
| 10 | Yayın: barındırma, alan adı, gerçek API anahtarıyla asistan testi | ⬜ |

### Aşama 2 — yapıldı

Alıştırma modu, yapay zeka ile alıştırma analizi, kullanıcı hesabı (e-posta + Google) ve ilerleme paneli, range matrisi, blog.

### Aşama 3

| Özellik | Durum |
|---|---|
| Turnuva modülü ve ICM hesabı | ✅ temel hali |
| Hand history içe aktarma | ⬜ |
| Gelişmiş istatistikler (zaman içinde eğilim, pozisyon bazında döküm) | ⬜ |

### Bilinen sınırlar

- Asistan gerçek Claude API'ye karşı denenmedi (geliştirme ortamında anahtar yoktu); akış, önbellek ve hata yolları API'nin akış biçimini taklit eden yerel bir sunucuyla test edildi. Yanıt kalitesi ve sistem talimatı gerçek anahtarla gözden geçirilmeli.
- Google ile giriş kodu yazıldı ancak gerçek Google kimlik bilgileriyle denenmedi.
- Sayfa yükleme süresi gerçek mobil ağda ölçülmedi. İçerik sayfaları statik üretilir, harici font ya da görsel yoktur.
- Range matrisinin hücreleri telefonda 44px'in altındadır (13 sütun ekrana sığmalı); sürükleyerek işaretleme bunu telafi eder.
- Poker içeriği bir uzman tarafından gözden geçirilmemiştir; gerekçeler bilinçli olarak "bu varsayımlarla" diliyle yazılmıştır.
