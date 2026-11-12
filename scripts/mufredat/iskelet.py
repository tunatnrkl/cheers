#!/usr/bin/env python3
"""Müfredat iskeletini üretir: src/data/mufredat.json ve docs/mufredat/01-iskelet.md.
Yalnızca pist / ünite / ders haritası, önkoşullar ve kazanımlar. Alıştırmalar ünite ünite
doldurulur (durum: "iskelet" -> "dolu"); dolu dersleri bu betik EZMEZ."""
import json, os, sys

RENK = {"temel": "#F6EBD0", "preflop": "#E0A526", "matematik": "#5FB58A", "postflop": "#6FA8DC",
        "ileri": "#C58BD8", "turnuva": "#F0715A", "icm": "#E58A3C"}

# (kimlik, başlık, seviye, renk, özet, [(ders başlığı, kazanım, ek önkoşullar)], seviye_testi)
U = []
def unite(kid, baslik, seviye, renk, ozet, dersler, test=None):
    U.append(dict(kid=kid, baslik=baslik, seviye=seviye, renk=renk, ozet=ozet, dersler=dersler, test=test))

# ───────────── ORTAK TEMEL (her iki pistte) ─────────────
unite("o1", "Kartlar ve eller", 1, "temel", "Desteyi, on el sıralamasını ve beş kart kuralını öğren.", [
 ("Deste ve kartlar", "52 kartı, dört rengi ve sıra değerlerini (2'den A'ya) tanır; kart yazımını (A♠, Kh) okur.", []),
 ("El sıralaması: yüksek karttan üçlüye", "Yüksek kart, per, iki per ve üçlüyü ayırt eder ve sıralar.", []),
 ("El sıralaması: kentten royal floşa", "Kent, floş, full house, kare ve sıralı floşu ayırt eder; on elin tam sırasını bilir.", []),
 ("Beş kart kuralı ve kicker", "En iyi elin yedi karttan seçilen beş kart olduğunu ve kicker'ın eşitliği nasıl bozduğunu uygular.", []),
 ("Board'u okumak", "Verilen el ve board'da kendi en iyi beş kartını ve board'un izin verdiği en güçlü eli (nuts) bulur.", []),
])
unite("o2", "Masa ve el akışı", 1, "temel", "Blind'ler, aksiyonlar, sokaklar, showdown ve pot hesabı.", [
 ("Buton ve blind'ler", "Dealer butonunu, küçük ve büyük blind'i ve blind'lerin neden zorunlu olduğunu açıklar.", []),
 ("Aksiyonlar", "Fold, check, call, bet ve raise'in ne zaman yapılabildiğini bilir; check ile call'u karıştırmaz.", []),
 ("Sokaklar: preflop'tan river'a", "Preflop, flop, turn ve river'da kaç kart açıldığını ve kimin önce konuştuğunu sıralar.", []),
 ("Showdown ve kazanan", "Showdown'da kazananı, beraberliği ve potun bölünmesini belirler.", ["o1-d4"]),
 ("Pot nasıl büyür", "Blind'ler ve bahislerden potu toplar; bir bahsi görmek için ödenecek miktarı hesaplar.", []),
], test="Seviye 1 testi")
unite("o3", "Pozisyon", 2, "temel", "Koltuk adları ve son konuşmanın neden avantaj olduğu.", [
 ("Koltuk adları", "6 kişilik masada UTG, HJ, CO, BTN, SB ve BB'yi butona göre yerleştirir.", []),
 ("Pozisyonda ve pozisyonsuz", "Postflop'ta kimin son konuştuğunu bulur; IP ve OOP terimlerini doğru kullanır.", ["o2-d3"]),
 ("Son konuşmanın değeri", "Son konuşanın bilgi ve pot kontrolü avantajını örnekle açıklar.", []),
 ("Erken, geç pozisyon ve blind'ler", "Arkada kalan oyuncu sayısının el seçimini neden sıkılaştırdığını açıklar.", []),
 ("BB cinsinden düşünmek", "Stack ve bahisleri BB'ye çevirir; iki oyuncu arasındaki efektif stack'i bulur.", ["o2-d5"]),
])
unite("o4", "Başlangıç elleri", 3, "preflop", "169 başlangıç eli, kategoriler ve domine edilme.", [
 ("El kategorileri", "Cepte çift, suited, offsuit, connector ve broadway ellerini tanır ve yazımını (AKs, 76o) okur.", []),
 ("Range matrisini okumak", "13x13 matriste bir elin yerini bulur; bir aralığın yaklaşık yüzdesini yorumlar.", []),
 ("Domine edilme ve kicker sorunu", "AJ'nin AK'ya karşı durumunu örnek alarak domine edilen elleri tanır.", ["o1-d4"]),
 ("Sıkı ve agresif oyunun mantığı", "Az el oynayıp oynadığını raise ile oynamanın gerekçelerini sayar.", ["o3-d4"]),
 ("Limp neden çoğunlukla zayıf", "İlk giren oyuncu için limp'in sakıncalarını açıklar; istisnaların varlığını bilir.", []),
], test="Seviye 2-3 testi")

