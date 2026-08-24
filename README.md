# Audioblog — daglig lyddagbog

En selvhostet lydblog på Cloudflares gratis niveau. Server-renderet, ingen
byggeproces, ingen framework-afhængigheder. Du udgiver fra telefonen.

**Hvad den kan nu**

- Én episode per dag: lyd, titel, sted, dagsnummer, et par linjer tekst
- Billeder, som skaleres i browseren før upload (sparer mobildata)
- Lydafspiller med spoling og +15 sekunder
- Tekstkommentarer fra læsere, uden login
- Ægte podcast-RSS på `/feed.xml`, så familien kan abonnere i deres podcast-app
- Lyst og mørkt tema efter systemindstilling

**Forberedt, men ikke tændt endnu:** lydkommentarer. Kolonnerne `audio_key`,
`audio_type` og `duration` ligger allerede i `comments`-tabellen, og siden viser
en afspiller, hvis der er lyd på en kommentar. Der mangler kun optageknappen og
et upload-endepunkt. Ingen databaseændring nødvendig.

---

## Sæt op — uden terminal (anbefalet)

Hele opsætningen kan klares i browseren. Fordelen er ikke kun, at du slipper
for terminalen: bagefter kan du ændre siden fra **en hvilken som helst
browser**, også fra en lånt computer i Italien. Du retter en fil på GitHub,
og Cloudflare bygger og udgiver selv.

Du skal bruge en gratis Cloudflare-konto og en gratis GitHub-konto.

**1. Opret databasen**

dash.cloudflare.com → **Storage & Databases → D1** → *Create Database*.
Kald den `audioblog`. Kopiér den **Database ID**, der vises bagefter.

**2. Opret tabellerne**

Bliv i D1, vælg din database, gå til fanen **Console**. Åbn `schema.sql`
i en teksteditor, kopiér hele indholdet ind i konsollen, og tryk *Execute*.
Under **Tables** skulle der nu stå `episodes`, `photos` og `comments`.

**3. Opret lageret**

dash.cloudflare.com → **R2**. Første gang skal R2 aktiveres, og Cloudflare
kræver et betalingskort på kontoen — også på gratisniveauet. Der trækkes
intet, så længe du er under 10 GB, og du kommer til at bruge under 1.
Tryk derefter *Create bucket* og kald den `audioblog-media`.

**4. Ret to filer på din computer**

Pak zip-filen ud og åbn `wrangler.toml` i en almindelig teksteditor.
Erstat `UDFYLD_MIG` med den Database ID, du kopierede i trin 1.
Ret samtidig `SITE_TITLE`, `SITE_TAGLINE`, `SITE_AUTHOR` og `SITE_EMAIL`.

**5. Læg koden på GitHub**

github.com → *New repository*. Kald den `audioblog`, og vælg **Private**
hvis du vil. På den tomme side: *uploading an existing file*, og træk
mappens indhold ind — inklusive `src`-mappen. Tryk *Commit changes*.

Læg aldrig din adgangsnøgle i repoet. Den hører til i trin 7.

**6. Forbind Cloudflare til repoet**

dash.cloudflare.com → **Workers & Pages** → *Create* → **Import a repository**.
Vælg dit `audioblog`-repo og godkend adgangen. Worker-navnet skal være
`audioblog`, altså det samme som `name` i `wrangler.toml`, ellers fejler
bygningen. Tryk *Deploy*.

Workers Builds er gratis med 3.000 byggeminutter om måneden. Denne side har
ingen byggeproces, så et deploy tager sekunder og bruger stort set intet.

**7. Sæt din adgangsnøgle**

Worker'en → **Settings → Variables and Secrets** → *Add*. Navn: `ADMIN_TOKEN`.
Værdi: en lang tilfældig streng. Vælg typen **Secret**, ikke Text, så den
krypteres og ikke kan læses igen. Gem den samtidig i din adgangskodemanager
— du skal bruge den første gang du åbner `/udgiv`.

Slår den ikke igennem med det samme, så tryk *Deploy* igen på Worker'en.

**Sådan ændrer du noget senere:** ret filen på github.com, tryk *Commit*.
Cloudflare bygger og udgiver automatisk. Ingen computer med Node nødvendig.

---

## Sæt op — med terminal

