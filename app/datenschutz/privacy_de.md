# DATENSCHUTZERKLÄRUNG

**Stand: Mai 2026**

<div class="spacer-lg"></div>

## Verantwortliche Instanz

Verantwortlich für die Datenbearbeitung im Sinne des Schweizer Datenschutzgesetzes (DSG):

Hochschule Luzern – Informatik \
Suurstoffi 1 \
6343 Rotkreuz \
Schweiz

**E-Mail:** [{{email-contact-hslu}}]({{email-url-contact-hslu}}) \
**Telefon:** [{{phone-contact-hslu}}]({{phone-url-contact-hslu}}) \
**Webseite:** [{{website-contact-hslu}}]({{url-contact-hslu}})

<div class="spacer-lg"></div>

## Erhobene Personendaten und Zweck der Bearbeitung

Wir bearbeiten Personendaten ausschliesslich, soweit dies für den Betrieb der Plattform und die Durchführung des Hackathons erforderlich ist.

### Registrierung und Teilnahme

Bei der Registrierung erheben wir folgende Daten:

- Vor- und Nachname
- E-Mail-Adresse
- Hochschule / Ausbildungsbetrieb (optional)
- Studiengang (optional)
- Semester (optional)
- LinkedIn-Profil-URL (optional)
- Kategoriepräferenz
- Ernährungseinschränkungen und Allergien (für Verpflegung)

**Rechtsgrundlage:** Vertragserfüllung (Durchführung des Events, Art. 6 DSG) sowie berechtigte Interessen (Sicherheit, Kommunikation).

### Authentifizierung

Zur Anmeldung und Zugangssicherung verwenden wir:

- Passwort (verschlüsselt gespeichert, bcrypt)
- Zwei-Faktor-Authentifizierung (2FA) per E-Mail-Code
- Sitzungscookies (httpOnly, technisch notwendig)

**Rechtsgrundlage:** Berechtigtes Interesse (Plattformsicherheit).

### Newsletter

Falls Sie sich für den Newsletter anmelden, speichern wir Ihre E-Mail-Adresse für den Versand von Informationen zum Event.

**Rechtsgrundlage:** Einwilligung (Art. 6 Abs. 6 DSG). Die Einwilligung kann jederzeit widerrufen werden.

### Hochgeladene Dateien und GitHub-Repositories

Im Rahmen der Teamarbeit können Teilnehmende Dateien und Repository-Links auf der Plattform speichern. Diese Daten werden ausschliesslich für die Durchführung des Hackathons verwendet.

**Rechtsgrundlage:** Vertragserfüllung.

### Web-Push-Benachrichtigungen

Während des Events bieten wir optional Browser-Push-Benachrichtigungen an. Wenn Sie diese aktivieren, speichern wir ein verschlüsseltes Browser-Abonnement-Token (PushSubscription) sowie den zugehörigen Endpunkt Ihres Browsers. Diese Daten werden ausschliesslich für den Versand von Event-Benachrichtigungen (z.B. Zeitplan-Updates, Ankündigungen) verwendet.

- Das Abonnement kann jederzeit in den Browser-Einstellungen widerrufen werden.
- Push-Subscriptions werden unmittelbar nach Eventende gelöscht.

**Rechtsgrundlage:** Einwilligung (explizite Browser-Berechtigung, Art. 6 Abs. 6 DSG).

### Serverprotokolle

Beim Aufruf unserer Website werden technische Zugriffsdaten (IP-Adresse, Browser-Typ, Zeitstempel) durch unseren Hostinganbieter gespeichert. Diese werden nicht mit personenbezogenen Daten verknüpft.

**Rechtsgrundlage:** Berechtigtes Interesse (Betrieb und Sicherheit).

<div class="spacer-lg"></div>

## Auftragsbearbeiter und Drittdienste

Zur Bereitstellung unserer Plattform setzen wir folgende Dienstleister ein, welche Personendaten in unserem Auftrag bearbeiten können:

| Dienstleister                 | Zweck                              | Sitz                              |
| ----------------------------- | ---------------------------------- | --------------------------------- |
| **Vercel Inc.**               | Hosting der Webanwendung           | USA (Daten in Frankfurt, EU)      |
| **Neon Inc.**                 | Betrieb der Datenbank (PostgreSQL) | USA (Daten in Frankfurt, EU)      |
| **Microsoft Corporation**     | E-Mail-Versand via Microsoft 365   | USA                               |
| **Vercel Blob (Vercel Inc.)** | Speicherung hochgeladener Dateien  | USA (Daten in Frankfurt, EU)      |

