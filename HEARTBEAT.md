# HEARTBEAT.md

# Periodic checks during heartbeat polls

Run the unified digest script that combines email, calendar, and system status:

- `python3 ~/.openclaw/workspace/heartbeat-digest.py`
  - Fetches new email (Himalaya) from last 30 min
  - Lists upcoming calendar events (next 48h) where claudio@wiseform.io is attendee
  - Checks system health and agent status
  - Sends a summary to Leandro via Slack
  - Reports errors if any step fails
