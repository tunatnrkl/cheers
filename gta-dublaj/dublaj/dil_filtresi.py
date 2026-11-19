"""Hangi konuşmanın dublajlanacağına karar veren saf mantık (model gerektirmez, test edilebilir)."""

from __future__ import annotations

import re
from dataclasses import dataclass

TURKCE_HARFLER = re.compile(r"[çğışöüÇĞİŞÖÜı]")

# Whisper'ın sessizlik/müzik üzerinde sık uydurduğu cümleler
HALUSINASYONLAR = {
    "thank you.",
    "thank you",
    "thanks for watching!",
    "thanks for watching.",
    "thank you for watching.",
    "thank you for watching!",
    "please subscribe.",
    "subscribe to my channel.",
    "you",
    "bye.",
    "bye!",
    "...",
    "music",
    "[music]",
    "(music)",
}


@dataclass
class Karar:
    cevir: bool
    sebep: str


def dil_karari(
    tespit_dili: str,
    dil_olasiliklari: list[tuple[str, float]] | None,
    min_en: float,
    max_tr: float,
) -> Karar:
    """Whisper'ın dil tespitine göre bu parçanın İngilizce oyun diyaloğu olup olmadığına karar verir."""
    olas = dict(dil_olasiliklari or [])
    p_en = olas.get("en", 1.0 if tespit_dili == "en" else 0.0)
    p_tr = olas.get("tr", 0.0)

    if tespit_dili == "tr" or p_tr > max_tr:
        return Karar(False, f"Türkçe konuşma (tr={p_tr:.2f}) - atlandı")
    if tespit_dili != "en":
        return Karar(False, f"İngilizce değil ({tespit_dili}) - atlandı")
    if p_en < min_en:
        return Karar(False, f"İngilizce olduğundan emin değil (en={p_en:.2f}) - atlandı")
    return Karar(True, f"İngilizce (en={p_en:.2f})")


def metin_karari(metin: str, turkce_harf_kontrolu: bool = True) -> Karar:
    """Tanınan metin üzerinden ek güvenlik kontrolleri."""
    temiz = metin.strip()
    if not temiz:
        return Karar(False, "boş metin")
    if temiz.lower() in HALUSINASYONLAR:
        return Karar(False, "muhtemel Whisper halüsinasyonu")
    if not re.search(r"[A-Za-z]", temiz):
        return Karar(False, "harf içermiyor")
    if turkce_harf_kontrolu and TURKCE_HARFLER.search(temiz):
        return Karar(False, "Türkçe harf içeriyor - atlandı")
    return Karar(True, "tamam")