Mit allen Auftragsbearbeitern bestehen vertragliche Vereinbarungen zum Schutz Ihrer Personendaten.

<div class="spacer-lg"></div>

## Internationale Datenübermittlung

Einige der oben genannten Dienstleister haben ihren Sitz in den USA. Die Datenübermittlung in die USA erfolgt gestützt auf die Standardvertragsklauseln der Europäischen Kommission (SCC) sowie bei Bedarf auf weitere geeignete Garantien gemäss Art. 16 DSG. Die USA bieten keinen dem schweizerischen Recht vergleichbaren gesetzlichen Datenschutz; wir haben jedoch vertragliche Massnahmen getroffen, um ein angemessenes Schutzniveau sicherzustellen.

<div class="spacer-lg"></div>

## Datensicherheit

Wir schützen Ihre Personendaten durch folgende technische und organisatorische Massnahmen:

- Verschlüsselte Übertragung via HTTPS/TLS
- Passwörter werden mit bcrypt (Kostenfaktor 12) gehasht gespeichert
- 2FA-Codes werden gehasht in der Datenbank gespeichert
- Authentifizierungs-Tokens in httpOnly-Cookies (Schutz vor XSS)
- Zwei-Faktor-Authentifizierung für administrative Zugänge
- Zugriffsbeschränkungen nach dem Least-Privilege-Prinzip

<div class="spacer-lg"></div>

## Cookies

Diese Website verwendet ausschliesslich technisch notwendige Cookies für die Authentifizierung (Sitzungsverwaltung). Es werden keine Tracking- oder Marketing-Cookies eingesetzt. Eine Einwilligung ist für diese Cookies nicht erforderlich.

<div class="spacer-lg"></div>

## Aufbewahrungsdauer

Personendaten werden gelöscht, sobald der Zweck der Bearbeitung entfällt:

- **Kontodaten und Registrierungsdaten:** Spätestens 12 Monate nach Eventende, sofern keine gesetzliche Aufbewahrungspflicht besteht.
- **2FA-Codes und Aktions-Tokens:** Automatisch nach Ablauf der Gültigkeitsdauer (15 Minuten) oder nach Verwendung.
- **Newsletter-Abonnement:** Bis zum Widerruf der Einwilligung.
- **Push-Subscriptions:** Unmittelbar nach Eventende.
- **Serverprotokolle:** Gemäss den Aufbewahrungsfristen des Hostinganbieters (in der Regel 30 Tage).

<div class="spacer-lg"></div>

## Ihre Rechte

Sie haben nach dem Schweizer DSG folgende Rechte:

- **Auskunftsrecht (Art. 25 DSG):** Sie können jederzeit Auskunft über die zu Ihrer Person gespeicherten Daten verlangen.
- **Recht auf Berichtigung (Art. 32 DSG):** Sie können die Berichtigung unrichtiger Daten verlangen.
- **Recht auf Löschung:** Sie können die Löschung Ihrer Daten verlangen, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Die Kontolöschung ist direkt über die Plattform unter «Profileinstellungen» möglich.
- **Recht auf Datenherausgabe (Art. 28 DSG):** Sie können verlangen, dass Ihre Daten in einem gängigen Format herausgegeben werden.
- **Widerspruchsrecht:** Sie können der Datenbearbeitung aus berechtigtem Interesse widersprechen.
- **Widerruf der Einwilligung:** Eine erteilte Einwilligung (z.B. für den Newsletter) kann jederzeit widerrufen werden.

Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: [{{email-contact-hslu}}]({{email-url-contact-hslu}})

Sie haben zudem das Recht, beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) Beschwerde einzureichen: [www.edoeb.admin.ch](https://www.edoeb.admin.ch)

<div class="spacer-lg"></div>

## Keine automatisierte Einzelentscheidung

Wir treffen keine automatisierten Einzelentscheidungen, die rechtliche oder ähnlich erhebliche Auswirkungen auf Sie haben.

<div class="spacer-lg"></div>

## Änderungen dieser Datenschutzerklärung

Diese Datenschutzerklärung kann angepasst werden. Massgeblich ist stets die auf der Website publizierte Fassung. Bei wesentlichen Änderungen werden registrierte Teilnehmende per E-Mail informiert.
