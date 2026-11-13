import { ButonBaglanti, Ikon } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center sm:py-16">
      <p className="eyebrow">404</p>
      <h1 className="h1">Sayfa bulunamadı</h1>
      <p className="lead">Aradığın sayfa taşınmış ya da hiç olmamış olabilir.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <ButonBaglanti href="/" tur="birincil">
          <Ikon ad="ev" boyut={18} />
          Ana sayfa
        </ButonBaglanti>
        <ButonBaglanti href="/alistirma">Alıştırma masası</ButonBaglanti>
        <ButonBaglanti href="/sozluk" tur="hayalet">
          Sözlük
        </ButonBaglanti>
      </div>
    </div>
  );
}
