#!/usr/bin/env python3
"""
Heartbeat Digest — aggregator for email, calendar, and Slack checks.
Runs on every heartbeat and sends a summary to Leandro.
"""

import json
import subprocess
import os
import sys
from datetime import datetime, timedelta, timezone

LEANDRO_SLACK_ID = 'U051U7R4SF5'
STATE_FILE = os.path.expanduser('~/.openclaw/workspace/heartbeat-state.json')
TARGET_EMAIL = 'claudio@wiseform.io'

# Load state for email deduplication
try:
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
    processed_message_ids = set(state.get('processed_message_ids', []))
except FileNotFoundError:
    state = {'processed_message_ids': []}
    processed_message_ids = set()

sections = []

# --- 1. Email Check (Himalaya) ---
try:
    # Fetch emails from last 30 minutes
    since = datetime.now(timezone.utc) - timedelta(minutes=30)
    # Himalaya doesn't support time-based filtering easily; we'll fetch from today and filter locally
    result = subprocess.run(['himalaya', 'envelope', 'list', '--output', 'json', f'to {TARGET_EMAIL}'], capture_output=True, text=True, timeout=15)
    if result.returncode == 0:
        envelopes = json.loads(result.stdout)
        new_emails = []
        for env in envelopes:
            msg_id = env.get('id')
            if not msg_id or msg_id in processed_message_ids:
                continue
            date_str = env.get('date', '')
            try:
                msg_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                if msg_date.tzinfo is None:
                    msg_date = msg_date.replace(tzinfo=timezone.utc)
            except:
                continue
            if msg_date >= since:
                new_emails.append(env)
                processed_message_ids.add(msg_id)
        if new_emails:
            email_lines = [f"📧 Email ({len(new_emails)} new)"]
            for env in new_emails[:5]:  # limit to 5
                subject = env.get('subject', '(No subject)')
                frm = env.get('from', {}).get('name') or env.get('from', {}).get('addr', 'Unknown')
                date_short = env.get('date', '')[:16]
                email_lines.append(f"  • {date_short} — {frm}: {subject}")
            if len(new_emails) > 5:
                email_lines.append(f"  ...and {len(new_emails)-5} more")
            sections.append('\n'.join(email_lines))
        else:
            sections.append("📧 Email: No new messages")
    else:
        sections.append("📧 Email: Error checking")
except Exception as e:
    sections.append(f"📧 Email: Exception ({str(e)[:50]})")

# --- 2. Calendar Check (gog) ---
try:
    now = datetime.now(timezone.utc)
    from_iso = now.isoformat(timespec='seconds').replace('+00:00', 'Z')
    to_iso = (now + timedelta(days=2)).isoformat(timespec='seconds').replace('+00:00', 'Z')
    result = subprocess.run(['gog', 'calendar', 'events', 'primary', '--from', from_iso, '--to', to_iso, '--json'], capture_output=True, text=True, timeout=15)
    if result.returncode == 0:
        events_data = json.loads(result.stdout)
        events = events_data.get('events', [])
        # Filter events where claudio@wiseform.io is an attendee
        my_events = [e for e in events if any(a.get('email','').lower()==TARGET_EMAIL.lower() for a in e.get('attendees',[]))]
        # Sort by start time
        my_events.sort(key=lambda e: e['start'].get('dateTime', e['start'].get('date', '')))
        if my_events:
            cal_lines = [f"📅 Upcoming Events ({len(my_events)})"]
            for ev in my_events[:5]:
                summary = ev.get('summary', 'No title')[:50]
                start = ev['start'].get('dateTime', ev['start'].get('date', ''))
                # Format: convert ISO to readable short
                try:
                    dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    time_str = dt.strftime('%a %m/%d %H:%M')
                except:
                    time_str = start[:16]
                location = ev.get('location', '')
                loc_str = f" @ {location}" if location else ""
                cal_lines.append(f"  • {time_str} — {summary}{loc_str}")
            if len(my_events) > 5:
                cal_lines.append(f"  ...and {len(my_events)-5} more")
            sections.append('\n'.join(cal_lines))
        else:
            sections.append("📅 Events: None upcoming")
    else:
        sections.append("📅 Events: Error checking")
except Exception as e:
    sections.append(f"📅 Events: Exception ({str(e)[:50]})")

# --- 3. Slack Unread (placeholder) ---
# Since we don't have a direct "unread" API via openclaw message tool, we can query via Slack API if token available
# For now, we'll note it as a TODO or skip
sections.append("💬 Slack: (unread check pending implementation)")

# --- 4. System Health ---
try:
    status_out = subprocess.run(['openclaw', 'status', '--short'], capture_output=True, text=True, timeout=10).stdout.strip()
    sections.append(f"⚙️ System: {status_out}")
except:
    sections.append("⚙️ System: status check unavailable")

# Build final message
digest = "📊 *Heartbeat Digest*\n\n" + "\n\n".join(sections)

# Send to Leandro
try:
    subprocess.run(['openclaw', 'message', 'send', '--channel', 'slack', '--target', LEANDRO_SLACK_ID, '--message', digest],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
except Exception as e:
    print(f"Failed to send digest: {e}", file=sys.stderr)

# Update state
state['processed_message_ids'] = list(processed_message_ids)[-500:]
with open(STATE_FILE, 'w') as f:
    json.dump(state, f, indent=2)

# Output nothing (heartbeat ack)
sys.exit(0)
