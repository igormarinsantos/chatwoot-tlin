# Clinic Scheduler Service

Indpendent microservice for clinical scheduling, designed to integrate with Chatwoot via n8n.

## Tech Stack

- Node.js + TypeScript
- Express
- Knex (PostgreSQL)
- Node-Cron (Background triggers)

## Setup

1. `cd clinic-scheduler`
2. `npm install`
3. Configure `.env` (DATABASE_URL, WEBHOOK_SECRET)
4. `npx knex migrate:latest`
5. `npm run dev` (uses ts-node-dev)

## API Endpoints

### Availability

`GET /api/clinics/:clinicId/availability?professional_id=&procedure_id=&from=&to=`
Returns free slots calculated from rules, blocks, and appointments.

### Appointments

- `POST /api/clinics/:clinicId/holds`: Create a temporary booking.
- `POST /api/clinics/:clinicId/holds/:id/confirm`: Confirm booking with patient info and Chatwoot metadata.
- `POST /api/clinics/:clinicId/appointments/:id/cancel`: Cancel an appointment.

### Webhooks

- `POST /api/clinics/:clinicId/webhooks/subscriptions`: Subscribe n8n URLs to events.
  - Events: `appointment.confirmed`, `appointment.cancelled`, `reminder.d1`, `reminder.d0`.

## n8n Integration Guide

### 1. Inbound (Chatwoot -> Scheduler)

- **n8n Trigger**: Chatwoot Webhook (message_created).
- **Process**: Extract `contact_id`, query Scheduler for availability.
- **Action**: Offer slots to user via Chatwoot Send Message API.

### 2. Outbound (Scheduler -> n8n)

- **n8n Webhook**: Receiving events from Scheduler.
- **Verification**: Validate `X-Scheduler-Signature` using `WEBHOOK_SECRET`.
- **Logic**: For reminders, use `metadata.chatwoot_conversation_id` to send messages back to the user in Chatwoot.

## Chatwoot Metadata Pattern

When confirming an appointment, send the following in the `metadata` object:

```json
{
  "chatwoot_account_id": 1,
  "chatwoot_contact_id": 123,
  "chatwoot_conversation_id": 456,
  "source": "chatwoot"
}
```

This metadata is returned in all webhook payloads, allowing n8n to know exactly where to send the message.
