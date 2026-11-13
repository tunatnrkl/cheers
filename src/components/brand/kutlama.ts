// "Şerefe!" kutlamasının tetikleme kuralı. Saf fonksiyon; bileşen ve testler paylaşır.
//
// Alıştırmada kahramanın doğru ilk kararlarından oluşan seri yalnızca 5'e ve 10'a ulaştığında
// kutlanır; 10'un katlarında yeniden kutlama yok. Her eşik bir oturumda (sayfa açık kaldığı sürece)
// en fazla bir kez: seri bozulup yeniden 5'e ulaşınca tekrar kutlanmaz. Kalıcı sayaç yok (karar 4).

export const KUTLAMA_ESIKLERI = [5, 10] as const;
export type KutlamaEsigi = (typeof KUTLAMA_ESIKLERI)[number];

/**
 * Seri `seri` değerine geldiğinde kutlanacak eşiği döndürür; yoksa null.
 * `gorulen`: bu oturumda zaten kutlanmış eşikler (değiştirilmez; çağıran ekler).
 */
export function kutlamaEsigi(seri: number, gorulen: ReadonlySet<number>): KutlamaEsigi | null {
  const esik = KUTLAMA_ESIKLERI.find((e) => e === seri);
  return esik !== undefined && !gorulen.has(esik) ? esik : null;
}

/** Ekran okuyucu için kısa, sakin duyuru. Kazanç ya da ödül dili yok. */
export function kutlamaDuyurusu(esik: number): string {
  return `Şerefe! Üst üste ${esik} doğru karar.`;
}
