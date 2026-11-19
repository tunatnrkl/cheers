"""Konuşma tanıma (Whisper) ve çeviri (MarianMT) sarmalayıcıları."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .dil_filtresi import Karar, dil_karari, metin_karari


def cuda_var_mi() -> bool:
    try:
        import torch

        return torch.cuda.is_available()
    except Exception:
        return False


@dataclass
class TanimaSonucu:
    karar: Karar
    metin: str = ""
    dil: str = ""


class Tanima:
    def __init__(self, model: str, cihaz: str, hesap_tipi: str, beam_size: int, filtre: dict):
        from faster_whisper import WhisperModel

        if cihaz == "auto":
            cihaz = "cuda" if cuda_var_mi() else "cpu"
        if hesap_tipi == "default":
            hesap_tipi = "float16" if cihaz == "cuda" else "int8"
        self.cihaz = cihaz
        self.model = WhisperModel(model, device=cihaz, compute_type=hesap_tipi)
        self.beam_size = beam_size
        self.filtre = filtre

    def tani(self, ses: np.ndarray) -> TanimaSonucu:
        parcalar, bilgi = self.model.transcribe(
            ses,
            language=None,  # dili Whisper tespit etsin; Türkçe ise hiç çözümleme yapmayacağız
            beam_size=self.beam_size,
            condition_on_previous_text=False,
            vad_filter=False,
            without_timestamps=True,
        )
        karar = dil_karari(
            bilgi.language,
            bilgi.all_language_probs,
            self.filtre.get("min_ingilizce_olasiligi", 0.6),
            self.filtre.get("max_turkce_olasiligi", 0.15),
        )
        if not karar.cevir:
            return TanimaSonucu(karar, dil=bilgi.language)

        metinler = []
        for p in parcalar:  # çözümleme burada (tembel) yapılır
            if p.no_speech_prob > 0.6 and p.avg_logprob < -1.0:
                continue
            metinler.append(p.text.strip())
        metin = " ".join(m for m in metinler if m)
        return TanimaSonucu(
            metin_karari(metin, self.filtre.get("turkce_harf_kontrolu", True)), metin, bilgi.language
        )


class Ceviri:
    def __init__(self, model: str, cihaz: str):
        import torch
        from transformers import MarianMTModel, MarianTokenizer

        if cihaz == "auto":
            cihaz = "cuda" if cuda_var_mi() else "cpu"
        self.torch = torch
        self.cihaz = cihaz
        self.tokenizer = MarianTokenizer.from_pretrained(model)
        self.model = MarianMTModel.from_pretrained(model).to(cihaz).eval()

    def cevir(self, metin: str) -> str:
        with self.torch.no_grad():
            girdi = self.tokenizer([metin], return_tensors="pt", truncation=True, max_length=256)
            girdi = {k: v.to(self.cihaz) for k, v in girdi.items()}
            cikti = self.model.generate(**girdi, num_beams=4, max_new_tokens=256)
        return self.tokenizer.decode(cikti[0], skip_special_tokens=True).strip()
