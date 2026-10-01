# THE Twisted Isle Panel

Pannello web per **Twisted Isle**, server The Isle Evrima.

> Stato: base sicura e pronta per essere collegata al server. Il bot Discord esistente non viene modificato.

## Funzioni incluse

- Login Discord OAuth2
- Controllo accesso tramite ruoli Discord: `owner`, `upper staff`, `admin`
- Dashboard iniziale con stato server
- Architettura a provider per aggiungere in futuro RCON, plugin o game panel senza riscrivere il pannello
- Endpoint protetti per comandi amministrativi
- Configurazione tramite variabili d'ambiente; nessun token nel codice
- Compatibilità con un bot Discord Node.js già esistente tramite API HTTP future, senza sostituirlo

## Avvio

```bash
npm install
cp .env.example .env
npm run dev
```

Apri `http://localhost:3000`.

Per il login Discord crea un'applicazione nel Discord Developer Portal, configura OAuth2 e aggiungi come redirect URL:

```text
http://localhost:3000/auth/discord/callback
```

## Configurazione ruoli

Nel `.env` inserisci gli **ID numerici dei ruoli**, non solo i nomi:

```env
DISCORD_OWNER_ROLE_ID=...
DISCORD_UPPER_STAFF_ROLE_ID=...
DISCORD_ADMIN_ROLE_ID=...
```

L'utente deve appartenere al server Discord configurato in `DISCORD_GUILD_ID`. L'accesso è concesso se possiede almeno uno dei tre ruoli.

## Integrazioni future

Al momento il pannello usa un provider mock per non fingere una connessione al server che non è ancora configurata. Quando avrai RCON o un plugin, si aggiungerà un adapter in `src/providers/` implementando `GameServerProvider`.

**Non inserire mai** token del bot, client secret, password RCON o API key nel repository. Usa `.env` e un secret manager in produzione.
