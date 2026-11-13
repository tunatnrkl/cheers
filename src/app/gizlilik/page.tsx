import type { Metadata } from "next";
import Link from "next/link";
import { Kart, NotKutusu, Rozet, SayfaBasligi, Tablo } from "@/components/ui";

// Pages sürümünde sunucu, hesap ve yapay zeka yoktur; metin KVKK şablonu olduğu için silinmez, ilgili bölüm nitelenir.
const STATIK = process.env.NEXT_PUBLIC_STATIC === "1";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "Cheers hangi verileri, hangi amaçla işler; verilerini nasıl indirir ve silersin.",
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
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <SayfaBasligi
        baslik="Gizlilik ve KVKK aydınlatma metni"
        aciklama="Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hangi verilerin neden işlendiğini sade biçimde açıklar."
      />

      <NotKutusu>
        <strong>Siteyi yayına alan için not:</strong> Bu metin bir şablondur. Yayından önce veri sorumlusunun unvanı ve
        iletişim adresi eklenmeli, metin bir hukukçuya gözden geçirtilmelidir.
      </NotKutusu>

      <Kart baslik="Hesap açmadan kullanım" baslikId="g-hesapsiz">
        <p className="mt-2">
          Siteyi hesap açmadan kullanabilirsin. Bu durumda alıştırma cevapların ve notların yalnızca kendi cihazında
          (tarayıcı belleğinde) tutulur, sunucuya gönderilmez. Tema tercihin de aynı şekilde cihazında saklanır.
        </p>
      </Kart>

      <Kart baslik="İşlenen veriler" baslikId="g-veriler">
        <Tablo className="mt-2" baslik="İşlenen veriler, amaçları ve saklama süreleri" gizliBaslik sutunlar={["Veri", "Amaç", "Süre"]} satirlar={ROWS} />
        <p className="mt-3 text-sm text-muted">
          Hukuki sebep: hesap verileri için sözleşmenin kurulması ve ifası; ilerleme verileri için açık rızan. Reklam ya da
          izleme çerezi kullanılmaz; veriler pazarlama amacıyla üçüncü kişilerle paylaşılmaz.
        </p>
      </Kart>

      <Kart
        baslik={
          <>
            Yapay zeka asistanı
            {STATIK && (
              <Rozet ton="notr" className="ml-2 align-middle font-sans">
                Bu sürümde kullanılmaz
              </Rozet>
            )}
          </>
        }
        baslikId="g-yz"
      >
        {STATIK && (
          <NotKutusu className="mt-2">
            <strong>Bu sürümde kullanılmaz:</strong> Bu sitede yapay zeka asistanı kapalıdır ve hiçbir soru ya da el bilgisi
            bir yapay zeka sağlayıcısına gönderilmez. Alıştırma masasındaki koç tarayıcında, hazır metinlerle çalışır.
            Aşağıdaki paragraf, asistanın açık olduğu sunuculu kurulumlar içindir.
          </NotKutusu>
        )}
        <p className="mt-2">
          Asistana yazdığın soru ve seçtiğin elin bilgileri, yanıt üretilebilmesi için yurt dışındaki yapay zeka
          sağlayıcısına (Anthropic) iletilir. Soruna adını, e-postanı ya da hesap kimliğini eklemeyiz. Lütfen sorularına
          kişisel bilgi yazma. Sık sorulan genel soruların yanıtları, kimlik bilgisi olmadan önbellekte tutulabilir.
        </p>
      </Kart>

      <Kart baslik="Hakların" baslikId="g-haklar">
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Erişim ve taşıma:</strong> <Link href="/profil" className="link">Profil</Link> sayfasından verilerini CSV ya da JSON olarak indirebilirsin.</li>
          <li><strong>Silme:</strong> Profil sayfasındaki “Hesabımı sil” ile hesabın, cevapların ve notların kalıcı olarak silinir.</li>
          <li><strong>Düzeltme ve itiraz:</strong> KVKK'nın 11. maddesindeki diğer hakların için veri sorumlusuna başvurabilirsin.</li>
        </ul>
      </Kart>

      <Kart baslik="Güvenlik" baslikId="g-guvenlik">
        <p className="mt-2">
          Şifreler scrypt ile özetlenerek saklanır. Oturum çerezi tarayıcı betiklerinden okunamaz (HttpOnly). API
          anahtarları yalnızca sunucuda tutulur. Tüm girdiler sunucuda doğrulanır.
        </p>
      </Kart>

      <p className="text-sm text-muted">Site 18 yaş ve üzeri kullanıcılar içindir.</p>
    </article>
  );
}
