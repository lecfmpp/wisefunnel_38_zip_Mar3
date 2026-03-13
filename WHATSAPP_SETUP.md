# WhatsApp Alerts Setup

## What I've Prepared

1. **whatsapp-alert.sh** — Main script to send alerts to WhatsApp
2. **wacli-config.json** — Configuration (your number, optional group)
3. **Cron job example** — For scheduled alerts (morning digest, event reminders)

## Your To-Do (tomorrow @ 9am)

### 1. Install wacli

```bash
brew install steipete/tap/wacli
```
*or*
```bash
go install github.com/steipete/wacli/cmd/wacli@latest
```

### 2. Authenticate

```bash
wacli auth
```
- Scan the QR code with WhatsApp → Settings → Linked Devices → Link a Device

### 3. Test the script

```bash
chmod +x whatsapp-alert.sh
./whatsapp-alert.sh test
```
You should receive a test message.

### 4. Configure your number (optional)

Edit `whatsapp-alert.sh` and update `WHATSAPP_NUMBER` if needed.
Remove spaces: `+1 647 862 3292` → `+16478623292`

### 5. Set up cron (optional)

Example: Send a daily calendar summary at 8am
```bash
crontab -e
```
Add:
```
0 8 * * * /Users/clawdio/.openclaw/workspace/whatsapp-alert.sh calendar
```

---

## Alert Types

- `./whatsapp-alert.sh calendar` — Calendar summary (you'll need to hook into your calendar)
- `./whatsapp-alert.sh email` — Email digest (hook into your email)
- `./whatsapp-alert.sh update "text"` — Quick custom update
- `./whatsapp-alert.sh test` — Test connection

## Notes

- To use a WhatsApp group instead of 1:1, uncomment `WHATSAPP_GROUP` in the script and add the group JID (find it with `wacli chats list`).
- I've left hooks for calendar/email empty — we'll connect those once your system is ready.

Questions? DM me.
