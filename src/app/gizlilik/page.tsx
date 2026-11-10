import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "Poker Defteri hangi verileri, hangi amaçla işler; verilerini nasıl indirir ve silersin.",
};

const ROWS = [
  ["E-posta adresi", "Hesap oluşturma ve giriş", "Hesap silinene kadar"],
  ["Şifre (yalnızca scrypt özeti)", "Kimlik doğrulama; şifrenin kendisi saklanmaz", "Hesap silinene kadar"],
  ["Google hesap kimliği ve adı (Google ile girişte)", "Kimlik doğrulama", "Hesap silinene kadar"],
  ["Alıştırma cevapları, kaydedilen eller, notlar", "İlerlemeni göstermek ve çalışma önerisi sunmak", "Hesap silinene kadar"],
  ["Oturum çerezi", "Giriş durumunu korumak (zorunlu çerez)", "30 gün"],
  ["Yapay zekaya yazdığın sorular", "Yanıt üretmek için yapay zeka sağlayıcısına iletilir", "Sitede hesabınla ilişkilendirilerek saklanmaz"],
];

export default function Page() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="h1">Gizlilik ve KVKK aydınlatma metni</h1>
      <p className="lead">
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hangi verilerin neden işlendiğini sade
        biçimde açıklar.
      </p>

      <p className="rounded-xl border border-line p-3 text-sm">
        <strong>Siteyi yayına alan için not:</strong> Bu metin bir şablondur. Yayından önce veri sorumlusunun unvanı ve
        iletişim adresi eklenmeli, metin bir hukukçuya gözden geçirtilmelidir.
      </p>

      <section className="card">
        <h2 className="h2">Hesap açmadan kullanım</h2>
        <p className="mt-2">
          Siteyi hesap açmadan kullanabilirsin. Bu durumda alıştırma cevapların ve notların yalnızca kendi cihazında
          (tarayıcı belleğinde) tutulur, sunucuya gönderilmez. Tema tercihin de aynı şekilde cihazında saklanır.
        </p>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="h2">İşlenen veriler</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Veri</th>
              <th scope="col" className="py-2 pr-3 font-medium">Amaç</th>
              <th scope="col" className="py-2 font-medium">Süre</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r[0]} className="border-b border-line align-top last:border-0">
                {r.map((c, i) => (
                  <td key={i} className="py-2 pr-3">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-muted">
          Hukuki sebep: hesap verileri için sözleşmenin kurulması ve ifası; ilerleme verileri için açık rızan. Reklam ya da
          izleme çerezi kullanılmaz; veriler pazarlama amacıyla üçüncü kişilerle paylaşılmaz.
        </p>
      </section>

      <section className="card">
        <h2 className="h2">Yapay zeka asistanı</h2>
        <p className="mt-2">
          Asistana yazdığın soru ve seçtiğin elin bilgileri, yanıt üretilebilmesi için yurt dışındaki yapay zeka
          sağlayıcısına (Anthropic) iletilir. Soruna adını, e-postanı ya da hesap kimliğini eklemeyiz. Lütfen sorularına
          kişisel bilgi yazma. Sık sorulan genel soruların yanıtları, kimlik bilgisi olmadan önbellekte tutulabilir.
        </p>
      </section>

      <section className="card">
        <h2 className="h2">Hakların</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Erişim ve taşıma:</strong> <Link href="/profil" className="link">Profil</Link> sayfasından verilerini CSV ya da JSON olarak indirebilirsin.</li>
          <li><strong>Silme:</strong> Profil sayfasındaki “Hesabımı sil” ile hesabın, cevapların ve notların kalıcı olarak silinir.</li>
          <li><strong>Düzeltme ve itiraz:</strong> KVKK'nın 11. maddesindeki diğer hakların için veri sorumlusuna başvurabilirsin.</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="h2">Güvenlik</h2>
        <p className="mt-2">
          Şifreler scrypt ile özetlenerek saklanır. Oturum çerezi tarayıcı betiklerinden okunamaz (HttpOnly). API
          anahtarları yalnızca sunucuda tutulur. Tüm girdiler sunucuda doğrulanır.
        </p>
      </section>

      <p className="text-sm text-muted">Site 18 yaş ve üzeri kullanıcılar içindir.</p>
    </article>
  );
}
