#!/usr/bin/env python3
import json
import subprocess
import os
import sys
from datetime import datetime, timedelta
import re

# Configuration
STATE_FILE = os.path.expanduser('~/.openclaw/workspace/email-notify-state.json')
LEANDRO_SLACK_ID = 'U051U7R4SF5'

now = datetime.now()

# Load state
try:
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
    last_check_time_str = state.get('last_check_time')
    processed_message_ids = set(state.get('processed_message_ids', []))
    if last_check_time_str:
        last_check_time = datetime.fromisoformat(last_check_time_str)
    else:
        last_check_time = None
except (FileNotFoundError, json.JSONDecodeError):
    state = {'last_check_time': None, 'processed_message_ids': []}
    last_check_time = None
    processed_message_ids = set()

# Fetch envelopes (email list) from INBOX via himalaya
# We'll get all messages and filter by date in Python since himalaya doesn't have a newer_than filter
try:
    result = subprocess.run(['himalaya', 'envelope', 'list', '--output', 'json', '--folder', 'INBOX'],
                           capture_output=True, text=True, check=True)
    envelopes = json.loads(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error listing emails: {e.stderr}", file=sys.stderr)
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"Error parsing email JSON: {e}", file=sys.stderr)
    sys.exit(1)

# envelopes is a list of dicts with keys: id, subject, from, to, date, etc.
# Filter for messages received since last check (or last 10 minutes if no state)
if last_check_time is None:
    cutoff = now - timedelta(minutes=10)
else:
    cutoff = last_check_time

new_msgs = []
for env in envelopes:
    msg_id = str(env.get('id'))
    if not msg_id or msg_id in processed_message_ids:
        continue
    # Parse date string (e.g., "Fri, 13 Mar 2026 08:15:00 GMT")
    date_str = env.get('date', '')
    try:
        # Simple datetime parsing; adjust format as needed
        email_date = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %Z')
    except Exception:
        # If date unparsable, skip or treat as recent?
        continue
    if email_date >= cutoff:
        new_msgs.append((msg_id, env))

new_count = len(new_msgs)
if new_count == 0:
    state['last_check_time'] = now.isoformat(timespec='seconds')
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)
    sys.exit(0)

# For each new email, fetch full details and send summary
for msg_id, env in new_msgs:
    try:
        get_result = subprocess.run(['himalaya', 'message', 'read', msg_id, '--format', 'plain'],
                                    capture_output=True, text=True, check=True)
        body = get_result.stdout
    except subprocess.CalledProcessError:
        body = ''
    
    frm = env.get('from', 'Unknown')
    to = env.get('to', '')
    subject = env.get('subject', '(No subject)')
    date_str = env.get('date', '')
    snippet = body[:200] if body else ''
    
    message = f"📧 *New email received*\n**From:** {frm}\n**To:** {to}\n**Subject:** {subject}\n**Date:** {date_str}\n**Snippet:** {snippet}{'...' if len(body)>200 else ''}\n\nDo you want to add anything related to this email or take action?"
    
    try:
        subprocess.run(['openclaw', 'message', 'send', '--channel', 'slack', '--target', LEANDRO_SLACK_ID, '--message', message],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        pass
    
    processed_message_ids.add(msg_id)

# Update state
state['last_check_time'] = now.isoformat(timespec='seconds')
state['processed_message_ids'] = list(processed_message_ids)[-500:]  # keep last 500
with open(STATE_FILE, 'w') as f:
    json.dump(state, f, indent=2)

print(f"Processed {new_count} new email(s).")
# Alternatively, could search inbox: 'in:inbox from:{TARGET_EMAIL} after:{after_iso}'
# But since it's sending FROM that email, the "from" filter should suffice.

cmd = ['gog', 'gmail', 'messages', 'search', query, '--json']
try:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    search_data = json.loads(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error searching emails: {e.stderr}", file=sys.stderr)
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"Error parsing email JSON: {e}", file=sys.stderr)
    sys.exit(1)

# search_data may contain messages list; per the gog skill, "messages search" returns individual messages
messages = search_data if isinstance(search_data, list) else search_data.get('messages', [])
# Dedupe by message ID
unique_msgs = {}
for msg in messages:
    msg_id = msg.get('id')
    if msg_id and msg_id not in processed_message_ids:
        unique_msgs[msg_id] = msg

new_count = len(unique_msgs)
if new_count == 0:
    # Update last_check_time and exit silently
    state['last_check_time'] = now.isoformat(timespec='seconds')
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)
    sys.exit(0)

# For each new email, get full details and send summary
for msg_id, msg in unique_msgs.items():
    # Fetch full message with headers and snippet/body
    # Use gog gmail messages get <msgId> --json
    try:
        get_cmd = ['gog', 'gmail', 'messages', 'get', msg_id, '--json']
        get_result = subprocess.run(get_cmd, capture_output=True, text=True, check=True)
        full_msg = json.loads(get_result.stdout)
    except subprocess.CalledProcessError:
        # Could not fetch, skip
        continue
    except json.JSONDecodeError:
        continue

    # Extract fields: From, To, Subject, Date, Snippet/Body
    headers = full_msg.get('payload', {}).get('headers', [])
    hdr_map = {h['name'].lower(): h['value'] for h in headers}
    frm = hdr_map.get('from', 'Unknown')
    to = hdr_map.get('to', '')
    subject = hdr_map.get('subject', '(No subject)')
    date_str = hdr_map.get('date', '')
    snippet = full_msg.get('snippet', '')
    # Body: might be in payload.parts or payload.body.data (base64url). We'll just use snippet if body decode is complex.
    # Send a concise summary to Leandro
    message = f"📧 *New email received*\n**From:** {frm}\n**To:** {to}\n**Subject:** {subject}\n**Date:** {date_str}\n**Snippet:** {snippet[:200]}{'...' if len(snippet)>200 else ''}\n\nDo you want to add anything related to this email or take action?"
    # Send Slack DM
    try:
        subprocess.run(['openclaw', 'message', 'send', '--channel', 'slack', '--target', LEANDRO_SLACK_ID, '--message', message],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        pass  # ignore failure to send
    # Mark as processed
    processed_message_ids.add(msg_id)

# Update state
state['last_check_time'] = now.isoformat(timespec='seconds')
state['processed_message_ids'] = list(processed_message_ids)[-500:]  # keep last 500 to avoid unbounded growth
with open(STATE_FILE, 'w') as f:
    json.dump(state, f, indent=2)

# Output: number of new emails processed
print(f"Processed {new_count} new email(s).")
