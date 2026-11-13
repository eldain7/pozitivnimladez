# Pozitivní Mládež — web

Statický web (HTML + obrázky + MP3 + fonty), bez buildu. Funguje na Vercel Hobby zdarma.

## Nasazení přes vercel.com (nejjednodušší)
1. Přihlas se na https://vercel.com (Hobby plán).
2. **Add New → Project**.
3. Buď nahraj tuhle složku do GitHub repozitáře a importuj ho, nebo použij Vercel CLI (níže).
4. Framework Preset: **Other**, Build Command: prázdné, Output Directory: `.` (kořen).
5. Deploy.

## Nasazení přes Vercel CLI
```
npm i -g vercel
cd pozitivni-mladez
vercel          # první nasazení (náhled)
vercel --prod   # produkce
```

## Vlastní doména
Project → Settings → Domains → přidej např. `pozitivnimladez.cz` a nastav DNS podle návodu Vercelu.

## Co doplnit před spuštěním
- Odkazy na Instagram / Facebook / Bandzone (`href="#"` v index.html).
- Odkaz na vstupenky (tlačítko v minihře a u koncertu), až se spustí prodej.
- Merch v menu (zatím `href="#"`).

## Struktura
- `index.html` — celý web (CSS + JS uvnitř)
- `img/` — fotky, logo, náhled pro sdílení (`og.jpg`)
- `audio/` — dema (MP3)
- `fonts/` — pixel fonty Jersey 10 a VT323 (SIL Open Font License)
- `vercel.json` — cache hlavičky pro statické soubory
