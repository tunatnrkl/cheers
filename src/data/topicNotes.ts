import type { Topic } from "./hands";

// Ara kartında gösterilen tek cümlelik hatırlatmalar. Kesin sayı yerine karar
// sorusunu hatırlatır; ayrıntı ilgili spotların gerekçelerinde.
export const TOPIC_NOTES: Record<Topic, string> = {
  acilis: "Açılış aralığı pozisyona göre genişler: arkanda ne kadar az oyuncu varsa o kadar çok el açabilirsin.",
  "3bet": "3-bet'i ya value için ya da iyi blocker'lı, oynanabilir bir blöf için yap; arada kalan eller çoğu zaman call ya da fold'dur.",
  savunma: "BB'de önce fiyata bak: açılış ne kadar küçükse savunman gereken el o kadar fazladır.",
  cbet: "C-bet öncesi sor: bu board benim aralığıma mı, rakibin call aralığına mı daha iyi uyuyor?",
  odds: "Call'un fiyatını (call / call sonrası pot) yalnızca bir sonraki kartta tutma ihtimalinle karşılaştır; iki kartlık oranı tek bahse uygulama.",
  value: "Value bet'in boyutunu, daha kötü ellerin hangi boyuta hâlâ ödeme yapacağına göre seç.",
  blof: "Bluff catch için rakibin, bahis boyutunun gerektirdiği sıklıkta blöf yapıp yapmadığını sor; sıkı oyunculara karşı çoğu zaman yapmaz.",
  spr: "SPR düşükse tek per ile stack'leri ortaya koymak kolaylaşır; SPR yüksekse büyük pot için daha güçlü el gerekir.",
  pushfold: "Kısa stack'te ilk giren olarak beklemek de bir maliyettir: blind'lar stack'ini eritirken fold equity'n azalır.",
  callshove: "All-in'e call'da elinin değil, rakibin itme aralığına karşı equity'nin gereken equity'yi geçip geçmediğine bak.",
  icm: "Ödüle yakınken kaybettiğin chip, kazandığından daha pahalıdır; call için chip hesabının istediğinden fazla equity gerekir.",
};
