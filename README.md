# Pozitivní Mládež — web

Web (HTML + obrázky + MP3 + fonty) s jednoduchým adminem na `/admin`. Funguje na Vercel Hobby zdarma.

## Nasazení přes vercel.com (nejjednodušší)
1. Přihlas se na https://vercel.com (Hobby plán).
2. **Add New → Project**.
3. Buď nahraj tuhle složku do GitHub repozitáře a importuj ho, nebo použij Vercel CLI (níže).
4. Framework Preset: **Other**, Build Command: prázdné, Output Directory: prázdné (kořen).
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
- Merch v menu (zatím `href="#"`).
- Odkaz na vstupenky se zadává v adminu u koncertu.

## Struktura
- `index.html` — celý web (CSS + JS uvnitř); koncerty, skladby, hero a galerii vykresluje z obsahu z adminu
- `img/` — fotky, logo, náhled pro sdílení (`og.jpg`)
- `audio/` — dema (MP3)
- `fonts/` — pixel fonty Jersey 10 a VT323 (SIL Open Font License)
- `vercel.json` — cache hlavičky pro statické soubory


## Admin (CMS) — `/admin`

Členové kapely se přihlásí na `https://tvuj-web.vercel.app/admin` a můžou:
- přidávat / upravovat / mazat **koncerty** (po datu se samy přesunou do „Odehráno“),
- nahrávat **skladby** do přehrávače (MP3/M4A/WAV, max 60 MB), přejmenovat, přeřadit, smazat,
- nahrávat **hero fotky** (klikem do fotky se nastaví, kam se vycentruje na mobilu; „Jen na mobilu“ pro fotky na výšku),
- nahrávat fotky do **galerie** s popiskem.

Změny se projeví po kliknutí na **Uložit a publikovat** — na webu do minuty, bez nového deploye.
Když dva lidi upravují zároveň, admin to pozná a zeptá se, čí verze má platit.

### Jednorázové nastavení ve Vercelu
1. **Storage → Create → Blob** → vytvoř store (např. `pm-cms`) a **připoj ho k projektu**. Vercel tím sám přidá proměnnou `BLOB_READ_WRITE_TOKEN`.
2. **Settings → Environment Variables** přidej:
   - `ADMIN_USERS` = `janek:heslo1,pavel:heslo2,martin:heslo3,tomas:heslo4`
     (jméno:heslo, oddělené čárkou; hesla dlouhá a různá)
   - `SESSION_SECRET` = libovolný dlouhý náhodný řetězec (aspoň 32 znaků), např. vygenerovaný na https://1password.com/password-generator
3. **Deployments → Redeploy** (proměnné se načtou až s novým deployem).

Přidat / odebrat člena nebo změnit heslo = upravit `ADMIN_USERS` a dát Redeploy.
Změna `SESSION_SECRET` odhlásí všechny.

### Jak to funguje
- Obsah webu je v jednom souboru `cms/content.json` ve Vercel Blob. Web si ho načte přes `/api/content`.
- Dokud admin nikdo neuložil, web bere `content.default.json` z repozitáře.
- Soubory z adminu se nahrávají rovnou z prohlížeče do Blobu (`uploads/…`), takže se nenaráží na limit velikosti požadavku.
- Fotky se v prohlížeči před nahráním zmenší (hero max 2200 px, galerie 1800 px, JPEG).
- Smazané soubory se z Blobu odstraní při uložení.

### Limity Hobby
Vercel Blob je na Hobby zdarma do limitů (úložiště cca 1 GB). Při překročení Blob přestane fungovat až na 30 dní, nic se nezaplatí — proto nahrávej skladby jako MP3 (~5 MB), ne WAV (~40 MB).

### Soubory
- `admin/index.html` — admin rozhraní
- `api/` — přihlášení (`login`, `logout`, `me`), obsah (`content`), nahrávání (`upload`)
- `content.default.json` — výchozí obsah webu
