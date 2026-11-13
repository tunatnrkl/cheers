# Fraunces ve Manrope dosyalarını küçültür:
# - Fraunces: SOFT=100 ve WONK=1 eksenleri sabitlenir (sitede yalnızca bu değerler kullanılıyor), wght ve opsz değişken kalır.
# - latin-ext dosyaları yalnızca Türkçe harflere indirilir (Ğ ğ İ Ş ş; ı latin dosyasında).
import os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

NM = "/home/user/cheers/node_modules/@fontsource-variable"
OUT = sys.argv[1]  # ör. src/app/fonts (fontTools ve brotli gerekir; projeye bağımlılık değildir)
os.makedirs(OUT, exist_ok=True)

TR = [0x011E, 0x011F, 0x0130, 0x015E, 0x015F]

def isle(kaynak, hedef, sabit=None, kodlar=None):
    f = TTFont(kaynak)
    if sabit:
        f = instancer.instantiateVariableFont(f, sabit, updateFontNames=False)
    if kodlar is not None:
        opt = subset.Options()
        opt.layout_features = ["*"]
        opt.name_IDs = ["*"]
        opt.notdef_outline = True
        opt.flavor = "woff2"
        s = subset.Subsetter(opt)
        s.populate(unicodes=kodlar)
        s.subset(f)
    f.flavor = "woff2"
    f.save(hedef)
    print(os.path.basename(hedef), os.path.getsize(kaynak), "->", os.path.getsize(hedef))

sabit = {"SOFT": 100, "WONK": 1}
isle(f"{NM}/fraunces/files/fraunces-latin-full-normal.woff2", f"{OUT}/fraunces-latin.woff2", sabit)
isle(f"{NM}/fraunces/files/fraunces-latin-ext-full-normal.woff2", f"{OUT}/fraunces-tr.woff2", sabit, TR)
isle(f"{NM}/manrope/files/manrope-latin-wght-normal.woff2", f"{OUT}/manrope-latin.woff2")
isle(f"{NM}/manrope/files/manrope-latin-ext-wght-normal.woff2", f"{OUT}/manrope-tr.woff2", None, TR)
