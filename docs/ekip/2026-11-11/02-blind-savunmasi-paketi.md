# Blind savunması: quiz ve yeni spot taslakları

**Tarih:** 2026-11-11 · **Roller:** Poker Eğitim (Poker Uzmanı kontrolüyle) · **Seviye:** başlangıç–orta

## Eksik konu tespiti

Elle yazılmış spotların konu dağılımı: pushfold 11, acilis 7, icm 6, 3bet 5, cbet 5, odds 5, blof 5, spr 4, value 3, **savunma 2**. Üretilen 522 spotun hiçbiri `savunma` konusunda değil. Sonuç olarak alıştırma masasında "Blind savunması" filtresi yalnızca **2 el** gösteriyor (c05, t20). Bu, oyuncuların en sık karşılaştığı kararlardan biri için ciddi bir boşluk.

Diğer zayıf konular: `value` (3), `spr` (4). Bunlar bir sonraki tura bırakıldı.

## Varsayımlar

- Cash: 6 kişilik masa, 100 BB, rake yok. Turnuva: BB ante = 1 BB.
- "Ham equity" değerleri projenin değerlendiricisiyle Monte Carlo (40.000 deneme) ile hesaplandı. Rakip aralığı `ranges.json` içindeki **yaklaşık** açılış aralıkları: UTG %15, CO %27, BTN %43. Bunlar solver aralığı değil.
- Equity realization (bir elin ham equity'sinin ne kadarını gerçekten kullanabildiği) için **kesin sayı verilmedi**. Pozisyon dışında, offsuit ve bağlantısız ellerin daha az realize ettiği genel kabul görür, ama oranlar kaynağa göre değişir (**doğrulanamadı**).

## Quiz (8 soru)

**1.** Cash, 100 BB. Buton 2.5 BB açtı, SB fold etti. BB'desin. Call için en az ne kadar equity gerekir?
A) %20 · B) %27 · C) %38 · D) %50
**Cevap: B.** Pot 4 BB (2.5 + 0.5 + 1). 1.5 BB ödeyip 5.5 BB'lik pot için oynuyorsun: 1.5 / 5.5 = %27.3.

**2.** Aynı durum, ama buton 2 BB'ye açtı (min-raise). Gereken equity nedir?
A) %18 · B) %22 · C) %27 · D) %33
**Cevap: B.** Pot 3.5 BB, 1 BB ödüyorsun: 1 / 4.5 = %22.2. Açılış küçüldükçe BB daha geniş savunabilir.

**3.** CO 2.5 BB açtı, buton call etti, SB fold etti. BB'desin. Gereken equity nedir?
A) %19 · B) %27 · C) %33 · D) %40
**Cevap: A.** Pot 6.5 BB, 1.5 BB ödüyorsun: 1.5 / 8 = %18.75. Fiyat çok iyi ama iki rakibe karşı oynayacaksın. En çok suited ve bağlantılı eller kazanır, çünkü güçlü el yaptıklarında büyük pot alırlar.

**4.** Turnuva, 30 BB, BB ante 1. Buton 2.2 BB açtı, SB fold etti. BB'desin. Gereken equity nedir?
A) %15 · B) %20 · C) %27 · D) %31
**Cevap: B.** Pot 4.7 BB (2.2 + 0.5 + 1 + 1 ante). 1.2 BB ödüyorsun: 1.2 / 5.9 = %20.3. Ante, BB'nin fiyatını belirgin biçimde iyileştirir.

**5.** Butonun 2.5 BB açılışına karşı BB'de 72o var. 72o bu aralığa karşı ham olarak yaklaşık %29.5 equity taşıyor, gereken ise %27.3. Çoğu çalışma kaynağı yine de fold önerir. Neden?
A) Pot odds yanlış hesaplanmıştır
B) Pozisyon dışında bu el ham equity'sinin tamamını kullanamaz (equity realization)
C) 72o her zaman %20'nin altındadır
D) BB hiçbir zaman offsuit elle savunma yapmaz
**Cevap: B.** Eşik kıl payı geçiliyor: call'un kârlı olması için 72o'nun ham equity'sinin yaklaşık %93'ünü (27.3 / 29.5) realize etmesi gerekir. Pozisyon dışında, çoğu flop'u ıskalayan bir el için bu gerçekçi değil. D yanlış, çünkü K4o gibi offsuit eller ucuz fiyatlarda savunulur (soru 7).

**6.** Aynı spotta T8s'in ham equity'si yaklaşık %41.3. Call'un kârlı olması için ham equity'nin en az ne kadarını realize etmesi gerekir?
A) %27 · B) %50 · C) %66 · D) %90
**Cevap: C.** 27.3 / 41.3 ≈ %66. Suited ve bağlantılı bir el için ulaşılabilir bir oran. 72o'nun ihtiyacı ise %93'tü. Aynı fiyat, iki çok farklı karar.

**7.** Turnuva, 30 BB, ante 1. Buton 2.2 BB açtı ve BB'de K4o var. Ham equity yaklaşık %41.4, gereken %20.3. En iyi hamle hangisi?
A) Fold · B) Call · C) All-in
**Cevap: B.** Ham equity'nin yalnızca yaklaşık yarısını realize etmek yetiyor. 30 BB ile all-in ise 3.7 BB'lik potu almak için büyük risk alır ve çoğunlukla daha iyi eller tarafından görülür.

