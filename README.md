# Rabbit Run 🐰

Ein browser-basiertes Jump-and-Run im Pixelart-Stil – spielbar am Desktop und auf
mobilen Geräten. Der Hase läuft automatisch nach rechts, springt bei Tap, Klick
oder Leertaste, weicht Füchsen aus, überspringt Schluchten und sammelt Möhren.

## Spielregeln

- **Springen:** Tippen (Touch), Klicken oder Leertaste / Pfeil hoch / W –
  je länger gehalten wird, desto höher der Sprung
- Beim Starten wechselt das Spiel automatisch in den Vollbildmodus und
  verlässt ihn beim Game Over wieder (außer auf iOS, wo der Browser die
  Fullscreen-API nicht unterstützt)
- **Möhren** einsammeln – sie zählen als Punkte
- **Füchsen ausweichen** und **Schluchten überspringen** – Berührung oder Sturz
  bedeutet Game Over
- Mit der Zeit läuft der Hase **immer schneller**
- Der **Highscore** wird lokal im Browser gespeichert (localStorage) und beim
  Game Over mit dem aktuellen Ergebnis verglichen

Alle Grafiken sind im Code erzeugte Pixelart-Sprites – es gibt keine externen
Assets und keinen Build-Schritt.

## Version 2 🌙

Im Ordner [`v2/`](v2/) liegt **Rabbit Run 2** – die Original-Version bleibt
unverändert spielbar. Version 2 erweitert das Spiel um:

- **Doppelsprung:** In der Luft nochmal tippen ("Ohrenflattern")
- **Sturzflug:** Nach unten wischen (oder Pfeil runter / S) – damit lassen
  sich Füchse und sogar Falken **plattmachen**
- **Füchse plattspringen:** Wer von oben landet, macht den Fuchs platt und
  bekommt Extrapunkte statt Game Over
- **Falken:** Neue Gegner, die heranfliegen und sich kurz vor dem Hasen in
  den Sturzflug stürzen
- **Schwebende Plattformen** mit Möhrenreihen – hohe Plattformen sind nur
  per Doppelsprung erreichbar – und breite Schluchten mit rettender
  Insel-Plattform in der Mitte
- **Goldmöhre:** Macht kurz unbesiegbar und zieht Möhren magnetisch an
- **Combo-System:** Schnell hintereinander gesammelte Möhren zählen bis zu
  fünffach
- **Tag-Nacht-Zyklus:** Der Hase läuft durch Tag, Abendrot, Sternennacht
  (mit Mond und Glühwürmchen) und Morgengrauen – dazu Parallax-Hügel,
  Bäume und Büsche im Hintergrund
- **Soundeffekte** aus der WebAudio-API (M = stumm schalten) sowie
  Partikel, Screenshake und Squash-&-Stretch-Animationen

Auch Version 2 kommt ohne externe Assets und ohne Build-Schritt aus.

## Lokal spielen

ES-Module laden nicht über `file://`, daher einen kleinen Webserver starten:

```sh
python3 -m http.server 8000
```

Dann <http://localhost:8000> im Browser öffnen – Version 2 läuft unter
<http://localhost:8000/v2/>.

## Veröffentlichen mit GitHub Pages

1. Im Repository **Settings → Pages** öffnen
2. Unter **Build and deployment → Source** „Deploy from a branch“ wählen
3. Branch `main` (bzw. den Default-Branch) und Ordner `/ (root)` auswählen
4. Speichern – das Spiel ist danach unter
   `https://<benutzername>.github.io/<repository>/` erreichbar