# ───────────── CASH ─────────────
unite("c5", "Açılış aralıkları", 3, "preflop", "Herkes fold ettiğinde hangi pozisyondan hangi ellerle açılır.", [
 ("Açılış boyutu", "Varsayılan 2,5 BB açılışın gerekçesini ve boyutun eli ele vermemesi gerektiğini açıklar.", []),
 ("UTG ve HJ açılışları", "Erken pozisyonların sıkı açılış aralığını matriste işaretler.", ["o4-d2"]),
 ("CO ve BTN açılışları", "Geç pozisyonda aralığın neden genişlediğini açıklar ve örnek elleri sınıflar.", []),
 ("SB'den açılış", "SB'nin pozisyonsuz kalacağını hesaba katarak açılış ya da fold kararını verir.", []),
 ("Sınırdaki eller", "Aralığın kenarındaki ellerde kararın yakın olduğunu ve masaya göre değişebildiğini bilir.", []),
 ("Rakibe göre küçük ayar", "Blind'lerdeki oyuncular sıkı ya da gevşekse açılışı hangi yönde ayarlayacağını söyler.", []),
])
unite("c6", "Blind savunması", 4, "preflop", "Açılışa karşı BB ve SB'de fiyat, aralık ve equity realization.", [
 ("Fiyat: gereken equity", "Açılışa call için gereken equity'yi hesaplar (ödenecek / call sonrası pot).", ["o2-d5"]),
 ("BB savunması ve açanın pozisyonu", "Aynı fiyatta UTG'ye karşı dar, BTN'ye karşı geniş savunmanın nedenini açıklar.", ["c5-d3"]),
 ("Equity realization", "Ham equity'nin tamamının neden kullanılamadığını; suited ve bağlantılı ellerin avantajını açıklar.", []),
 ("SB stratejisi", "SB'de açılışa karşı çoğunlukla 3-bet ya da fold oynamanın gerekçesini açıklar.", []),
 ("Çok oyunculu potta BB", "Açılış ve call sonrası iyi fiyatla hangi el tiplerinin savunulduğunu seçer.", []),
], test="Seviye 4 testi")
unite("c7", "3-bet ve ötesi", 5, "preflop", "3-bet, 4-bet, 5-bet, squeeze, iso-raise ve blokerler.", [
 ("3-bet nedir, neden yapılır", "3-bet'i tanımlar; value ve fold equity olmak üzere iki amacını ayırır.", ["c5-d3"]),
 ("Value 3-bet ve blöf 3-bet", "Güçlü ellerle value, uygun zayıf ellerle blöf 3-bet seçer; ortadaki elleri call'a ayırır.", []),
 ("Blokerler", "Elindeki bir asın rakibin AA ve AK kombinasyonlarını nasıl azalttığını sayar.", ["o4-d1"]),
 ("3-bet boyutları", "Pozisyonda ve pozisyonsuz 3-bet boyutunun neden farklı olduğunu açıklar.", ["o3-d2"]),
 ("3-bet'e karşı oynamak", "Açtığı ele 3-bet gelince call, 4-bet ve fold arasında seçim yapar.", []),
 ("4-bet ve 5-bet", "100 BB'de 4-bet ve 5-bet all-in aralıklarının neden dar olduğunu açıklar.", []),
 ("Squeeze", "Açılış ve call sonrası squeeze'in neden daha büyük boyut ve fazladan fold equity taşıdığını açıklar.", []),
 ("Iso-raise", "Limp eden oyuncuyu izole etmenin amacını ve boyutunu belirler.", ["o4-d5"]),
])
unite("c8", "Postflop matematiği", 5, "matematik", "Equity, outs, 2 ve 4 kuralı, pot odds, implied odds ve SPR.", [
 ("Equity nedir", "Equity'yi potun uzun vadedeki payı olarak tanımlar; tipik karşılaşmaların yaklaşık equity'sini bilir.", []),
 ("Outs saymak", "Floş ve kent çekişlerinde outs sayar; çifte sayımı ve kirli outs'u ayıklar.", ["o1-d5"]),
 ("2 ve 4 kuralı", "Outs'tan yaklaşık yüzdeyi hesaplar; 4 kuralının yalnızca iki kart garantiyken geçerli olduğunu bilir.", []),
 ("Pot odds", "Bir bahse call için gereken equity'yi hesaplar ve çekişin equity'siyle karşılaştırır.", ["c6-d1"]),
 ("Implied ve reverse implied odds", "Sonradan kazanılacak ya da kaybedilecek chip'lerin kararı nasıl değiştirdiğini açıklar.", []),
 ("SPR", "SPR'yi hesaplar; düşük ve yüksek SPR'de el gücü gereksiniminin nasıl değiştiğini açıklar.", ["o3-d5"]),
], test="Seviye 5 testi")
unite("c9", "Flop: board ve c-bet", 6, "postflop", "Board dokusu, range avantajı ve c-bet kararları.", [
 ("Board dokusu", "Kuru, ıslak, paired ve monotone board'ları tanır.", ["o1-d5"]),
 ("Range avantajı ve nut avantajı", "Verilen board'un açana mı savunana mı daha çok yaradığını değerlendirir.", ["c5-d3", "c6-d2"]),
 ("C-bet: ne zaman", "Range avantajı ve board dokusuna göre c-bet ya da check seçer.", []),
 ("C-bet boyutu", "Kuru board'da küçük, ıslak board'da daha büyük boyutun gerekçesini açıklar.", []),
 ("C-bet'e karşı savunma", "Fiyat ve el gücüne göre fold, call ya da raise seçer.", ["c8-d4"]),
 ("Pozisyonun postflop değeri", "Aynı elin IP ve OOP oynanışındaki farkı açıklar.", ["o3-d3"]),
])
unite("c10", "Value ve blöf", 7, "postflop", "Value bet, boyut, blöf seçimi, check-raise, donk bet ve pot kontrolü.", [
 ("Value bet", "\"Daha zayıf hangi eller görür?\" sorusuyla value bet kararını verir.", []),
 ("Value boyutlandırma", "Rakibin görecek aralığına göre boyut seçer.", ["c9-d4"]),
 ("Blöf seçimi", "Yarı blöfü saf blöften ayırır; equity ve bloker taşıyan elleri blöf adayı seçer.", ["c8-d1", "c7-d3"]),
 ("Check-raise", "Value ve yarı blöf amaçlı check-raise adaylarını seçer.", ["c9-d5"]),
 ("Donk bet", "Donk bet'i tanımlar; neden seyrek kullanıldığını ve hangi board'larda anlam kazandığını açıklar.", ["c9-d2"]),
 ("Pot kontrolü", "Orta güçteki elle potu küçük tutmanın gerekçesini SPR ile ilişkilendirir.", ["c8-d6"]),
])
unite("c11", "Turn ve 3-bet potları", 8, "postflop", "Turn kararları, ikinci barrel ve düşük SPR'li 3-bet potları.", [
 ("Turn kartı kimi güçlendirdi", "Turn kartının iki aralığa etkisini değerlendirir.", ["c9-d2"]),
 ("İkinci barrel ya da check", "Turn'de bahse devam ya da check kararını equity ve fold equity ile gerekçelendirir.", ["c10-d3"]),
 ("Turn'de check-raise ve probe bet", "Flop check'lendikten sonra probe bet'i ve turn check-raise'i tanır.", ["c10-d4"]),
 ("3-bet potlarında düşük SPR", "3-bet potunda SPR'nin neden düşük olduğunu ve bunun el değerlerini nasıl değiştirdiğini açıklar.", ["c7-d5", "c8-d6"]),
 ("IP ve OOP planı", "Aynı spotta pozisyona göre bahis ve check sıklığının yönünü belirler.", ["c9-d6"]),
], test="Seviye 6-8 testi")
unite("c12", "River", 9, "ileri", "İnce value, bluff catch, MDF, blokerler ve polarizasyon.", [
 ("İnce value", "River'da orta güçteki elle küçük value bet fırsatını tanır.", ["c10-d2"]),
 ("Bluff catch", "Yalnızca blöfleri yenen eli tanır; fiyatla rakibin blöf sıklığını karşılaştırır.", ["c8-d4"]),
 ("MDF ve alpha", "Bahis boyutundan MDF ve alpha'yı hesaplar; bunların teorik çıpa olduğunu, kural olmadığını bilir.", []),
 ("Blokerlerle river kararı", "Value kombinasyonlarını bloke eden ve blöfleri bloke etmeyen eli call adayı seçer.", ["c7-d3"]),
 ("Polarize ve birleşik aralık", "Polarize ve birleşik bahis aralıklarını ayırır; boyutla ilişkisini açıklar.", []),
 ("Overbet fikri", "Nut avantajı olan aralığın neden pottan büyük bahis yapabildiğini açıklar.", ["c9-d2"]),
])
unite("c13", "İleri konular", 10, "ileri", "Çok oyunculu potlar, el okuma, sömürücü oyun ve zihinsel oyun.", [
 ("Çok oyunculu potlar", "Oyuncu sayısı arttıkça blöfün neden azaldığını ve value eşiğinin yükseldiğini açıklar.", []),
 ("El okuma süreci", "Rakip aralığını preflop'tan river'a aksiyonlarla adım adım daraltır.", ["c11-d1"]),
 ("Sömürücü sapmalar", "Dengeli stratejiden ne zaman ve hangi kanıtla sapılacağını açıklar.", ["c12-d3"]),
 ("Rakip eğilimleri", "Fazla fold eden ve fazla call eden rakibe karşı ayarı seçer.", []),
 ("Tilt ve zihinsel oyun", "Tilt belirtilerini tanır; mola ve oturum sınırı gibi önlemleri sayar.", []),
 ("Oyununu gözden geçirme", "Bir eli sonuçtan bağımsız, karar kalitesiyle değerlendirir.", []),
], test="Cash bitirme testi")

