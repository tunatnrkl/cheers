import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="h1">Sayfa bulunamadı</h1>
      <p className="lead mt-2">Aradığın sayfa taşınmış ya da hiç olmamış olabilir.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">Ana sayfa</Link>
        <Link href="/alistirma" className="btn">Alıştırma masası</Link>
      </div>
    </div>
  );
}
