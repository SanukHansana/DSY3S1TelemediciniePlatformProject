# Notification Service

A microservice for handling notifications in the telemedicine platform. Supports email and SMS notifications with template-based messaging.

## Features

- **Multi-channel notifications**: Email and SMS support
- **Template-based messaging**: Dynamic content with placeholder replacement
- **Notification tracking**: Status tracking and delivery monitoring
- **API security**: Service-to-service authentication
- **MongoDB integration**: Persistent storage for notifications and templates
- **Mock services**: Development-friendly email/SMS mocking

## API Endpoints

### Notifications
- `POST /api/notifications/send` - Send a notification (protected)
- `GET /api/notifications/:id` - Get notification by ID
- `GET /api/notifications/user/:recipientId` - Get notifications for a user
- `PUT /api/notifications/:id` - Update notification status

### Templates
- `POST /api/templates` - Create a new template (protected)
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get template by ID
- `PUT /api/templates/:id` - Update template (protected)
- `DELETE /api/templates/:id` - Delete template (protected)

### Health
- `GET /health` - Service health check

## Authentication

Protected endpoints require `x-service-api-key` header with the correct API key.

## Event Types

- `APPOINTMENT_BOOKED`
- `APPOINTMENT_CANCELLED`
- `APPOINTMENT_REMINDER`
- `PAYMENT_CONFIRMED`
- `PAYMENT_FAILED`
- `PRESCRIPTION_READY`
- `DOCTOR_AVAILABLE`

## Template Placeholders

Templates support `{{variable}}` placeholders that get replaced with payload data:
- Simple values: `{{patientName}}`
- Nested objects: `{{patient.name}}`
- System values: `{{currentDate}}`, `{{currentYear}}`

## Environment Variables

See `.env.example` for required environment variables.

## Database Collections

### Notifications
- recipientId, recipientRole, channel, eventType, payload, status, externalMsgId, timestamps

### NotificationTemplates
- eventType, channel, subject, bodyTemplate, isActive, description

## Usage

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Start service: `npm run dev` (development) or `npm start` (production)
4. Service runs on port 4006

## Example Send Notification Request

```bash
curl -X POST http://localhost:4006/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: your-api-key" \
  -d '{
    "recipientId": "507f1f77bcf86cd799439011",
    "recipientRole": "PATIENT",
    "channel": "EMAIL",
    "eventType": "APPOINTMENT_BOOKED",
    "payload": {
      "patient": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "doctor": {
        "name": "Dr. Smith"
      },
      "appointment": {
        "date": "2024-01-15",
        "time": "10:00 AM"
      }
    }
  }'
```
