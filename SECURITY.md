# Sicherheitsrichtlinien und -verbesserungen

## ✅ Implementierte Sicherheitsmassnahmen

### Authentifizierung & Autorisierung

- **JWT-basierte Authentifizierung** mit 24h Expiration
- **httpOnly Cookies** für sichere Token-Speicherung (XSS-resistent)
- **Rolle-basierte Zugriffskontrolle** (RBAC): user, category_partner, admin
- **2FA für Admin-Benutzer** mit kryptografisch sicheren Codes
- **Bcrypt Passwort-Hashing** mit 12 Runden (hochsicher)

### Input-Validierung & Daten-Integrität

- **Zod Schemas** für alle API-Inputs
- **Starke Passwort-Anforderungen**:
  - Mindestens 12 Zeichen
  - Großbuchstaben erforderlich
  - Zahlen erforderlich
  - Sonderzeichen erforderlich
- **E-Mail-Validierung** und Normalisierung
- **Type Safety** mit TypeScript überall

### Datenbankschutz

- **Parameterized Queries** (verhindert SQL-Injection)
- **Connection Pooling** (max 20, min 2)
- **Timeout Protection** (2 Sekunden für Verbindungen)
- **Slow Query Monitoring** (200ms Threshold)

### Datei-Upload-Sicherheit

- **Datei-Typ-Validierung** (MIME-Type + Extension Check)
- **Größen-Limits** pro Dateityp:
  - PDF: Max 10MB
  - Bilder: Max 5MB
  - Spreadsheets: Max 20MB
- **Sichere Dateinamen-Generierung** (UUID-basiert)
- **Directory Traversal Prevention** (Pfad-Validierung)
- **Kategorie-spezifische Uploads** (Isolation)

### Netzwerk-Sicherheit

- **HTTP Security Headers** in next.config.mjs:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (Kamera, Mikrofon, Geolocation deaktiviert)

### Rate-Limiting & DDoS-Schutz

- **Login**: Max 5 Requests pro 15 Minuten
- **Signup**: Max 10 Requests pro Stunde
- **Newsletter**: Max 5 Requests pro Stunde
- **Sponsor-Kontakte**: Max 20 Requests pro Stunde
- **IP-basierte Limitierung** mit automatischem Cleanup

### Kryptographie

- **JWT_SECRET**: 256-Bit Hex-String (MUSS in .env.local gespeichert sein)
- **Bcrypt**: 12 Runden (deutlich über Minimum von 10)
- **2FA-Codes**: Kryptografisch sichere 6-Zeichen Hex-Codes (randomBytes)

---

## 🔐 Produktions-Checkliste

Bevor du live gehst:

- [ ] **JWT_SECRET ändern**

  ```bash
  # Neuen Secret generieren:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # In .env.local speichern
  ```

- [ ] **Datenbankpasswort ändern**

  ```bash
  # PostgreSQL password wechseln
  ALTER USER postgres WITH PASSWORD 'new_secure_password_here';
  # In .env.local aktualisieren
  ```

- [ ] **SMTP konfigurieren**
  - Gmail: App-spezifisches Passwort generieren
  - SendGrid/Mailgun: API-Key eintragen

- [ ] **NEXT_PUBLIC_APP_URL auf Production-Domain setzen**

- [ ] **NODE_ENV=production setzen**

- [ ] **HTTPS/TLS aktivieren**
  - SSL-Zertifikat installieren
  - Redirect HTTP → HTTPS

- [ ] **Database Backups einrichten**

- [ ] **Monitoring aktivieren**
  - Error Tracking (Sentry)
  - Performance Monitoring
  - Security Logs

---

## 🛡️ Best Practices für Betrieb

### Regelmäßige Wartung

- **Abhängigkeiten updaten**: `npm audit` monatlich
- **Security-Patches**: Sofort nach Verfügbarkeit einspielen
- **Database Backups**: Täglich durchführen
- **Logs überprüfen**: Auf verdächtige Aktivitäten überwachen

### Monitoring

- Rate-Limit-Violations tracken
- Failed Login-Attempts überwachen
- File-Upload-Fehler monitoren
- Database-Performance tracken

### Incident Response

1. Bei Sicherheitsproblem sofort untersuchen
2. Betroffene Benutzer benachrichtigen
3. Logs analysieren
4. Fix entwickeln & deployen
5. Monitoring erhöhen

---

## 📋 Zukünftige Verbesserungen

### Phase 1 (Nächste Woche)

- [ ] Redis Caching für häufig abgerufene Daten
- [ ] Structured Logging mit Pinto/Winston
- [ ] Error Tracking mit Sentry

### Phase 2 (Monat 2)

- [ ] WAF (Web Application Firewall) integrieren
- [ ] 2FA für alle Benutzer (nicht nur Admin)
- [ ] API Rate Limiting erhöhen (DDoS-Schutz)
- [ ] Content Security Policy (CSP) Header

### Phase 3 (Monat 3+)

- [ ] OAuth 2.0 / OpenID Connect
- [ ] Audit Logging für alle Admin-Aktionen
- [ ] Penetration Testing durchführen
- [ ] SOC2 Compliance prüfen

---

## 📞 Sicherheits-Kontakt

Bei Sicherheitsproblemen:

- Nicht öffentlich posten
- Email an: security@zentral-hack.ch
- Oder direkt Ahmad kontaktieren

**Bitte NICHT auf GitHub Issues posten!**