# ───────────── TURNUVA ─────────────
unite("t1", "Turnuva nedir", 1, "turnuva", "Formatlar, blind seviyeleri, ante ve ödül yapısı.", [
 ("Turnuva ile cash farkı", "Chip'lerin geri alınamadığını, elenmenin kalıcı olduğunu ve blind'lerin arttığını açıklar.", []),
 ("Formatlar", "Freezeout, re-entry, sit & go ve çok masalı turnuvayı ayırt eder.", []),
 ("Blind seviyeleri", "Seviye süresini ve blind artışının stack'i BB cinsinden nasıl erittiğini hesaplar.", ["o2-d1"]),
 ("Ante ve BB ante", "Ante'nin potu nasıl büyüttüğünü hesaplar.", ["o2-d5"]),
 ("Ödül yapısı", "Paraya girmenin (ITM) ve kademeli ödül dağılımının ne olduğunu açıklar.", []),
])
unite("t2", "Stack'i ölçmek", 2, "turnuva", "BB cinsinden stack, M oranı, efektif stack ve turnuva aşamaları.", [
 ("Stack kaç BB", "Chip sayısını BB'ye çevirir; derin, orta ve kısa stack bölgelerini tanır.", ["o3-d5"]),
 ("M oranı", "M'yi hesaplar (stack / bir turun maliyeti) ve BB ölçüsüyle ilişkisini açıklar.", ["t1-d4"]),
 ("Efektif stack turnuvada", "Farklı stack'ler karşılaştığında riskteki miktarı bulur.", []),
 ("Ortalama stack ve aşamalar", "Erken, orta ve geç aşamayı blind ve ortalama stack ile tanımlar.", []),
 ("Chip'in değeri sabit değil", "Kaybedilen chip'in kazanılandan neden daha değerli olabildiğini sezgisel olarak açıklar.", ["t1-d5"]),
], test="Turnuva seviye 1-2 testi")
unite("t3", "Derin stack oyunu", 3, "turnuva", "40 BB ve üstü: açılış boyutu, ante'li potta çalma, BB savunması.", [
 ("Erken aşama planı", "Derin stack'te pozisyon ve el seçiminin önceliğini açıklar.", ["o4-d4"]),
 ("Turnuvada açılış boyutu", "2 ile 2,3 BB arası açılışın neden yaygın olduğunu açıklar.", []),
 ("Ante'li potta çalma", "Ante'nin çalma girişimini neden daha kârlı yaptığını hesaplar.", ["t1-d4"]),
 ("Ante ile BB savunması", "Küçük açılış ve ante karşısında gereken equity'yi hesaplar; geniş savunmayı gerekçelendirir.", []),
 ("3-bet'e kısa giriş", "3-bet'i tanımlar; derin stack'te value ve blöf 3-bet'i ayırır.", []),
])
unite("t4", "Orta stack oyunu", 4, "turnuva", "20 ile 40 BB: aralıkların değişmesi, 3-bet/fold ve resteal.", [
 ("Stack kısaldıkça ne değişir", "Spekülatif ellerin değer kaybını, yüksek kartların değer kazanmasını açıklar.", ["t2-d1"]),
 ("3-bet ya da fold", "Call etmenin neden zorlaştığını ve 3-bet/fold oyununu açıklar.", ["t3-d5"]),
 ("Resteal: 3-bet all-in", "15 ile 25 BB arasında geç pozisyon açılışına all-in adaylarını seçer.", []),
 ("Açılışa call mı, all-in mi", "Stack derinliği ve pozisyona göre iki seçeneği karşılaştırır.", []),
 ("Düşük SPR'de postflop", "SPR'yi hesaplar; top pair ile stack'i koymanın ne zaman doğal olduğunu açıklar.", []),
], test="Turnuva seviye 3-4 testi")
unite("t5", "Push/fold", 5, "turnuva", "Kısa stack: all-in ya da fold, pozisyona göre push aralıkları.", [
 ("Neden all-in ya da fold", "Kısa stack'te küçük açılışın sakıncalarını açıklar.", ["t4-d1"]),
 ("Fold equity", "All-in'in iki kazanma yolunu ayırır; stack kısaldıkça fold equity'nin azaldığını açıklar.", []),
 ("10 BB: pozisyona göre push", "10 BB ile pozisyona göre push aralığının genişliğini sıralar ve örnek elleri sınıflar.", ["o4-d2"]),
 ("6 BB ve altı", "Çok kısa stack'te aralığın neden iyice genişlediğini açıklar.", []),
 ("15 BB: push mu, açılış mı", "15 BB'de iki seçeneğin hangi ellerde öne çıktığını ayırır.", []),
 ("SB'den BB'ye karşı", "Tek rakibe karşı push aralığının neden en geniş olduğunu açıklar.", []),
 ("Nash mantığı", "Denge push/fold tablolarının varsayımlarını ve sınırlarını (ICM yok, rakip dengede) sayar.", []),
])
unite("t6", "All-in'e call", 6, "turnuva", "Fiyat, rakibin itme aralığı ve aralığa karşı equity.", [
 ("Fiyat: gereken equity", "All-in'e call için gereken equity'yi ante ve blind'lerle hesaplar.", ["t3-d4"]),
 ("Rakibin itme aralığı", "Pozisyon ve stack'ten rakibin push aralığının genişliğini tahmin eder.", ["t5-d3"]),
 ("Aralığa karşı equity", "Çiftlerin, as'lı ellerin ve bağlantılı ellerin geniş ve dar aralığa karşı durumunu sıralar.", []),
 ("BB'den call", "Fiyat ile equity'yi karşılaştırarak BB'de call ya da fold kararı verir.", []),
 ("Arkanda oyuncu varken", "Arkada konuşacak oyuncu varken call aralığının neden daraldığını açıklar.", []),
 ("Açılışına all-in gelirse", "Açtıktan sonra gelen all-in'e fiyat ve aralıkla karar verir.", ["t4-d3"]),
], test="Turnuva seviye 5-6 testi")
unite("t7", "ICM temeli", 7, "icm", "Chip değeri ile para değeri, ICM hesabı ve risk primi.", [
 ("Chip EV ve para EV", "Chip kazancının ödül payına birebir çevrilmediğini açıklar.", ["t2-d5"]),
 ("ICM nasıl hesaplanır", "Üç oyunculu basit bir örnekte ICM paylarını adım adım hesaplar.", ["t1-d5"]),
 ("Risk primi", "ICM altında call için gereken equity'nin neden chip hesabından yüksek olduğunu açıklar.", ["t6-d1"]),
 ("Stack rolleri", "Büyük, orta ve kısa stack'in ICM altındaki özgürlük ve kısıtlarını sıralar.", []),
 ("ICM'de call aralığı", "Aynı spotta ICM baskısıyla call aralığının daraldığı yönü belirler.", ["t6-d4"]),
])
unite("t8", "Balon ve final masası", 8, "icm", "Balon oyunu, para atlamaları ve final masa dinamikleri.", [
 ("Balon: baskıyı kim kurar", "Büyük stack'in orta stack'lere baskısını açıklar.", ["t7-d4"]),
 ("Balonda kısa stack", "Kısa stack'in push aralığını ve beklemenin bedelini değerlendirir.", ["t5-d3"]),
 ("Balonda orta stack", "Orta stack'in neden en kısıtlı oyuncu olduğunu açıklar.", []),
 ("Para atlamaları", "Ödül basamağı büyüdükçe risk priminin arttığını örnekle gösterir.", ["t7-d3"]),
 ("Final masa dinamikleri", "Stack dağılımına göre kimin kime baskı kurabildiğini belirler.", []),
 ("Final masada plan", "Kendi stack'ine göre agresiflik düzeyini seçer.", []),
], test="Turnuva seviye 7-8 testi")
unite("t9", "Özel formatlar", 9, "turnuva", "Bounty, PKO ve satellite turnuvalarında değişen hesap.", [
 ("Bounty mantığı", "Eleme ödülünün all-in kararına fazladan değer eklediğini açıklar.", ["t6-d1"]),
 ("PKO: ödülün chip karşılığı", "Ödülü yaklaşık chip değerine çevirme fikrini ve bunun basitleştirme olduğunu açıklar.", []),
 ("PKO'da call aralığı", "Rakibi kapsadığında call aralığının genişlediği yönü belirler.", ["t6-d4"]),
 ("Satellite: hedef hayatta kalmak", "Tüm ödüllerin eşit olduğu yapıda chip biriktirmenin sınırlı değerini açıklar.", ["t7-d1"]),
 ("Satellite'ta aşırı ICM", "Balonda çok güçlü ellerin bile fold edilebildiği durumun mantığını açıklar.", ["t7-d5"]),
])
unite("t10", "Heads-up ve ileri oyun", 10, "ileri", "Heads-up, aşama planı, ICM'de sömürücü oyun ve zihinsel dayanıklılık.", [
 ("Heads-up: aralıklar genişler", "İki kişilik oyunda pozisyon ve blind düzenini ve aralıkların genişlemesini açıklar.", ["o3-d1"]),
 ("Heads-up push/fold", "Kısa stack heads-up'ta push ve call aralıklarının yönünü belirler.", ["t5-d6"]),
 ("Aşama planı", "Erken, orta ve geç aşama için öncelikleri sıralar.", ["t2-d4"]),
 ("ICM'de sömürücü oyun", "Rakiplerin ICM hatalarına (fazla call, fazla fold) karşı ayarı seçer.", ["t8-d1"]),
 ("Zihinsel dayanıklılık", "Uzun turnuvada dikkat ve duygu yönetimi için önlemleri sayar.", []),
 ("Turnuvanı gözden geçirme", "Kritik elleri sonuçtan bağımsız, kararın gerekçesiyle değerlendirir.", []),
], test="Turnuva bitirme testi")