Hurtigere, hvis du er vant til en terminal. Kræver Node installeret.

```bash
npm install -g wrangler
wrangler login
```

**1. Opret databasen**

```bash
wrangler d1 create audioblog
```

Kommandoen udskriver et `database_id`. Kopiér det ind i `wrangler.toml`,
hvor der står `UDFYLD_MIG`.

**2. Opret tabellerne**

```bash
wrangler d1 execute audioblog --remote --file=schema.sql
```

**3. Opret lageret til lyd og billeder**

```bash
wrangler r2 bucket create audioblog-media
```

**4. Vælg din adgangsnøgle**

```bash
wrangler secret put ADMIN_TOKEN
```

Indsæt en lang, tilfældig streng. Det er den, der beskytter `/udgiv`.
Generér en med `openssl rand -base64 24`.

**5. Ret teksterne i `wrangler.toml`**

`SITE_TITLE`, `SITE_TAGLINE`, `SITE_AUTHOR`, `SITE_EMAIL`.

**6. Udgiv**

```bash
wrangler deploy
```

Du får en adresse i stil med `audioblog.dit-navn.workers.dev`. Den virker med
det samme. Vil du have dit eget domæne, kan det tilføjes i Cloudflares
kontrolpanel under Workers → Custom Domains.

---

## Sådan bruger du den

**Udgiv en dag:** gå til `/udgiv` på telefonen, indsæt adgangsnøglen én gang
(den huskes lokalt), og udfyld. Vælg lydfil, skriv tre linjer, vælg billeder,
tryk udgiv. Billederne skaleres til 1600 px i browseren, før de sendes, så en
upload på hostel-wifi tager sekunder og ikke minutter.

Læg `/udgiv` som ikon på hjemmeskærmen, så er det ét tryk væk.

**Del siden:** send forsiden til familien. Vil de have episoderne automatisk,
sender du dem `/feed.xml`, som kan indsættes i enhver podcast-app under
"tilføj via URL". Apple Podcasts og Overcast tager den direkte.

---

## Kør lokalt

```bash
npm install
wrangler d1 execute audioblog --local --file=schema.sql
echo 'ADMIN_TOKEN="testnoegle"' > .dev.vars
wrangler dev --local
```

`.dev.vars` er kun til lokal kørsel og skal aldrig committes. I produktion
kommer nøglen fra `wrangler secret put`.

---

## Hvad der er tænkt over

**Range-forespørgsler.** `/media/*` understøtter HTTP Range korrekt, både
midterudsnit, suffiks og åbne intervaller. Uden det kan man ikke spole i en
lydfil, og de fleste podcast-apps nægter at hente filen. Det er testet mod
det originale byte-indhold.

**Billedstørrelse.** Et telefonbillede fylder 3-5 MB. Siden skalerer det til
1600 px og JPEG-kvalitet 0,82 i browseren, typisk under 300 KB. Du sender
altså en tiendedel over italiensk mobildata.

**Spam.** Kommentarformularen har et skjult honningkrukke-felt, en grænse på
to links, og længdebegrænsninger. For en side, som venner og familie bruger,
er det nok. Bliver det et problem, findes kolonnen `hidden` allerede i
`comments`, så moderation kan tændes uden migrering.

**Escaping.** Al brugerinput escapes før det renderes. Testet med
script-injektion i kommentarfeltet.

**Ingen pause.** Cloudflares gratis niveau sætter ikke projektet i dvale.
Siden står som arkiv, også når turen er slut og ingen har besøgt den i
måneder.

---

## Forbrug mod det gratis niveau

| | Gratis | Otte dages rejse | Tre måneder dagligt |
|---|---|---|---|
| R2-lager | 10 GB | ~40 MB | ~600 MB |
| R2-egress | ubegrænset | — | — |
| D1-lager | 5 GB | ubetydeligt | ubetydeligt |
| Worker-kald | 100.000/dag | måske 300 | måske 300 |

Der er ingen realistisk vej til at sprænge det.

---

## Filer

```
wrangler.toml     konfiguration og sidetekster
schema.sql        databasetabeller
src/index.js      router, API, RSS, mediehåndtering
src/views.js      HTML og CSS til den offentlige side
src/admin.js      udgivelsessiden på /udgiv
```
