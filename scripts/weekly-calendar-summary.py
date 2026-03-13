#!/usr/bin/env python3
import json, subprocess, os, sys
from datetime import datetime, timedelta, timezone
from collections import defaultdict

HOME = os.path.expanduser("~")
CALENDAR_ID = "primary"
LEANDRO_SLACK_ID = "U051U7R4SF5"

# Fetch events for next 7 days
now = datetime.now(timezone.utc)
from_iso = now.isoformat(timespec='seconds').replace('+00:00', 'Z')
to_dt = now + timedelta(days=7)
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

if not items:
    msg = "📅 Weekly Calendar Summary — No events scheduled for the next 7 days."
    subprocess.Popen(
        ["openclaw", "message", "send", "--channel", "slack", "--target", LEANDRO_SLACK_ID, "--message", msg],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    sys.exit(0)

# Group events by local date (America/Toronto). We'll use UTC offset -4 (EDT) for now; adjust if needed.
# Simplify: we'll group by date part of the start time as given, but we need to convert to local date.
# Since the ISO times might be in local time with offset? Actually gog returns dateTime with timeZone? Might be with offset. We'll parse and convert to America/Toronto naive local date.
# For simplicity, we'll use the date portion of the start string if it's just a date (all-day events) or convert using offset -4 if it's timezone aware.
events_by_date = defaultdict(list)

for item in items:
    summary = item.get("summary", "No title")
    start_obj = item.get("start", {})
    end_obj = item.get("end", {})
    start = start_obj.get("dateTime", start_obj.get("date", ""))
    end = end_obj.get("dateTime", end_obj.get("date", ""))
    # Determine date key
    date_str = ""
    try:
        if "T" in start:
            # Parse ISO with potential timezone
            dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
            # Convert to America/Toronto offset -4 (EDT). Assume DST active.
            dt_local = dt.astimezone(timezone(timedelta(hours=-4)))
            date_key = dt_local.strftime("%Y-%m-%d")
            display_date = dt_local.strftime("%A, %B %d, %Y")
            time_str = dt_local.strftime("%-I:%M %p")
        else:
            # All-day event, date only
            date_key = start
            display_date = start  # Could format better
            time_str = "All day"
    except Exception:
        date_key = start or "Unknown"
        display_date = start
        time_str = ""
    # Get end time similarly for display? Maybe just show start time and duration.
    # We'll also compute end time for time range.
    end_time_str = ""
    try:
        if "T" in end:
            dt_end = datetime.fromisoformat(end.replace('Z', '+00:00')).astimezone(timezone(timedelta(hours=-4)))
            end_time_str = dt_end.strftime("%-I:%M %p")
            # If date differs, handle? not needed.
    except:
        end_time_str = ""
    time_range = time_str
    if end_time_str:
        time_range += f" — {end_time_str}"
    location = item.get("location", "")
    events_by_date[date_key].append({
        "summary": summary,
        "time_range": time_range,
        "location": location,
        "display_date": display_date,
        "date_key": date_key
    })

# Order dates
sorted_dates = sorted(events_by_date.keys())

msg_lines = [f"📅 Weekly Calendar Summary — Next 7 days", ""]
for date_key in sorted_dates:
    events = events_by_date[date_key]
    # Use the display_date from first event (they should be same date)
    display_date = events[0]["display_date"]
    msg_lines.append(f"🗓 {display_date}")
    for ev in events:
        line = f"   🟢 *{ev['summary']}*\n   📅 {ev['time_range']}"
        if ev['location']:
            line += f"\n   📍 {ev['location']}"
        msg_lines.append(line)
        msg_lines.append("")
    msg_lines.append("")  # blank line between days

msg = "\n".join(msg_lines).strip()

subprocess.Popen(
    ["openclaw", "message", "send", "--channel", "slack", "--target", LEANDRO_SLACK_ID, "--message", msg],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
sys.exit(0)