"""Konuşmacı ayırt etme ve her konuşmacıya kalıcı bir Türkçe ses atama."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from . import ORNEK_HIZI


# ---------------------------------------------------------------- ses perdesi

def ortalama_perde(ses: np.ndarray, sr: int = ORNEK_HIZI) -> float | None:
    """Otokorelasyonla sesli çerçevelerin medyan temel frekansını (Hz) tahmin eder."""
    cerceve = int(0.04 * sr)
    adim = int(0.02 * sr)
    min_gecikme = int(sr / 400)  # 400 Hz üst sınır
    max_gecikme = int(sr / 60)   # 60 Hz alt sınır
    if len(ses) < cerceve:
        return None
    enerji_esigi = 0.3 * np.sqrt(np.mean(ses**2) + 1e-12)
    pencere = np.hanning(cerceve)
    perdeler = []
    for bas in range(0, len(ses) - cerceve, adim):
        c = ses[bas : bas + cerceve]
        if np.sqrt(np.mean(c**2)) < enerji_esigi:
            continue
        c = (c - c.mean()) * pencere
        oto = np.correlate(c, c, mode="full")[cerceve - 1 :]
        if oto[0] <= 0:
            continue
        oto = oto / oto[0]
        bolge = oto[min_gecikme:max_gecikme]
        if len(bolge) == 0:
            continue
        i = int(np.argmax(bolge))
        if bolge[i] < 0.45:  # sessiz harf / gürültü
            continue
        perdeler.append(sr / (i + min_gecikme))
    if len(perdeler) < 3:
        return None
    return float(np.median(perdeler))


# ---------------------------------------------------------------- ses havuzu

@dataclass(frozen=True)
class Ses:
    isim: str
    perde: str = "+0Hz"
    hiz: str = "+0%"


def _perde_kaydir(perde: str, ek: int) -> str:
    deger = int(perde.replace("Hz", "")) + ek
    return f"{deger:+d}Hz"


class SesHavuzu:
    """Erkek/kadın havuzundan sırayla ses verir; havuz bitince perde kaydırarak çeşitlendirir."""

    def __init__(self, erkek: list[Ses], kadin: list[Ses]):
        if not erkek or not kadin:
            raise ValueError("Erkek ve kadın ses havuzları boş olamaz")
        self._havuz = {"erkek": erkek, "kadin": kadin}
        self._sayac = {"erkek": 0, "kadin": 0}

    def sonraki(self, cinsiyet: str) -> Ses:
        havuz = self._havuz[cinsiyet]
        n = self._sayac[cinsiyet]
        self._sayac[cinsiyet] += 1
        temel = havuz[n % len(havuz)]
        tur = n // len(havuz)
        if tur == 0:
            return temel
        # 2. turda +6Hz, 3. turda -6Hz, 4. turda +12Hz ...
        ek = 6 * ((tur + 1) // 2) * (1 if tur % 2 else -1)
        return Ses(temel.isim, _perde_kaydir(temel.perde, ek), temel.hiz)


# ---------------------------------------------------------------- kümeleme

@dataclass
class Konusmaci:
    no: int
    merkez: np.ndarray
    cinsiyet: str
    ses: Ses
    ornek_sayisi: int = 1
    perdeler: list[float] = field(default_factory=list)


def _normalize(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=np.float32).reshape(-1)
    return v / (np.linalg.norm(v) + 1e-9)


class KonusmaciTakip:
    """Ses izlerini (embedding) çevrimiçi kümeleyerek konuşmacıları ayırır.

    Ses izi çıkaran fonksiyon dışarıdan verilir; böylece mantık model olmadan test edilebilir.
    """

    def __init__(
        self,
        havuz: SesHavuzu,
        benzerlik_esigi: float = 0.45,
        max_konusmaci: int = 12,
        min_sure_s: float = 1.0,
        erkek_perde_siniri: float = 165.0,
    ):
        self.havuz = havuz
        self.esik = benzerlik_esigi
        self.max_konusmaci = max_konusmaci
        self.min_sure_s = min_sure_s
        self.erkek_siniri = erkek_perde_siniri
        self.konusmacilar: list[Konusmaci] = []
        self._son: Konusmaci | None = None

    def _cinsiyet(self, perde: float | None) -> str:
        if perde is None:
            return "erkek"
        return "erkek" if perde < self.erkek_siniri else "kadin"

    def _en_yakin(self, iz: np.ndarray) -> tuple[Konusmaci | None, float]:
        if not self.konusmacilar:
            return None, -1.0
        benzerlikler = [float(np.dot(iz, k.merkez)) for k in self.konusmacilar]
        i = int(np.argmax(benzerlikler))
        return self.konusmacilar[i], benzerlikler[i]

    def bul(self, iz: np.ndarray | None, sure_s: float, perde: float | None) -> Konusmaci:
        """Bu konuşmayı kimin yaptığını döndürür (gerekirse yeni konuşmacı oluşturur)."""
        cinsiyet = self._cinsiyet(perde)

        if iz is None:
            if self._son is not None:
                return self._son
            return self._yeni(np.zeros(1, dtype=np.float32), cinsiyet, perde)

        iz = _normalize(iz)
        en_yakin, benzerlik = self._en_yakin(iz)
        kisa = sure_s < self.min_sure_s

        if en_yakin is not None and (
            benzerlik >= self.esik
            or (kisa and benzerlik >= self.esik * 0.6)
            or len(self.konusmacilar) >= self.max_konusmaci
        ):
            if not kisa:  # kısa parçalar merkezi bozmasın
                n = en_yakin.ornek_sayisi
                en_yakin.merkez = _normalize(en_yakin.merkez * n + iz)
                en_yakin.ornek_sayisi = min(n + 1, 30)
                if perde is not None:
                    en_yakin.perdeler.append(perde)
            self._son = en_yakin
            return en_yakin

        if kisa and self._son is not None:
            return self._son
        return self._yeni(iz, cinsiyet, perde)

    def _yeni(self, iz: np.ndarray, cinsiyet: str, perde: float | None) -> Konusmaci:
        k = Konusmaci(
            no=len(self.konusmacilar) + 1,
            merkez=iz,
            cinsiyet=cinsiyet,
            ses=self.havuz.sonraki(cinsiyet),
            perdeler=[perde] if perde is not None else [],
        )
        self.konusmacilar.append(k)
        self._son = k
        return k


class SesIziCikarici:
    """SpeechBrain ECAPA-TDNN ile 192 boyutlu konuşmacı ses izi çıkarır."""

    def __init__(self, cihaz: str = "cpu", klasor: str = "modeller/ecapa"):
        import torch
        from speechbrain.inference.speaker import EncoderClassifier

        kwargs = {"run_opts": {"device": cihaz}}
        try:  # Windows'ta sembolik bağlantı izni olmadığı için dosyaları kopyala
            from speechbrain.utils.fetching import LocalStrategy

            kwargs["local_strategy"] = LocalStrategy.COPY
        except ImportError:
            pass
        self._torch = torch
        self._model = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb", savedir=klasor, **kwargs
        )
        self._cihaz = cihaz

    def __call__(self, ses: np.ndarray) -> np.ndarray:
        with self._torch.no_grad():
            dalga = self._torch.from_numpy(ses).float().unsqueeze(0).to(self._cihaz)
            iz = self._model.encode_batch(dalga)
        return iz.squeeze().cpu().numpy()