PIST = {
 "cash": dict(baslik="Cash", aciklama="6 kişilik masa, 100 BB, 2,5 BB açılış, rake yok sayılır. Hiç bilmeyenden ileri seviyeye.",
              uniteler=["o1","o2","o3","o4","c5","c6","c7","c8","c9","c10","c11","c12","c13"]),
 "turnuva": dict(baslik="Turnuva", aciklama="Temelden başlar; stack derinliği, push/fold, ICM ve özel formatlara uzanır.",
                 uniteler=["o1","o2","t1","o3","t2","o4","t3","t4","t5","t6","t7","t8","t9","t10"]),
}
USTALIK = {"ders": dict(son=10, oran=0.8), "kontrol": dict(son=12, oran=0.8), "test": dict(son=20, oran=0.85), "tekrar": dict(son=8, oran=0.75)}
SURE = {"ders": 5, "kontrol": 6, "test": 10, "tekrar": 4}
HEDEF = {"ders": 10, "kontrol": 12, "test": 20, "tekrar": 8}

def build(eski):
    dolu = {d["kimlik"]: d for u in eski.get("uniteler", []) for d in u["dersler"] if d.get("durum") == "dolu"}
    uniteler = []
    for u in U:
        k = u["kid"]; dersler = []
        def ekle(d):
            dersler.append(dolu.get(d["kimlik"], d))
        onceki = None
        for i, (baslik, kazanim, ek) in enumerate(u["dersler"], 1):
            kim = f"{k}-d{i}"
            # Ünitenin ilk dersi için ünite arası önkoşul aşağıda pist sırasından eklenir.
            onk = ([onceki] if onceki else []) + [e for e in ek if e != onceki]
            ekle(dict(kimlik=kim, baslik=baslik, tur="ders", onkosul=onk, kazanimlar=[kazanim], sureDk=SURE["ders"],
                      anlatim=[], terimler=[], ustalik=USTALIK["ders"], hedefAlistirma=HEDEF["ders"], durum="iskelet", alistirmalar=[]))
            onceki = kim
        ekle(dict(kimlik=f"{k}-k", baslik=f"Kontrol: {u['baslik']}", tur="kontrol", onkosul=[onceki],
                  kazanimlar=[f"\"{u['baslik']}\" ünitesinin kazanımlarını karışık sorularda uygular."], sureDk=SURE["kontrol"],
                  anlatim=[], terimler=[], ustalik=USTALIK["kontrol"], hedefAlistirma=HEDEF["kontrol"], durum="iskelet", alistirmalar=[]))
        ekle(dict(kimlik=f"{k}-r", baslik=f"Tekrar: {u['baslik']}", tur="tekrar", onkosul=[f"{k}-k"], zorunlu=False,
                  kazanimlar=["Ünitede zayıf kalan kazanımları yeniden çalışır; sorular geçmiş hatalardan seçilir."], sureDk=SURE["tekrar"],
                  anlatim=[], terimler=[], ustalik=USTALIK["tekrar"], hedefAlistirma=HEDEF["tekrar"], durum="iskelet", alistirmalar=[]))
        if u["test"]:
            ekle(dict(kimlik=f"{k}-t", baslik=u["test"], tur="test", onkosul=[f"{k}-k"], seviyeAtlar=u["seviye"],
                      kazanimlar=[f"Seviye {u['seviye']} ve altındaki ünitelerin kazanımlarını karışık sorularda gösterir; geçilirse bu üniteye kadar olan dersler açılır."],
                      sureDk=SURE["test"], anlatim=[], terimler=[], ustalik=USTALIK["test"], hedefAlistirma=HEDEF["test"], durum="iskelet", alistirmalar=[]))
        uniteler.append(dict(kimlik=k, baslik=u["baslik"], seviye=u["seviye"], renk=RENK[u["renk"]], ozet=u["ozet"], dersler=dersler))
    # Ünite arası önkoşul: bir ünitenin ilk dersi, onu içeren HER pistte kendinden önceki ünitenin kontrolünü ister.
    by = {u["kimlik"]: u for u in uniteler}
    for p in PIST.values():
        for a, b in zip(p["uniteler"], p["uniteler"][1:]):
            ilk = by[b]["dersler"][0]
            if ilk.get("durum") == "dolu": continue
            # Ortak ünite iki pistte farklı öncüle sahipse, yalnızca ortak öncüller zorunlu tutulur.
            ilk.setdefault("_aday", []).append(f"{a}-k")
    for u in uniteler:
        ilk = u["dersler"][0]; aday = ilk.pop("_aday", [])
        pistSayisi = sum(u["kimlik"] in p["uniteler"] for p in PIST.values())
        ortak = [a for a in dict.fromkeys(aday) if aday.count(a) == pistSayisi]
        ilk["onkosul"] = ortak + [o for o in ilk["onkosul"] if o not in ortak]
    return dict(surum=1, dil="tr",
                varsayimlar=dict(cash="6-max, 100 BB, 2,5 BB açılış, rake yok sayılır.", turnuva="Aksi yazılmadıkça BB ante 1 BB; ICM yalnızca ICM ünitelerinde hesaba katılır."),
                pistler=[dict(kimlik=k, **v) for k, v in PIST.items()], uniteler=uniteler)

