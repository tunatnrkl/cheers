# SPR ve value bet: quiz ve yeni spot taslakları

**Tarih:** 2026-11-11 (2. çalışma) · **Roller:** Poker Eğitim, Poker Uzmanı kontrolüyle · **Seviye:** orta

## Eksik konu tespiti

Elle yazılmış spotlarda `value` 3 (c20, c22, c23) ve `spr` 4 (c24, c25, c30, t23) spot var. Üretilen 522 spotun hiçbiri bu iki konuda değil. Alıştırma masasında "SPR" filtresi seçildiğinde 4 el döngüye giriyor. Bu paket her iki konuya da yeni spot ekliyor ve konuyu sayılarla anlatan bir quiz sunuyor.

## Terimler

- **SPR (stack-to-pot ratio):** Efektif stack'in, flop'taki pota oranı. SPR düşükse (yaklaşık 3'ün altı) tek per bile çoğu zaman bütün stack'i koymaya değer. SPR yüksekse (yaklaşık 10'un üstü) büyük potlar genellikle çok güçlü ellerle oynanır. Bu eşikler pratik kurallardır, kesin sınırlar değildir.
- **Value bet:** Daha kötü bir elin call etmesini beklediğin bahis.
- **Set mining:** Küçük bir çifti, yalnızca flop'ta set (üçlü) yapma umuduyla oynamak.

## Quiz (7 soru)

**1.** Cash, 100 BB. Buton 2.5 BB açtı, SB fold etti, BB call etti. Flop'ta SPR yaklaşık kaçtır?
A) 5 · B) 10 · C) 18 · D) 40
**Cevap: C.** Pot 2.5 + 2.5 + 0.5 = 5.5 BB. Kalan stack 97.5 BB. 97.5 / 5.5 ≈ 17.7.

**2.** CO 2.5 BB açtı, sen butonda 9 BB'ye 3-bet yaptın, blind'lar fold etti, CO call etti. Flop'ta SPR?
A) 1.7 · B) 4.7 · C) 9 · D) 18
**Cevap: B.** Pot 9 + 9 + 0.5 + 1 = 19.5 BB. Kalan stack 91 BB. 91 / 19.5 ≈ 4.7. 3-bet potlarında SPR, tek raise'li potlara göre çok daha düşüktür.

**3.** Aynı masada 22 BB'ye 4-bet yaptın ve call geldi (blind'lar fold). Flop'ta SPR yaklaşık 1.7. Flop'ta top pair top kicker ile rakip all-in yaptı. Bu SPR'de elin için en doğru yaklaşım hangisi?
A) Rakibin aralığına bakmadan fold
B) Top pair'in çoğu rakip aralığına karşı stack koymaya yeter, fold nadiren doğrudur
C) Her zaman yalnızca set ile devam edilir
**Cevap: B.** Pot 22 + 22 + 1.5 = 45.5 BB, kalan 78 BB. Pot zaten stack'lere göre çok büyük olduğu için ödenecek fiyat iyidir ve rakibin 4-bet potu call eden aralığında top pair'in yendiği çok el vardır. "Nadiren" ifadesi bilinçli: aşırı sıkı bir rakibe karşı istisna olabilir.

**4.** Elinde küçük bir cep çifti var. Flop'ta set ya da daha iyisini yapma ihtimali yaklaşık nedir?
A) %6 · B) %12 · C) %20 · D) %25
**Cevap: B.** 1 − C(48,3) / C(50,3) = 1 − 17.296 / 19.600 ≈ **%11.8**. Yani yaklaşık 7.5'e 1 aleyhine.

**5.** UTG 3 BB açtı ve masada yalnızca 20 BB'si var. CO'dasın, elinde 33 var. Yalnızca set mining ile call etmenin neden zor olduğunu en iyi hangisi açıklar?
A) 33 hiçbir zaman per olarak kazanmaz
B) Set yaptığında bile kazanabileceğin en fazla miktar, call'un yaklaşık 7 katı; 7.5'e 1'lik ihtimali ancak her seferinde bütün stack'i alırsan karşılar
C) UTG hiçbir zaman çift oynamaz
**Cevap: B.** Kazanabileceğin en fazla miktar: 17 BB (UTG'nin kalan stack'i) + 4.5 BB (ortadaki pot) = 21.5 BB. 3 BB'lik call'a oranı 21.5 / 3 ≈ 7.2. Set her zaman kazanmaz ve rakip her zaman bütün stack'ini vermez, bu yüzden gerçek oran daha kötüdür. A yanlış: 33 bazen eşleşmeden de kazanır, ama UTG'nin güçlü aralığına karşı bu equity'yi pozisyonda bile tam kullanmak zordur.

