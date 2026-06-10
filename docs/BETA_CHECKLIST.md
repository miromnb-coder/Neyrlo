# Neyrlo beta checklist

Tämä lista on Neyrlon testikäyttöön valmistelua varten. Käy kohdat läpi jokaisella isolla muutoksella ennen beta-jakelua.

## 1. Paikallinen tekninen tarkistus

- Aja `npm install` uuden `expo-notifications`-riippuvuuden asentamiseksi.
- Aja `npm run typecheck`.
- Aja `npx expo start`.
- Testaa iOS-simulaattorissa tai fyysisellä iPhonella.
- Testaa Android development buildilla, jos push-ilmoituksia testataan.
- Varmista, ettei Expo Go -rajoitus sekoita push-testien tuloksia Androidilla.

## 2. Auth ja session persistointi

- Rekisteröidy uudella käyttäjällä.
- Kirjaudu ulos.
- Kirjaudu sisään.
- Sulje sovellus ja avaa uudelleen.
- Varmista, että session perusteella ohjaus menee oikein.

## 3. Ilmoituksen luonti ja julkaisu

- Luo ilmoitus luonnoksena.
- Lisää useita kuvia.
- Tarkista ilmoitus review-sivulla.
- Julkaise ilmoitus.
- Tarkista, että ilmoitus näkyy Selaa-näkymässä.
- Tarkista, että ilmoitus näkyy Kartta-näkymässä.
- Tarkista, että GPS-sijainti ei lukitu Helsinkiin.

## 4. Kuvien hallinta

- Avaa oma ilmoitus muokkaustilassa.
- Avaa Kuvat-sivu.
- Lisää kuva.
- Aseta uusi pääkuva.
- Siirrä kuvia ylös ja alas.
- Poista kuva.
- Tarkista, että pääkuva näkyy kortilla ja detail-sivulla.

## 5. Saatavuus ja varauspäivät

- Avaa oma ilmoitus muokkaustilassa.
- Avaa Saatavuus-sivu.
- Lisää saatavilla-jakso.
- Lisää suljettu jakso.
- Poista jakso.
- Tarkista detail-sivun päivämäärävalitsin toisella käyttäjällä.
- Varmista, ettei varattua jaksoa voi hyväksyä kahdesti.

## 6. Pyyntö ja chat

- Käyttäjä B lähettää pyynnön käyttäjän A ilmoitukseen.
- Tarkista, että pyyntö näkyy Viestit-tabilla.
- Tarkista, että chat avautuu.
- Hyväksy pyyntö.
- Merkitse nouto sovituksi.
- Merkitse tavara noudetuksi.
- Merkitse palautus tulossa.
- Merkitse palautetuksi.
- Merkitse tapahtuma valmiiksi.
- Tarkista, että timeline päivittyy oikein.

## 7. Ilmoituskeskus

- Avaa Ilmoitukset-sivu.
- Tarkista lukemattomat ilmoitukset.
- Avaa ilmoitus ja varmista, että se vie oikeaan näkymään.
- Merkitse kaikki luetuksi.
- Tarkista, että unread badge poistuu.

## 8. Push-ilmoitukset

- Avaa Asetukset.
- Ota push-ilmoitukset käyttöön.
- Tarkista, että `push_tokens`-tauluun syntyy token.
- Lähetä viesti toiselta käyttäjältä.
- Tarkista, että notification event syntyy.
- Tarkista, että Edge Function lähettää pushin.
- Testaa käyttäjän ilmoitusasetukset: viestit, pyynnöt, statukset ja palautusmuistutukset.

## 9. Profiili ja turvallisuus

- Muokkaa nimeä.
- Muokkaa bioa.
- Muokkaa kaupunkia / aluetta.
- Lisää profiilikuva.
- Avaa toisen käyttäjän julkinen profiili.
- Raportoi ilmoitus.
- Piilota käyttäjä.
- Palauta käyttäjä Asetukset-näkymästä.

## 10. RLS ja tietoturva

- Tarkista, ettei käyttäjä näe toisen käyttäjän yksityisiä tietoja.
- Tarkista, ettei käyttäjä voi muokata toisen ilmoitusta.
- Tarkista, ettei käyttäjä voi lisätä kuvia toisen ilmoitukseen.
- Tarkista, ettei service role -avainta ole client-koodissa tai env-tiedostoissa.
- Tarkista, että käytössä ovat vain Expo public env -muuttujat clientissä.

## 11. Julkaisupolish

- Tarkista tyhjät tilat kaikilla tabeilla.
- Tarkista loading-tilat hitaalla verkolla.
- Tarkista virheviestit ilman verkkoa.
- Tarkista pienet näytöt.
- Tarkista suuret fonttikoot.
- Tarkista iOS safe area -alueet.
- Tarkista Android back -käyttäytyminen.
- Siivoa testidata ennen beta-jakelua.
