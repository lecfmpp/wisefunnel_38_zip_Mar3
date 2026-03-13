#!/usr/bin/env python3
import json, subprocess, os, sys
from datetime import datetime, timedelta, timezone

HOME = os.path.expanduser("~")
CALENDAR_ID = "primary"
LEANDRO_SLACK_ID = "U051U7R4SF5"

# Fetch events for next 24 hours
now = datetime.now(timezone.utc)
from_iso = now.isoformat(timespec='seconds').replace('+00:00', 'Z')
to_dt = now + timedelta(days=1)
to_iso = to_dt.isoformat(timespec='seconds').replace('+00:00', 'Z')

try:
    result = subprocess.run(
        ["gog", "calendar", "events", CALENDAR_ID, "--from", from_iso, "--to", to_iso, "--json"],
        capture_output=True, text=True
    )
    events_json = result.stdout.strip() or "[]"
    events_data = json.loads(events_json)
except Exception:
    sys.exit(0)

items = events_data.get("items", [])

# If no events, send a no-events message? Or do nothing? We'll send a short summary anyway.
if not items:
    msg = "📅 Daily Calendar Review — No events scheduled for the next 24 hours."
    subprocess.Popen(
        ["openclaw", "message", "send", "--channel", "slack", "--target", LEANDRO_SLACK_ID, "--message", msg],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    sys.exit(0)

# Build message
date_str = now.strftime("%A, %B %d, %Y")
msg_lines = [f"📅 Daily Calendar Review — {date_str}", ""]
for item in items:
    summary = item.get("summary", "No title")
    start_obj = item.get("start", {})
    end_obj = item.get("end", {})
    start = start_obj.get("dateTime", start_obj.get("date", ""))
    end = end_obj.get("dateTime", end_obj.get("date", ""))
    # Simplify times to something like "9:00 AM — 10:00 AM"
    try:
        # Parse ISO to time only
        start_time = datetime.fromisoformat(start.replace('Z', '+00:00')).strftime("%-I:%M %p") if start else ""
        end_time = datetime.fromisoformat(end.replace('Z', '+00:00')).strftime("%-I:%M %p") if end else ""
        time_str = f"{start_time} — {end_time}" if start_time and end_time else f"{start} — {end}"
    except Exception:
        time_str = f"{start} — {end}"
    location = item.get("location", "")
    organizer = item.get("organizer", {}).get("displayName", item.get("organizer", {}).get("email", ""))
    line = f"🟢 *{summary}*\n📅 {time_str}"
    if location:
        line += f"\n📍 {location}"
    if organizer:
        line += f"\n👤 Organizer: {organizer}"
    msg_lines.append(line)
    msg_lines.append("")  # blank line

msg_lines.append("Anything you'd like me to change or need me to email anyone about these events? Just reply with adjustments.")
msg = "\n".join(msg_lines)

# Send
subprocess.Popen(
    ["openclaw", "message", "send", "--channel", "slack", "--target", LEANDRO_SLACK_ID, "--message", msg],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
sys.exit(0)