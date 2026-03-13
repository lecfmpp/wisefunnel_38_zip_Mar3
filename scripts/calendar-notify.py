#!/usr/bin/env python3
import json, subprocess, os, sys
from datetime import datetime, timedelta, timezone

# Config
HOME = os.path.expanduser("~")
WORKSPACE = os.path.join(HOME, ".openclaw", "workspace")
STATE_FILE = os.path.join(WORKSPACE, "calendar-notify-state.json")
CALENDAR_ID = "primary"
ATTENDEE_EMAIL = "claudio@wiseform.io"
LEANDRO_SLACK_ID = "U051U7R4SF5"  # Leandro's Slack user ID

# Ensure workspace exists
os.makedirs(WORKSPACE, exist_ok=True)

# Load state
state_ids = []
if os.path.exists(STATE_FILE):
    try:
        with open(STATE_FILE) as f:
            d = json.load(f)
            state_ids = d.get("notified_event_ids", [])
    except Exception:
        state_ids = []

# Compute date range: now UTC to now+30 days UTC
now = datetime.now(timezone.utc)
from_iso = now.isoformat(timespec='seconds').replace('+00:00', 'Z')
to_dt = now + timedelta(days=30)
to_iso = to_dt.isoformat(timespec='seconds').replace('+00:00', 'Z')

# Fetch events via gog
try:
    result = subprocess.run(
        ["gog", "calendar", "events", CALENDAR_ID, "--from", from_iso, "--to", to_iso, "--json"],
        capture_output=True, text=True
    )
    events_json = result.stdout.strip()
    if not events_json:
        events_json = "[]"
    events_data = json.loads(events_json)
except Exception as e:
    # On any error, exit silently (or log to stderr for debugging)
    # print(f"Error: {e}", file=sys.stderr)
    sys.exit(0)

items = events_data.get("items", [])
# Filter events where any attendee email matches
new_events = []
for item in items:
    attendees = item.get("attendees", [])
    if any(att.get("email") == ATTENDEE_EMAIL for att in attendees):
        start_obj = item.get("start", {})
        end_obj = item.get("end", {})
        start = start_obj.get("dateTime", start_obj.get("date", ""))
        end = end_obj.get("dateTime", end_obj.get("date", ""))
        new_events.append({
            "id": item.get("id", ""),
            "summary": item.get("summary", ""),
            "start": start,
            "end": end,
            "location": item.get("location", ""),
            "organizer": item.get("organizer", {}).get("displayName", item.get("organizer", {}).get("email", ""))
        })

# Find which are new
to_notify = [ev for ev in new_events if ev["id"] not in state_ids]

if not to_notify:
    sys.exit(0)

# Send Slack DMs
for ev in to_notify:
    summary = ev["summary"]
    start = ev["start"]
    end = ev["end"]
    location = ev.get("location", "")
    organizer = ev.get("organizer", "")
    msg_parts = [f"🟢 New calendar event added:\n*{summary}*", f"📅 {start} — {end}"]
    if location:
        msg_parts.append(f"📍 {location}")
    if organizer:
        msg_parts.append(f"👤 Organizer: {organizer}")
    msg = "\n".join(msg_parts)
    # Send via openclaw message send (non-blocking)
    subprocess.Popen(
        ["openclaw", "message", "send", "--channel", "slack", "--target", LEANDRO_SLACK_ID, "--message", msg],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

# Update state
new_ids = state_ids + [ev["id"] for ev in to_notify]
if len(new_ids) > 100:
    new_ids = new_ids[-100:]
with open(STATE_FILE, "w") as f:
    json.dump({"notified_event_ids": new_ids}, f)

sys.exit(0)