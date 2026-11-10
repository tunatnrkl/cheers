import type { Metadata } from "next";
import { ModulePage } from "@/components/ModulePage";

export const metadata: Metadata = {
  title: "Turnuva Rehberi",
  description: "Turnuva pokerinde blind yapısı, push/fold, ICM, bubble ve final masası. Stack derinliğine göre strateji tablosu, örnek eller ve ICM hesabı.",
};

export default function Page() {
  return (
    <ModulePage
      title="Turnuva"
      lead="Blind'lar yükselir, stack'ler BB cinsinden erir ve chip'lerin değeri ödül yapısına bağlıdır. Hayatta kalmanın da bir değeri vardır."
      other={{ href: "/cash", label: "Cash game" }}
      sections={[
        {
          title: "Blind yapısı",
          text: "Turnuvada blind'lar belirli aralıklarla (blind seviyesi) artar; çoğu yapıda ante de eklenir. Stack'in chip olarak aynı kalsa bile BB cinsinden küçülür. Bu yüzden stack'ini her zaman BB ile düşün ve bir sonraki seviyede kaç BB'n kalacağını hesaba kat. Ante'ler potu büyüttüğü için çalmak daha değerli hale gelir.",
          links: [["/kutuphane?oyun=turnuva&konu=acilis", "Açılış ve çalma elleri"]],
        },
        {
          title: "Push/fold",
          text: "Kabaca 10–12 BB'nin altında en sade strateji all-in ya da fold'dur. All-in iki yoldan kazanır: herkes fold eder ya da görülür ve elin tutar. Push aralığını en çok pozisyon belirler: arkanda ne kadar az oyuncu varsa o kadar geniş itersin.",
          links: [["/range", "Push/fold aralıkları"], ["/kutuphane?oyun=turnuva&konu=pushfold", "Push/fold elleri"], ["/blog/push-fold-temelleri", "Yazıyı oku"]],
        },
        {
          title: "ICM",
          text: "ICM, stack'inin ödül havuzundaki karşılığını hesaplar. Temel sonucu: kaybettiğin chip, kazandığın chip'ten daha değerlidir. Bu yüzden ödül sıralarına yaklaşırken all-in'leri görmek için chip hesabının gerektirdiğinden daha güçlü el gerekir (risk primi).",
          links: [["/araclar#icm", "ICM hesapla"], ["/blog/icm-nedir", "Yazıyı oku"]],
        },
        {
          title: "Bubble",
          text: "Ödüle bir ya da birkaç kişi kala baskı en yüksektir. Orta stack'ler en sıkı oynaması gereken gruptur: kaybedecek çok şeyleri vardır. Chip lideri bu korkuyu geniş açılışlarla kullanır. Çok kısa stack isen, senden kısa biri varken marjinal elleri bırakıp beklemek mantıklı olabilir.",
          links: [["/kutuphane?oyun=turnuva&konu=icm", "ICM ve bubble elleri"]],
        },
        {
          title: "Final masası",
          text: "Her elenen oyuncuyla ödül sıçraması büyür; ICM kararları burada en pahalı hale gelir. Kimin kimi kapsadığına bak: seni eleyebilecek büyük stack'e karşı dikkatli, kısa stack'lere karşı rahat ol. İki kişi kaldığında (heads-up) ICM ortadan kalkar; her chip aynı değerdedir ve aralıklar çok genişler.",
        },
      ]}
      table={{
        caption: "Stack derinliğine göre genel yaklaşım",
        head: ["Stack", "Bölge", "Ne yapılır?"],
        rows: [
          ["40 BB+", "Derin", "Cash game'e yakın oyun. Küçük açılışlar, flop sonrası oyun, set ve çekiş elleri değerli."],
          ["20–40 BB", "Orta", "Küçük açılış (2–2,2 BB). 3-bet'ler çoğunlukla all-in'e yakın sonuçlanır; açtığın elle ne yapacağını önceden bil."],
          ["12–20 BB", "Resteal", "Açılışlara all-in ile karşılık vermek (resteal) güçlü silah. Açıp fold etmek pahalılaşır."],
          ["12 BB altı", "Push/fold", "All-in ya da fold. Pozisyona göre aralık; beklemek fold equity'yi eritir."],
        ],
      }}
      suggestions={[
        "ICM'i basit bir örnekle anlatır mısın?",
        "15 BB ile butonda hangi ellerle all-in demeliyim?",
        "Bubble'da chip lideriysem nasıl oynamalıyım?",
      ]}
    />
  );
}
