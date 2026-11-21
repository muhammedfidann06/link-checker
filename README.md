# 🔗 Link Checker

**🇬🇧 English** | [🇩🇪 Deutsch](#-deutsch)

A small web tool that finds dead links on a page. Paste a URL and it lists every link on that page, how fast it answered, and which ones don't respond at all.

**Live:** https://muhammedfidann06.github.io/link-checker/

## Features

- Collects all links from a page (duplicates, anchors and `mailto:` are skipped)
- Checks up to 80 links, 6 at a time
- Marks each link as reachable, slow (> 3 s) or unreachable
- Filter buttons and a progress bar
- No build step, no framework, just HTML, CSS and JavaScript

## How it works

1. The page is read with the [Microlink API](https://microlink.io), which returns every `href` on it.
2. Relative links are resolved against the page URL.
3. Each link is requested from the browser in `no-cors` mode. The response itself can't be read, but if the request fails or times out, the link is dead.

Because everything runs in the browser, it can be hosted for free on GitHub Pages.

## Limitations

- `no-cors` requests can't see status codes, so a page that returns **404 is still counted as reachable**. The tool catches dead domains, timeouts and refused connections.
- Plain `http://` links can't be requested from an `https` page, so they're only flagged.
- The free Microlink plan allows about 50 page reads per day.

## Run locally

```bash
git clone https://github.com/muhammedfidann06/link-checker.git
```

Then open `index.html` in your browser.

---

## 🇩🇪 Deutsch

Ein kleines Web-Tool, das tote Links auf einer Seite findet. URL einfügen, und es zeigt alle Links der Seite, wie schnell sie antworten und welche gar nicht reagieren.

**Live:** https://muhammedfidann06.github.io/link-checker/

### Funktionen

- Sammelt alle Links einer Seite (Duplikate, Anker und `mailto:` werden übersprungen)
- Prüft bis zu 80 Links, jeweils 6 gleichzeitig
- Markiert jeden Link als erreichbar, langsam (> 3 s) oder nicht erreichbar
- Filter-Buttons und Fortschrittsbalken
- Kein Build-Schritt, kein Framework, nur HTML, CSS und JavaScript

### Funktionsweise

1. Die Seite wird über die [Microlink API](https://microlink.io) gelesen, die alle `href`-Werte zurückgibt.
2. Relative Links werden anhand der Seiten-URL aufgelöst.
3. Jeder Link wird im Browser im `no-cors`-Modus angefragt. Die Antwort selbst ist nicht lesbar, aber schlägt die Anfrage fehl oder läuft sie ab, ist der Link tot.

### Einschränkungen

- `no-cors`-Anfragen sehen keine Statuscodes, eine **404-Seite gilt also trotzdem als erreichbar**. Erkannt werden tote Domains, Timeouts und abgelehnte Verbindungen.
- Reine `http://`-Links können von einer `https`-Seite nicht angefragt werden und werden nur markiert.
- Der kostenlose Microlink-Plan erlaubt etwa 50 Seitenabrufe pro Tag.
