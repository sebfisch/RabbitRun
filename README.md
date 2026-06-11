# Rabbit Run 🐰

Ein browser-basiertes Jump-and-Run im Pixelart-Stil – spielbar am Desktop und auf
mobilen Geräten. Der Hase läuft automatisch nach rechts, springt bei Tap, Klick
oder Leertaste, weicht Füchsen aus, überspringt Schluchten und sammelt Möhren.

## Spielregeln

- **Springen:** Tippen (Touch), Klicken oder Leertaste / Pfeil hoch / W –
  je länger gehalten wird, desto höher der Sprung
- Auf Touch-Geräten wechselt das Spiel beim ersten Tipp automatisch in den
  Vollbildmodus (außer auf iOS, wo der Browser das nicht erlaubt)
- **Möhren** einsammeln – sie zählen als Punkte
- **Füchsen ausweichen** und **Schluchten überspringen** – Berührung oder Sturz
  bedeutet Game Over
- Mit der Zeit läuft der Hase **immer schneller**
- Der **Highscore** wird lokal im Browser gespeichert (localStorage) und beim
  Game Over mit dem aktuellen Ergebnis verglichen

Alle Grafiken sind im Code erzeugte Pixelart-Sprites – es gibt keine externen
Assets und keinen Build-Schritt.

## Lokal spielen

ES-Module laden nicht über `file://`, daher einen kleinen Webserver starten:

```sh
python3 -m http.server 8000
```

Dann <http://localhost:8000> im Browser öffnen.

## Veröffentlichen mit GitHub Pages

1. Im Repository **Settings → Pages** öffnen
2. Unter **Build and deployment → Source** „Deploy from a branch“ wählen
3. Branch `main` (bzw. den Default-Branch) und Ordner `/ (root)` auswählen
4. Speichern – das Spiel ist danach unter
   `https://<benutzername>.github.io/<repository>/` erreichbar
