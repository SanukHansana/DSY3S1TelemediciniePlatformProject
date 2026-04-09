# DSY3S1 Telemedicine Platform

University microservices project with a simple telemedicine flow built around:

- `appointment-service` for appointment records
- `doctor-service` with mock doctors and slots for demo use
- `telemedicine-service` for appointment-linked video room management
- React frontend for creating appointments and joining consultations

## Video Integration Choice

This project uses Jitsi Meet because it is the easiest third-party video option for a university demo. The frontend loads the Jitsi external API and the telemedicine service creates one reusable room per appointment.

## Demo Flow

1. Open the frontend.
2. Create a video appointment from `/appointments/new`.
3. Go back to the appointments page.
4. Click `Join as patient` or `Join as doctor`.
5. The frontend requests a session from `telemedicine-service` and opens the Jitsi consultation room.

## Main Service URLs

- Frontend: Vite default dev server
- Appointment service: `http://localhost:4003`
- Doctor service: `http://localhost:4002`
- Telemedicine service: `http://localhost:4004`

## Telemedicine API

- `POST /api/sessions/appointment/:appointmentId`
- `GET /api/sessions/appointment/:appointmentId`
- `POST /api/sessions/:sessionId/events`
- `PATCH /api/sessions/:sessionId/complete`

## Notes

- The doctor service uses mock data so the appointment form works without a full doctor module.
- The telemedicine service stores session data in memory for simplicity.
- `docker-compose.yml` now points the telemedicine service to the appointment service inside Docker using `http://appointment-service:4003`.
