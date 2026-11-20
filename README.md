# Räkneverkstan

Gratis träningsapp för ekvationslösning i åk 7–9. Sex nivåer, tio uppgifter per
omgång, ledtråd och hela lösningen steg för steg. Ingen inloggning, inga kakor,
ingen spårning och inga nätverksanrop – allt körs i webbläsaren och statistiken
sparas bara lokalt på enheten.

**Spela:** https://rakneverkstan.skolappar.com · En del av [Skolappar](https://www.skolappar.com) – pedagogiska appar av föräldrar · öppen källkod (MIT)

## Nivåer

| Nivå | Ekvationstyp | Exempel |
| --- | --- | --- |
| 1 | x + a = b | x + 7 = 12 |
| 2 | ax = b | 4x = 28 |
| 3 | ax + b = c | 3x + 4 = 19 |
| 4 | ax + b = cx + d | 5x + 2 = 2x + 14 |
| 5 | a(x + b) = c | 3(x + 2) = 18 |
| 6 | x² = a och bråk, till exempel 2x/3 = 4 | x² = 49 |

Uppgifterna slumpas fram i koden (ingen databas). Varje uppgift byggs baklänges
från ett heltaligt svar, så svaret går alltid att räkna ut exakt. Eleven svarar
med appens eget siffertangentbord eller med vanligt tangentbord, och svar som
`12/3`, `4,5` eller `x = 4` godkänns.

## Så fungerar en omgång

1. Välj nivå på startsidan. Korten visar antal rätt, antal försök och bästa svit
   per nivå (sparas i `localStorage` under nyckeln `rakneverkstan-v1`).
2. Svara på tio uppgifter. Efter varje svar visas rätt eller fel.
3. Vid fel: **Visa steg** visar lösningen steg för steg, **Försök igen** ger en
   ny chans. **Ledtråd** ger första steget utan att avslöja svaret.
4. Efter tio uppgifter visas resultat med antal rätt och hur det gick per nivå.

## Bygga och köra

```bash
npm install
npm run dev        # utvecklingsserver
npm run build      # bygger till dist/
npm run preview    # förhandsgranskar bygget
```

Kontrollera uppgiftsgeneratorn (2400 uppgifter, alla svar och steg räknas om):

```bash
npm run test:generator
```

Dockerfilen bygger med Node 22.

## Teknik

React 19 + TypeScript + Vite + Tailwind. Typsnittet Fredoka ligger i appen (`public/fonts/`). Inga typsnitt hämtas utifrån.
Inga externa anrop, inga kakor, ingen analys.

```
src/App.tsx                 vyer: nivåval, omgång, resultat
src/components/Practice.tsx uppgiftsskärmen med tangentbord och steg
src/components/Keypad.tsx   eget siffertangentbord
src/components/MathLine.tsx ekvationsrader med staplade bråk
src/lib/equations.ts        generator, lösare och steg-för-steg-text
src/lib/stats.ts            statistik i localStorage
scripts/check-equations.ts  egenkontroll av generatorn
```

## Docker

```bash
docker build -t rakneverkstan .
docker run --rm -p 8080:8080 rakneverkstan
```

`Dockerfile` bygger appen och serverar `dist/` med nginx på port 8080 (`deploy/nginx.conf`).

## Licens

MIT – se [LICENSE](LICENSE).
