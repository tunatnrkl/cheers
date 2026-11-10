# Poker Defteri

Türkçe, sade bir Texas Hold'em çalışma sitesi: örnek eller, alıştırma modu, range matrisi, hesap makineleri, sözlük, blog ve Claude tabanlı yapay zeka asistanı. Site bir strateji çalışma aracıdır; gerçek parayla oyun oynatmaz, bahis önermez. 18 yaş ve üzeri içindir.

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
    kutuphane/                El kütüphanesi (liste + [id] detay)
    alistirma/                Alıştırma modu
    yapay-zeka/               Asistan (serbest soru, el formu, sonuç analizi)
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
  components/                 Nav, AiPanel, HandView, Cards, RichText, ...
  data/                       İçerik: hands.ts, glossary.ts, blog.ts, ranges.json
  lib/
    poker/                    evaluator.ts, math.ts (+test), cards.ts
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
| `/` | "Bugün ne çalışmak istersin?" → El incele / Alıştırma yap / Yapay zekaya sor; günün eli; araçlara kısayollar |
| `/kutuphane` | 64 el; oyun tipi sekmeleri ve sokak, pozisyon, stack derinliği, konu filtreleri (adres çubuğunda tutulur) |
| `/kutuphane/[id]` | Kartlar, pozisyon, stack, aksiyon sırası, önerilen hamle ve gerekçe; yanında asistan; eli kaydet ve not al |
| `/alistirma` | Senaryo → seçenekler → doğru cevap ve gerekçe; sonuç ekranında konu dökümü, zayıf konu, çalışma önerisi, yapay zeka analizi |
| `/yapay-zeka` | Serbest soru, el formu ya da geçmiş alıştırma sonuçlarının analizi |
| `/profil` | E-posta / Google ile giriş; çözülen soru, doğruluk, konu bazında oran, kayıtlı eller; CSV/JSON indirme; hesap silme |
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
- **Sistem talimatı** şartnamedeki maddeleri içerir: önce kısa cevap, kesinlik iddia etmeme, eksik bilgide en fazla iki soru, yargılamayan dil, alıştırma analizi biçimi, kumar teşviki ve kazanç vaadi yasağı, bağımlılık belirtisinde destek kaynağına yönlendirme (YEDAM 115), 18+ hatırlatması. Sözlük terimleri talimata eklidir; böylece yanıttaki terimler sitedeki sözlükle aynı yazılır ve otomatik bağlanır.

## 4. Örnek el kaydı (JSON)

`GET /api/hands/c17`

```json
{
  "id": "c17",
  "title": "Nut floş çekişi ve pot odds",
  "game": "cash",
  "street": "flop",
  "heroPos": "BB",
  "stackBB": 100,
  "hero": "Ah5h",
  "board": "Kh9h3c",
  "potBB": 9.2,
  "actions": [
    "BTN 2.5 BB açtı, sen BB'den call ettin (pot 5.5 BB)",
    "Flop: K♥ 9♥ 3♣",
    "Sen check, BTN 3.7 BB bahis yaptı"
  ],
  "options": ["Fold", "Call (3.7 BB)", "All-in"],
  "correct": 1,
  "reasoning": "9.2 BB'lik pota 3.7 BB ödüyorsun: gereken equity yaklaşık %29. ...",
  "topic": "odds",
  "level": 1
}
```

Aynı kayıt hem kütüphanede (önerilen hamle + gerekçe) hem alıştırmada (seçenekler + doğru cevap) kullanılır. Yeni el eklemek için `src/data/hands.ts` dosyasına bir nesne eklemek yeterlidir.

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
| 3 | Veri modeli: `Hand` tipi ve 50+ el (64 yazıldı) | ✅ |
| 4 | Kütüphane listesi, filtreler ve el detay sayfası | ✅ |
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
