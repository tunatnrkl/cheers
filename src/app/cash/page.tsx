import type { Metadata } from "next";
import { ModulePage } from "@/components/ModulePage";

export const metadata: Metadata = {
  title: "Cash Game Rehberi",
  description: "Cash game'de stack derinliği, rake, pot odds ve pozisyona göre açılış aralıkları. Örnek eller ve hesap makineleriyle çalış.",
};

export default function Page() {
  return (
    <ModulePage
      title="Cash game"
      lead="Chip'lerin değeri sabittir, blind'lar yükselmez. Her karar tek başına değerlendirilir: uzun vadede artı mı, eksi mi?"
      other={{ href: "/turnuva", label: "Turnuva" }}
      sections={[
        {
          title: "Stack derinliği",
          text: "Cash game genelde 100 BB ile oynanır; bu derinlikte flop sonrası üç sokak bahis için yer vardır. Stack derinleştikçe (150–200 BB) set ve suited connector gibi büyük el yapabilen eller değer kazanır, tek per ile büyük pot oynamak riskli hale gelir. 40–50 BB gibi sığ stack'lerde ise yüksek kartlar ve çiftler öne çıkar. Karar verirken kendi stack'ine değil efektif stack'e bak.",
          links: [["/alistirma?oyun=cash", "Cash spotlarını çalış"], ["/araclar#spr", "SPR hesapla"]],
        },
        {
          title: "Rake",
          text: "Rake, her pottan alınan kesintidir ve en çok küçük potlarda hissedilir. Sonuç olarak sınırda kalan eller (özellikle blind'dan zayıf call'lar ve limp'ler) kâğıt üzerinde başabaş görünse bile kesinti sonrası eksiye döner. Pratik kural: marjinal elleri bırak, girdiğin potlara raise ile gir; flop görülmeden biten potlarda çoğu yerde kesinti alınmaz.",
        },
        {
          title: "Pot odds",
          text: "Bir bahsi görmeden önce iki sayıyı karşılaştır: call için gereken equity ve elinin tahmini equity'si. Çekişlerde 2 ve 4 kuralı hızlı tahmin verir. Fiyat tutmuyorsa implied odds'a bak: tutarsan sonraki sokaklarda ne kadar kazanabilirsin?",
          links: [["/araclar#pot-odds", "Pot odds hesapla"], ["/alistirma?oyun=cash&konu=odds", "Pot odds spotları"], ["/blog/pot-odds-adim-adim", "Yazıyı oku"]],
        },
        {
          title: "Açılış aralıkları",
          text: "Arkanda ne kadar çok oyuncu varsa o kadar sıkı açarsın. 6-max'te UTG yaklaşık her 7 elden 1'ini, buton ise 10 elden 4'ünden fazlasını açar. Limp yerine raise ile girmek inisiyatifi sana verir. Range matrisinde pozisyonlar arasında geçiş yapıp farkı gör, sonra kendi aralığını işaretleyip karşılaştır.",
          links: [["/range", "Range matrisi"], ["/alistirma?oyun=cash&konu=acilis", "Açılış alıştırması"]],
        },
        {
          title: "Blind savunması",
          text: "BB'de karar üç soruya iner: fiyat (ne kadar equity gerekiyor), açanın aralığı (UTG dar, buton geniş açar) ve pozisyon dışında equity'nin ne kadarını kullanabileceğin. Suited ve bağlantılı eller ucuz fiyatlarda rahat savunulur; offsuit, kopuk ve domine olmaya yatkın eller fiyat yetse bile çoğu zaman bırakılır.",
          links: [["/alistirma?oyun=cash&konu=savunma", "Savunma spotları"], ["/blog/blind-savunmasi-fiyat-aralik-pozisyon", "Yazıyı oku"]],
        },
        {
          title: "Flop sonrası",
          text: "Board'un kime uyduğunu sor: kuru ve yüksek kartlı board'lar açılış yapana, bağlantılı orta kartlı board'lar call edene yarar. Güçlü elle value bet yap, orta güçte elle pot kontrolü düşün, blöfü fold edebilecek rakibe sakla.",
          links: [["/alistirma?oyun=cash&konu=cbet", "C-bet spotları"], ["/blog/c-bet-ne-zaman", "C-bet yazısı"]],
        },
      ]}
      suggestions={[
        "100 BB ile 200 BB arasında oyun nasıl değişir?",
        "Rake hangi elleri kârsız yapar?",
        "Blind'dan hangi ellerle savunmalıyım?",
      ]}
    />
  );
}
