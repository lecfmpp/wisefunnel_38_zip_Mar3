#!/bin/bash
# WhatsApp Alert Script for OpenClaw
# Sends formatted messages to your WhatsApp via wacli

# Configuration
WHATSAPP_NUMBER="+16478623292"  # Your WhatsApp number (no spaces)
# WHATSAPP_GROUP=""  # Uncomment and add group JID if using a group instead

# Send a text message
send_alert() {
    local subject="$1"
    local body="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M")

    local message="🤖 *OpenClaw Alert*\n*${subject}*\n\n${body}\n\n— ${timestamp}"

    if [ -n "$WHATSAPP_GROUP" ]; then
        wacli send text --to "$WHATSAPP_GROUP" --message "$message"
    else
        wacli send text --to "$WHATSAPP_NUMBER" --message "$message"
    fi
}

# Calendar events summary
send_calendar_summary() {
    # TODO: Integrate with your calendar system (gog, ical, etc.)
    # Example placeholder:
    local events="Today: Team standup 10am, Lunch with Alex 12:30pm"
    send_alert "📅 Calendar Summary" "$events"
}

# Email digest
send_email_digest() {
    # TODO: Integrate with your email system (himalaya, mbsync, etc.)
    local summary="• 3 new messages\n• 1 urgent from boss"
    send_alert "📧 Email Digest" "$summary"
}

# Custom quick update
send_update() {
    local update_text="$1"
    send_alert "📌 Quick Update" "$update_text"
}

# Main: route based on first argument
case "$1" in
    calendar)
        send_calendar_summary
        ;;
    email)
        send_email_digest
        ;;
    update)
        shift
        send_update "$*"
        ;;
    test)
        send_alert "✅ Test" "WhatsApp is working!"
        ;;
    *)
        echo "Usage: $0 {calendar|email|update <text>|test}"
        exit 1
        ;;
esac
