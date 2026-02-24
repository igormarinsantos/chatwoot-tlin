# Clinic Scheduler API Documentation

This service provides a decoupled appointment management system for clinics, designed to be orchestrated via n8n and integrated with Chatwoot.

## Base URL

`/api/v1/clinic_scheduler/`

## Authentication

Uses the same authentication as Chatwoot API (User/Bot tokens).

## Endpoints

### 1. Availability

`GET /clinics/:clinic_id/availability`

**Query Params:**

- `professional_id` (required)
- `procedure_id` (required)
- `from` (ISO Date, e.g. 2026-02-24)
- `to` (ISO Date)

**Response:**

```json
{
  "clinic_id": 1,
  "professional_id": 1,
  "procedure_id": 1,
  "available_slots": [
    { "start_datetime": "2026-02-24T09:00:00Z", "end_datetime": "2026-02-24T09:30:00Z" },
    ...
  ]
}
```

### 2. Appointments

`POST /clinics/:clinic_id/appointments`

**Body:**

```json
{
  "appointment": {
    "professional_id": 1,
    "procedure_id": 1,
    "start_datetime": "2026-02-24T09:00:00Z",
    "end_datetime": "2026-02-24T09:30:00Z",
    "metadata": {
      "chatwoot_contact_id": 123,
      "chatwoot_conversation_id": 456,
      "patient_phone": "+5511999999999"
    }
  }
}
```

### 3. Webhook Subscriptions

`POST /clinics/:clinic_id/webhooks/subscriptions`

**Body:**

```json
{
  "subscription": {
    "target_url": "https://n8n.your-instance.com/webhook/clinic-scheduler",
    "events": [
      "appointment.confirmed",
      "appointment.cancelled",
      "reminder.d1",
      "reminder.d0"
    ]
  }
}
```

## n8n Integration Flow

### Inbound (Chatwoot -> n8n -> Scheduler)

1. Chatwoot sends `message_created` webhook to n8n.
2. n8n extracts `contact_id` and `conversation_id`.
3. n8n calls Scheduler `/availability` or `/appointments`.
4. Scheduler returns data, n8n responds to Chatwoot conversation.

### Outbound (Scheduler -> n8n -> Chatwoot)

1. Scheduler triggers `reminder.d1` (24h before).
2. Scheduler sends POST to n8n target URL.
3. n8n receives payload with `chatwoot_conversation_id`.
4. n8n sends message to Chatwoot: "Confirma sua consulta amanhã às...?"
