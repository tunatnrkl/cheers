# Blind savunması rehberi (blog taslağı)

**Tarih:** 2026-11-11 (2. çalışma) · **Rol:** Content (Poker Uzmanı kontrolüyle) · **Hedef:** `src/data/blog.ts` içine 7. yazı olarak eklenmek üzere (devredildi)
**Önerilen slug:** `blind-savunmasi-fiyat-aralik-pozisyon` · **Okuma süresi:** yaklaşık 6 dakika

> Sayılar projenin kendi değerlendiricisiyle ve `ranges.json` içindeki yaklaşık açılış aralıklarıyla hesaplandı (UTG %15, CO %27, BTN %43). Bunlar solver aralıkları değildir. Değerler 2026-11-11'de iki ayrı Monte Carlo çalışmasıyla (40.000 deneme) kontrol edildi ve 0,5 puandan fazla fark çıkmadı.

---

## BB'de ne zaman savunmalısın? Fiyat, aralık ve pozisyon

Big blind (BB), masada en çok chip kaybedilen pozisyondur. Bu kaçınılmazdır: her elde zorunlu bahsi sen koyarsın ve flop sonrasında çoğu zaman ilk konuşan sen olursun. Amaç BB'de kâr etmek değil, **kaybı en aza indirmektir**. Bunun için üç soruya cevap vermen yeterli.

### 1. Fiyat: ne kadar equity gerekiyor?

**Equity**, elin, rakibin olası ellerine karşı potu kazanma payıdır. Call için gereken equity şu formülle bulunur:

> **gereken equity = ödeyeceğin miktar / (pot + ödeyeceğin miktar)**

Buton 2,5 BB açtı, SB fold etti. Ortada 2,5 + 0,5 + 1 = 4 BB var. Call için 1,5 BB daha ödersin ve pot 5,5 BB olur:

> 1,5 / 5,5 = **%27,3**

Açılış küçüldükçe fiyat iyileşir:

| Durum | Ödeyeceğin | Son pot | Gereken equity |
|---|---|---|---|
| Buton 2,5 BB açtı | 1,5 BB | 5,5 BB | %27,3 |
| Buton 2 BB açtı (min-raise) | 1 BB | 4,5 BB | %22,2 |
| CO 2,5 BB açtı, buton call etti | 1,5 BB | 8 BB | %18,8 |
| Turnuva, BB ante 1, buton 2,2 BB açtı | 1,2 BB | 5,9 BB | %20,3 |

Son satıra dikkat et: turnuvalarda **ante** (her elde ortaya konan ek zorunlu bahis) BB'nin fiyatını belirgin biçimde iyileştirir. Bu yüzden turnuvada BB, cash'e göre daha geniş savunur.

### 2. Aralık: rakip hangi ellerle açıyor?

Fiyat aynı olsa bile karar değişebilir, çünkü elinin equity'si rakibin **aralığına** (bu durumda açabileceği bütün ellere) bağlıdır.

| Elin | Butonun aralığına karşı (%43) | UTG'nin aralığına karşı (%15) |
|---|---|---|
| J4 offsuit | yaklaşık %35 | yaklaşık %29 |

Aynı el, aynı fiyat (%27,3), ama UTG'ye karşı eşiğin hemen üstünde kalıyor. Daha da önemlisi, UTG'nin aralığı A-J, K-J, Q-J gibi ellerle dolu. J'li per yaptığında bile çoğu zaman **domine** durumdasın: rakipte aynı kart ve daha iyi bir kicker (yan kart) var.

**Kural:** Açan oyuncu ne kadar erken pozisyondaysa, savunma aralığın o kadar daralır.

### 3. Pozisyon: equity'nin ne kadarını kullanabileceksin?

Buradaki tuzak şu: tablodaki equity, iki elin de beş kartı sonuna kadar gördüğü varsayımıyla hesaplanır. Gerçekte flop'tan sonra bahisler olur ve pozisyon dışında oynayan taraf, elinin ham equity'sinin bir kısmını kullanamadan fold etmek zorunda kalır. Buna **equity realization** (equity'yi gerçekleştirme) denir.

Butonun 2,5 BB açılışına karşı iki eli karşılaştır:

| El | Ham equity | Gereken | Ham equity'nin ne kadarını kullanman gerekir |
|---|---|---|---|
| 7-2 offsuit | yaklaşık %30 | %27,3 | %90'ın üzerinde |
| T-8 suited | yaklaşık %41 | %27,3 | yaklaşık %66 |

72o kâğıt üstünde eşiği geçiyor, ama equity'sinin neredeyse tamamını kullanması gerekiyor. Pozisyon dışında, bağlantısız ve offsuit bir el çoğu flop'u ıskalar ve ilk bahiste bırakır. Bu gerçekçi değil, bu yüzden çoğu çalışma kaynağı burada fold önerir. T8s ise kent ve floş yapabildiği için equity'sinin üçte ikisini kullanmakta çok daha az zorlanır.

Hangi elin equity'sinin ne kadarını gerçekleştirdiğine dair kesin oranlar kaynaktan kaynağa değişir. Genel eğilim şudur: **suited ve bağlantılı eller daha çok, offsuit ve kopuk eller daha az gerçekleştirir.**

### Üç soruyu birlikte kullanmak

1. **Fiyatı hesapla.** Kaç BB ödüyorsun, pot kaç olacak?
2. **Açanın pozisyonuna bak.** Buton ve SB geniş, UTG dar açar.
3. **Elinin oynanabilirliğine bak.** Suited mı, bağlantılı mı, yoksa domine olmaya yatkın mı?

Üçü de lehine ise call. Biri bile açıkça aleyhine ise (çok güçlü bir aralık ya da hiç oynanamayan bir el) fold düşün.

### Sık yapılan üç hata

- **"Zaten 1 BB koydum, call edeyim."** Koyduğun 1 BB artık potun bir parçası, senin değil. Karar yalnızca ödeyeceğin ek miktara göre verilir.
- **Her açılışa aynı aralıkla savunmak.** UTG'ye karşı butona karşı savunduğun gibi savunursan, domine olduğun potlarda büyük chip kaybedersin.
- **Ante'yi unutmak.** Turnuvada ante'li potlarda K4o gibi eller, cash'te bırakacağın fiyatlarda rahatça savunulur.

### Alıştırma masasında dene

Alıştırma masasında "Blind savunması" filtresini seç. Her spotta önce fiyatı kendin hesapla, sonra cevaba bak.

---

*Bu yazı bir strateji çalışmasıdır. Sayılar belirtilen varsayımlarla hesaplanmıştır; gerçek oyunda rakipler farklı aralıklarla oynar. Poker Defteri gerçek parayla oyun oynatmaz. Oyun alışkanlıkların seni rahatsız ediyorsa [sorumlu oyun](/sorumlu-oyun) sayfasına göz at.*