**6.** River'da bahis yapıyorsun. Rakip yalnızca daha iyi ellerle call ediyor, daha kötü elleriyle fold ediyor. Bu bahis ne tür bir bahistir?
A) Value bet · B) Value bet değil; bahis yalnızca daha iyi elleri ödetir ya da hiçbir şey kazanmaz · C) Koruma bahsi
**Cevap: B.** Bir bahsin value bet sayılması için call edildiğinde **daha kötü bir elin** call ediyor olması gerekir. Daha kötü eller fold, daha iyiler call ediyorsa bahis yalnızca kaybettiğin miktarı artırır. River'da koruma diye bir şey yoktur, çünkü gelecek kart yok.

**7.** River'da pot büyüklüğünde bahis yapıyorsun ve aralığın polarize (ya çok güçlü ya hiçbir şey). Basitleştirilmiş oyun teorisi modeline göre bahis aralığının yaklaşık ne kadarı blöf olmalı?
A) %10 · B) %33 · C) %50 · D) %66
**Cevap: B.** Pot büyüklüğünde bahiste rakibin call için ihtiyaç duyduğu equity 1 / 3. Rakibi call ve fold arasında kararsız bırakmak için blöf oranı da 1 / 3 olur (genel formül: bahis / (pot + 2 × bahis)). **Varsayımlar:** river, polarize aralık, raise yok, rakip yalnızca blöfleri yenen bir elle karar veriyor. Gerçek oyunda bu oran rakibe göre değişir ve bir hedef olarak değil, başlangıç noktası olarak kullanılmalı.

## Yeni spot taslakları (devredildi, depoya eklenmedi)

Üç taslak `replay.ts` ile denendi. Üçünde de hata yok, sıra kahramanda, pot verisi hesaplananla aynı (4.5 / 14 / 15.5). Eklendiklerinde `spr` 4'ten 6'ya, `value` 3'ten 4'e çıkar. Kullanıcıya görünen metinlerde sayılar CS-5 kararına uygun olarak virgülle yazıldı. `seq` alanı makine verisidir ve noktalı kalır.