def rapor(m):
    by = {u["kimlik"]: u for u in m["uniteler"]}
    L = ["# Müfredat iskeleti", "", "Bu dosya `scripts/mufredat/iskelet.py` tarafından `src/data/mufredat.json` ile birlikte üretilir; elle düzenlenmez.", ""]
    n_ders = sum(len(u["dersler"]) for u in m["uniteler"]); n_al = sum(d["hedefAlistirma"] for u in m["uniteler"] for d in u["dersler"])
    L += [f"**Toplam:** {len(m['uniteler'])} ünite ({sum(1 for u in m['uniteler'] if u['kimlik'].startswith('o'))} ortak), {n_ders} ders, hedef {n_al} alıştırma.", ""]
    for p in m["pistler"]:
        us = [by[k] for k in p["uniteler"]]
        L += [f"## {p['baslik']} pisti", "", p["aciklama"], "",
              f"{len(us)} ünite, {sum(len(u['dersler']) for u in us)} ders, yaklaşık {sum(d['sureDk'] for u in us for d in u['dersler'])} dakika.", "",
              "| # | Ünite | Seviye | Dersler |", "|---|---|---|---|"]
        for i, u in enumerate(us, 1):
            ad = "; ".join(d["baslik"] for d in u["dersler"] if d["tur"] == "ders")
            ek = " + kontrol + tekrar" + (" + **seviye testi**" if any(d["tur"] == "test" for d in u["dersler"]) else "")
            L.append(f"| {i} | {u['baslik']}{' (ortak)' if u['kimlik'].startswith('o') else ''} | {u['seviye']} | {ad}{ek} |")
        L.append("")
    L += ["## Dersler, kazanımlar ve önkoşullar", ""]
    for u in m["uniteler"]:
        L += [f"### {u['kimlik']} · {u['baslik']} (seviye {u['seviye']})", "", u["ozet"], "", "| Ders | Tür | Kazanım | Önkoşul |", "|---|---|---|---|"]
        for d in u["dersler"]:
            L.append(f"| `{d['kimlik']}` {d['baslik']} | {d['tur']} | {d['kazanimlar'][0]} | {', '.join(d['onkosul']) or '—'} |")
        L.append("")
    return "\n".join(L) + "\n"

if __name__ == "__main__":
    kok = os.path.join(os.path.dirname(__file__), "..", "..")
    yol = os.path.join(kok, "src/data/mufredat.json")
    eski = json.load(open(yol)) if os.path.exists(yol) else {}
    m = build(eski)
    json.dump(m, open(yol, "w"), ensure_ascii=False, indent=1); open(yol, "a").write("\n")
    open(os.path.join(kok, "docs/mufredat/01-iskelet.md"), "w").write(rapor(m))
    print(len(m["uniteler"]), "ünite,", sum(len(u["dersler"]) for u in m["uniteler"]), "ders")
