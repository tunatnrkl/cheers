import type { Metadata } from "next";
import Link from "next/link";
import { ButonA, Ikon, Kart } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sorumlu Oyun",
  description: "Cheers 18 yaş ve üzeri içindir ve yalnızca strateji çalışmak için tasarlanmıştır. Sorumlu oyun ilkeleri ve destek kaynakları.",
};

export default function Page() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="h1">Sorumlu oyun</h1>
      <p className="lead -mt-4">
        Cheers bir strateji ve matematik çalışma aracıdır. Sitede gerçek parayla oyun oynanmaz, bahis önerilmez ve
        kazanç vaat edilmez. Site yalnızca <strong className="text-ink">18 yaş ve üzeri</strong> kullanıcılar içindir.
      </p>

      <Kart baslik="İlkeler" baslikId="so-ilkeler">
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Oyun bir gelir kaynağı değildir. İyi oynamak, kısa vadede kazanmayı garanti etmez.</li>
          <li>Oturmadan önce süre ve bütçe sınırı koy; sınır dolunca bırak.</li>
          <li>Yalnızca kaybedildiğinde hayatını etkilemeyecek bir bütçeyle oyna. Borçla oynanmaz.</li>
          <li>Kaybı kovalamak, yani kaybettiğini geri almak için daha fazla oynamak, en pahalı alışkanlıktır.</li>
          <li>Yorgun, üzgün ya da öfkeliyken oynama. Tilt'i fark ettiğin an ara ver.</li>
          <li>Bulunduğun yerdeki yasalara uymak senin sorumluluğundadır.</li>
        </ul>
      </Kart>

      <Kart baslik="Uyarı işaretleri" baslikId="so-isaretler">
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Planladığından daha uzun ya da daha yüksek tutarlarla oynamak</li>
          <li>Kaybettiğini geri almak için yeniden oynamak</li>
          <li>Oyun için borç almak ya da faturaları aksatmak</li>
          <li>Oyunu ailenden ve arkadaşlarından gizlemek</li>
          <li>İşi, okulu ya da ilişkileri ihmal etmek</li>
          <li>Oynayamadığında huzursuz ya da sinirli olmak</li>
        </ul>
        <p className="mt-3">Bunlardan biri sana tanıdık geliyorsa ara vermek ve biriyle konuşmak iyi bir adımdır.</p>
      </Kart>

      <Kart baslik="Destek" baslikId="so-destek" className="border-accent">
        <p className="mt-2">
          <strong>Yeşilay Danışmanlık Merkezi (YEDAM)</strong>, kumar dahil bağımlılıklar için ücretsiz psikolojik ve sosyal
          destek verir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButonA href="tel:115" tur="birincil" boyut="buyuk">
            <Ikon ad="telefon" boyut={18} />
            115'i ara
          </ButonA>
          <ButonA href="https://www.yedam.org.tr" rel="noopener noreferrer" target="_blank" boyut="buyuk">
            yedam.org.tr
            <Ikon ad="disari" boyut={16} />
            <span className="sr-only">(yeni sekmede açılır)</span>
          </ButonA>
        </div>
        <p className="mt-3 text-sm text-muted">Acil bir durumda 112'yi arayabilirsin.</p>
      </Kart>

      <p className="text-sm text-muted">
        Konuyla ilgili yazımız: <Link href="/blog/tilt-ve-sorumlu-oyun" className="link">Tilt, varyans ve sorumlu oyun</Link>
      </p>
    </article>
  );
}