**8.** UTG 2.5 BB açtı, herkes fold etti, BB'de J4o var. Fiyat buton açılışındakiyle aynı (%27.3). J4o'nun UTG aralığına karşı ham equity'si yaklaşık %28.9. Savunma kararını en çok değiştiren etken nedir?
A) Açanın pozisyonu ve buna bağlı aralığın gücü · B) Kartların rengi · C) Masadaki oyuncu sayısı
**Cevap: A.** UTG'nin aralığı (%15) butonunkinden (%43) çok daha güçlü. J4o hem eşiğin hemen üstünde kalıyor hem de J'li per yaptığında sık sık daha iyi kicker'a kaybediyor (domine). Fiyat aynı olsa da savunma aralığı açana göre daralır.

## Yeni spot taslakları (devredildi, depoya eklenmedi)

Dört taslak `replay.ts` ile denendi: aksiyon sırası hatasız, sıra kahramanda, pot verisi hesaplananla aynı (4 / 4 / 6.5 / 4.7). Eklendiklerinde `savunma` havuzu 2'den 6'ya çıkar.

```json
[
 {"id":"c34","title":"BB'de 72 offsuit: buton açtı","game":"cash","street":"preflop","heroPos":"BB","stackBB":100,"hero":"7d2c","potBB":4,"seq":["BTN r2.5","SB f"],"options":["Fold","Call (1.5 BB daha)","3-bet 11 BB"],"correct":0,"topic":"savunma","level":2,"reasoning":"Call için yaklaşık %27 equity gerekiyor (1.5 / 5.5). 72o butonun geniş açılış aralığına karşı ham olarak %30 civarı equity taşır; yani eşiği ancak kıl payı geçer. Pozisyon dışında, bağlantısız ve offsuit bir el bu equity'nin tamamını kullanamaz (equity realization): çoğu flop'ta ıskalar ve bahse fold eder. Bu varsayımlarla fold."},
 {"id":"c35","title":"BB'de J4 offsuit: UTG açtı","game":"cash","street":"preflop","heroPos":"BB","stackBB":100,"hero":"Jd4c","potBB":4,"seq":["UTG r2.5"],"options":["Fold","Call (1.5 BB daha)","3-bet 11 BB"],"correct":0,"topic":"savunma","level":1,"reasoning":"Fiyat butona karşı savunmadakiyle aynı (yaklaşık %27), ama UTG'nin aralığı çok daha güçlü. J4o bu aralığa karşı ham olarak %29 civarındadır ve sık sık domine durumdadır: J'li per yaptığında bile rakipte daha iyi kicker olur. Pozisyon dışında bu eşiği tutturmak gerçekçi değil. Savunma aralığını fiyat kadar açanın pozisyonu da belirler."},
 {"id":"c36","title":"BB'de 65 suited: açılış ve call var","game":"cash","street":"preflop","heroPos":"BB","stackBB":100,"hero":"6s5s","potBB":6.5,"seq":["CO r2.5","BTN c","SB f"],"options":["Fold","Call (1.5 BB daha)","3-bet 13 BB"],"correct":1,"topic":"savunma","level":2,"reasoning":"Pota 1.5 BB ekleyip 8 BB'lik pot için oynuyorsun: gereken equity yaklaşık %19. Çok kişili potta iki rakibe karşı equity'n düşer, ama 65s gibi suited connector'lar kent ve floş yaptığında büyük pot kazanabilir; tek per'e bel bağlamazlar. Bu fiyata call rahat. 3-bet ise iki rakibe karşı bu eli gereksiz yere blöfe çevirir."},
 {"id":"t25","title":"BB'de K4 offsuit: ante'li potta buton açtı","game":"turnuva","street":"preflop","heroPos":"BB","stackBB":30,"hero":"Kd4c","potBB":4.7,"seq":["BTN r2.2","SB f"],"ante":1,"options":["Fold","Call (1.2 BB daha)","All-in (30 BB)"],"correct":1,"topic":"savunma","level":1,"reasoning":"Ante ve küçük açılış sayesinde 5.9 BB'lik pot için 1.2 BB ödüyorsun: gereken equity yaklaşık %20. K4o butonun geniş aralığına karşı ham olarak %40 civarındadır; pozisyon dışında equity'nin bir kısmını kaybetsen de eşik rahatça geçilir. 30 BB ile all-in ise yalnızca daha iyi ellerin göreceği, gereksiz büyük bir risk olur."}
]
```

**Uzman notu:** c34 (72o) sınırda bir spot. Bazı solver çıktılarında BB, butonun 2.5 BB açılışına karşı çok geniş savunur. Bu spot "fiyat yetse bile realization yetmez" fikrini öğretmek için seçildi, ama tek doğru cevabı olan bir spot olarak riskli (**doğrulanamadı**). Depoya eklemeden önce iki seçenek var: c34'te açılışı 2.5 BB yerine 3 BB yapmak (gereken equity 2 / 6.5 = %30.8'e çıkar ve 72o'nun ham equity'sinin altında kalır; `seq` ["BTN r3","SB f"], `potBB` 4.5, seçenek "Call (2 BB daha)") ya da B-1'deki `acceptable` alanı gelince call'u "kabul edilebilir" olarak işaretlemek. **Bu nedenle bu çıktı "revizyon bekliyor" durumunda.**
