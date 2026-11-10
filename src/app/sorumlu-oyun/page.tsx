import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sorumlu Oyun",
  description: "Poker Defteri 18 yaş ve üzeri içindir ve yalnızca strateji çalışmak için tasarlanmıştır. Sorumlu oyun ilkeleri ve destek kaynakları.",
};

export default function Page() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="h1">Sorumlu oyun</h1>
      <p className="lead">
        Poker Defteri bir strateji ve matematik çalışma aracıdır. Sitede gerçek parayla oyun oynanmaz, bahis önerilmez ve
        kazanç vaat edilmez. Site yalnızca <strong className="text-ink">18 yaş ve üzeri</strong> kullanıcılar içindir.
      </p>

      <section className="card">
        <h2 className="h2">İlkeler</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Oyun bir gelir kaynağı değildir. İyi oynamak, kısa vadede kazanmayı garanti etmez.</li>
          <li>Oturmadan önce süre ve bütçe sınırı koy; sınır dolunca bırak.</li>
          <li>Yalnızca kaybedildiğinde hayatını etkilemeyecek bir bütçeyle oyna. Borçla oynanmaz.</li>
          <li>Kaybı kovalamak, yani kaybettiğini geri almak için daha fazla oynamak, en pahalı alışkanlıktır.</li>
          <li>Yorgun, üzgün ya da öfkeliyken oynama. Tilt'i fark ettiğin an ara ver.</li>
          <li>Bulunduğun yerdeki yasalara uymak senin sorumluluğundadır.</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="h2">Uyarı işaretleri</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Planladığından daha uzun ya da daha yüksek tutarlarla oynamak</li>
          <li>Kaybettiğini geri almak için yeniden oynamak</li>
          <li>Oyun için borç almak ya da faturaları aksatmak</li>
          <li>Oyunu ailenden ve arkadaşlarından gizlemek</li>
          <li>İşi, okulu ya da ilişkileri ihmal etmek</li>
          <li>Oynayamadığında huzursuz ya da sinirli olmak</li>
        </ul>
        <p className="mt-3">Bunlardan biri sana tanıdık geliyorsa ara vermek ve biriyle konuşmak iyi bir adımdır.</p>
      </section>

      <section className="card border-accent">
        <h2 className="h2">Destek</h2>
        <p className="mt-2">
          <strong>Yeşilay Danışmanlık Merkezi (YEDAM)</strong>, kumar dahil bağımlılıklar için ücretsiz psikolojik ve sosyal
          destek verir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="tel:115" className="btn btn-primary btn-lg">115'i ara</a>
          <a href="https://www.yedam.org.tr" rel="noopener noreferrer" target="_blank" className="btn btn-lg">yedam.org.tr</a>
        </div>
        <p className="mt-3 text-sm text-muted">Acil bir durumda 112'yi arayabilirsin.</p>
      </section>

      <p className="text-sm text-muted">
        Konuyla ilgili yazımız: <Link href="/blog/tilt-ve-sorumlu-oyun" className="link">Tilt, varyans ve sorumlu oyun</Link>
      </p>
    </article>
  );
}