```json
[
 {"id":"c38","title":"Kısa stack'li UTG'ye karşı set mining","game":"cash","street":"preflop","heroPos":"CO","stackBB":100,"hero":"3s3h","potBB":4.5,"stacks":{"UTG":20},"seq":["UTG r3","HJ f"],"note":"UTG'nin masada yalnızca 20 BB'si var.","options":["Fold","Call (3 BB)","3-bet 9 BB"],"correct":0,"topic":"spr","level":2,"reasoning":"Küçük bir çiftle call etmenin asıl sebebi flop'ta set yapmaktır ve bu ihtimal yaklaşık %12, yani 7,5'e 1 aleyhine. UTG'nin yalnızca 17 BB'si kaldığı için set yaptığında bile en fazla yaklaşık 21,5 BB kazanabilirsin: 3 BB'lik call'un ancak 7 katı. Bu oran set her seferinde kazansa ve rakip her seferinde bütün stack'ini verse bile yetmiyor. Arkanda oynayacak üç oyuncu da var. Bu varsayımlarla fold. Rakip 100 BB'lik olsaydı call çok daha cazip olurdu."},
 {"id":"c39","title":"River'da küçük bahse karşı set: value raise","game":"cash","street":"river","heroPos":"BB","stackBB":100,"hero":"7s7h","board":"Kd7c2h4c9d","potBB":14,"seq":["BTN r2.5","SB f","BB c","F Kd7c2h","BB x","BTN b2","BB c","T 4c","BB x","BTN x","R 9d","BB x","BTN b4.5"],"note":"BTN turn'de orta güçteki ellerle check eden, river'da küçük bahisle ince value arayan bir oyuncu.","options":["Fold","Call (4,5 BB)","Raise 15 BB"],"correct":2,"topic":"value","level":2,"reasoning":"Board'da kent ya da floş yok. Seni yalnızca 99 (3 kombinasyon) ve slow play edilmiş KK yener. Rakibin küçük bahsi çoğunlukla K'lı eller, K9 gibi iki per'ler ve zayıf blöflerden oluşur; bunların büyük kısmı bir raise'e call eder. Yalnızca call edersen bu ellerden alabileceğin ek chip'leri masada bırakırsın. Call da kârlı bir hamle, ama bu varsayımlarla raise daha fazla kazandırır."},
 {"id":"t26","title":"Düşük SPR'de top pair: all-in'e karşı","game":"turnuva","street":"flop","heroPos":"BB","stackBB":12,"hero":"KcJd","board":"Jh8s3c","potBB":15.5,"ante":1,"seq":["CO r2","BTN f","SB f","BB c","F Jh8s3c","BB x","CO a"],"note":"ICM baskısı yok. CO, bu stack'te flop'u yakaladığı ya da çekişi olduğu her eli all-in yapan agresif bir oyuncu: setler, overpair'ler, J'li eller, TT–66, 88'li per'ler (A8s, 98s, 87s), AK, AQ, ATs, KQs ve T9s, QTs, 97s gibi kent çekişleri.","options":["Fold","Call (10 BB)"],"correct":1,"topic":"spr","level":2,"reasoning":"Flop'ta SPR yaklaşık 1,8: pot 5,5 BB, kalan stack 10 BB. Bu kadar düşük SPR'de rakip bahis yaptığı ellerin çoğunu doğrudan all-in yapar. 15,5 BB'lik pota 10 BB ödüyorsun: gereken equity yaklaşık %39. Notta yazan aralığa karşı KJ yaklaşık %63 equity taşır, yani call. Rakip yalnızca set, overpair ve J'li güçlü ellerle all-in yapsaydı equity'n %34'e düşer ve fold doğru olurdu. Düşük SPR'de karar neredeyse tamamen bir pot odds hesabıdır."}
]
```

### Hesap kontrolü

| Spot | Kontrol | Sonuç |
|---|---|---|
| c38 | Flop'ta set olasılığı 1 − C(48,3)/C(50,3) = 0.1176; en iyi durumda kazanç/call = (17 + 4.5) / 3 = 7.2 < 7.5 | ✅ |
| c39 | Board Kd7c2h4c9d'de kent ve floş yok (elle sayıldı). 77'yi yenen eller: 99 (3 kombinasyon), KK (3 kombinasyon). K9, 44, 22 ve iki per'ler 77 setinin altında | ✅ |
| t26 | Gereken 10 / 25.5 = 0.392. KcJd, notta yazan aralığa karşı **0.633**; yalnızca güçlü ellere (AA–QQ, JJ, 88, 33, AJ, KJ, QJ, JTs, J9s) karşı **0.344**. Turn ve river tam sayılarak hesaplandı, Monte Carlo değil | ✅ |

### Reddedilen taslak

**c37 (3-bet potta top pair, check-raise all-in'e karşı)** eklenmedi. KQ/AQ'lu bir aralığa karşı equity %69, yalnızca set ve AQ'ya karşı %34; gereken %43. Rakip aralığı notta tek bir cümleyle güvenilir biçimde tarif edilemediği için cevap tartışmalı kalıyordu.

## Uzman notu

- **c38** pratik bir kurala dayanıyor: set mining için kalan stack'in call'un 15-20 katı olması gerektiği sık tekrarlanan bir kuraldır, ama kesin kaynağı **doğrulanamadı**. Spot bu kurala değil, doğrudan hesaba (7.2 < 7.5) dayandırıldı. Yine de CO'nun pozisyon avantajı ve 33'ün eşleşmeden kazandığı eller hesaba katılmadı. Bu nedenle seviye 2 ve gerekçede "bu varsayımlarla" dili var.
- **c39** için call "kabul edilebilir" bir ikinci seçenek. B-1'deki `acceptable` alanı gelirse `acceptable: [1]` olarak işaretlenmeli.
- Quiz 7'deki blöf oranı yalnızca basitleştirilmiş modelde kesindir. Gerçek bir solver çıktısıyla karşılaştırılmadı.
