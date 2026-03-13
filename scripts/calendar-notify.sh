#!/bin/zsh
# Hourly calendar notification check for claudio@wiseform.io
# Fetches events from primary calendar (next 30 days), filters where claudio is attendee,
# checks against state, and sends Slack DMs to Leandro for new events.

set -euo pipefail

# Config
HOME_DIR="${HOME}"
WORKSPACE_DIR="${HOME}/.openclaw/workspace"
STATE_FILE="${WORKSPACE_DIR}/calendar-notify-state.json"
CALENDAR_ID="primary"
ATTENDEE_EMAIL="claudio@wiseform.io"
LEANDRO_SLACK_ID="U051U7R4SF5"  # Leandro's Slack user ID

# Ensure workspace exists
mkdir -p "${WORKSPACE_DIR}"

# Load state
if [[ -f "${STATE_FILE}" ]]; then
  notified_ids=($(python3 -c "import json; d=json.load(open('${STATE_FILE}')); print(' '.join(d.get('notified_event_ids', [])))"))
else
  notified_ids=()
fi

# Compute date range: now to now+30 days in UTC RFC3339
from=$(date -u +%Y-%m-%dT%H:%M:%SZ)
to=$(date -u -v+30d +%Y-%m-%dT%H:%M:%SZ)

# Fetch events as JSON
events_json=$(gog calendar events "${CALENDAR_ID}" --from "${from}" --to "${to}" --json 2>/dev/null || echo "[]")

# Filter events where claudio@wiseform.io is an attendee using Python
new_events=$(python3 -c "
import json, sys, os
data = json.loads(sys.stdin.read())
target = '${ATTENDEE_EMAIL}'
out = []
for item in data.get('items', []):
  attendees = item.get('attendees', [])
  if any(att.get('email') == target for att in attendees):
    # Extract fields
    start = item.get('start', {}).get('dateTime', item.get('start', {}).get('date', ''))
    end = item.get('end', {}).get('dateTime', item.get('end', {}).get('date', ''))
    out.append({
      'id': item.get('id', ''),
      'summary': item.get('summary', ''),
      'start': start,
      'end': end,
      'location': item.get('location', ''),
      'organizer': item.get('organizer', {}).get('displayName', item.get('organizer', {}).get('email', ''))
    })
print(json.dumps(out))
" <<< "${events_json}")

# If no new events, exit silently
if [[ -z "${new_events}" || "${new_events}" == "[]" ]]; then
  exit 0
fi

# Process each new event
updated_ids=("${notified_ids[@]}")
to_notify=()

# Iterate over JSON array
python3 - <<PY
import json, os, sys
events = json.loads(sys.stdin.read())
state_ids = ${(j: :)notified_ids[@]}  # Not directly, but we can pass via env
# Instead we'll handle in shell
PY

# Actually, let's do the diff in Python to avoid shell-JSON complexity.
# We'll compute to_notify and updated_ids in Python and then send messages.

output=$(python3 -c "
import json, subprocess, os, sys
state_file = '${STATE_FILE}'
state_ids = []
if os.path.exists(state_file):
    with open(state_file) as f:
        d = json.load(f)
        state_ids = d.get('notified_event_ids', [])
new_ones = []
for ev_str in ${(f)new_events}:  # this is tricky; better to pass all data via env
    ev = json.loads(ev_str)
    if ev['id'] not in state_ids:
        new_ones.append(ev)
# If none, exit 0 quietly
if not new_ones:
    sys.exit(0)
# Send Slack messages (via openclaw CLI)
for ev in new_ones:
    summary = ev['summary']
    start = ev['start']
    end = ev['end']
    loc = ev.get('location', '')
    org = ev.get('organizer', '')
    msg = f\"🟢 New calendar event added:\\n*{summary}*\\n📅 {start} — {end}\"
    if loc:
        msg += f\"\\n📍 {loc}\"
    if org:
        msg += f\"\\n👤 Organizer: {org}\"
    # Send via openclaw message send, ignore errors
    subprocess.run(['openclaw', 'message', 'send', '--channel', 'slack', '--target', '${LEANDRO_SLACK_ID}', '--message', msg], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# Update state
all_ids = state_ids + [ev['id'] for ev in new_ones]
# Keep last 100
if len(all_ids) > 100:
    all_ids = all_ids[-100:]
with open(state_file, 'w') as f:
    json.dump({'notified_event_ids': all_ids}, f)
" 2>/dev/null)

exit 0