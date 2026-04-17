# DSY3S1 Telemedicine Platform

A university telemedicine platform built with a React frontend and Node.js microservices. The system supports user authentication, patient and doctor workflows, appointment booking, online consultations, payments, and notifications.

## Project Overview

The project is organized as independent backend services plus one frontend application:

- `auth-service` handles login, registration, roles, and JWT authentication.
- `patient-service` handles patient profile and patient-related data.
- `doctor-service` handles doctor profile, availability, and doctor dashboard data.
- `appointment-service` handles appointment creation and appointment records.
- `telemedicine-service` handles consultation sessions and Jitsi Meet video rooms.
- `payment-service` handles payment and refund workflows.
- `notification-service` handles appointment, consultation, and payment notifications.
- `frontend` is the React/Vite user interface.

Video consultations use Jitsi Meet. The notification service uses third-party providers:

```text
Notification Service
|-- Email: Brevo API
`-- SMS: Twilio trial
```

## How To Install Dependencies

Install Node.js first, then install dependencies for each service and the frontend.

From the project root, run this in PowerShell:

```powershell
@(
  "services/auth-service",
  "services/patient-service",
  "services/doctor-service",
  "services/appointment-service",
  "services/telemedicine-service",
  "services/payment-service",
  "services/notification-service",
  "frontend"
) | ForEach-Object {
  Push-Location $_
  npm install
  Pop-Location
}
```

You can also install dependencies manually by opening each folder and running:

```powershell
npm install
```

## How To Run Backend Services

Run each backend service in a separate terminal.

```powershell
cd services/auth-service
npm run dev
```

```powershell
cd services/patient-service
npm run dev
```

```powershell
cd services/doctor-service
npm run dev
```

```powershell
cd services/appointment-service
npm run dev
```

```powershell
cd services/telemedicine-service
npm run dev
```

```powershell
cd services/payment-service
npm run dev
```

```powershell
cd services/notification-service
npm run dev
```

## How To Run Frontend

Open a new terminal and run:

```powershell
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Docker Setup

Docker Compose can run the full project from the root folder.

Build and start all services:

```powershell
docker compose up --build
```

Start existing containers:

```powershell
docker compose up
```

Stop containers:

```powershell
docker compose down
```

Frontend will be available at:

```text
http://localhost:5173
```

## Kubernetes Deployment Steps

The Kubernetes manifests are in the `k8s` folder and are designed for Minikube.

Start Minikube:

```powershell
minikube start --driver=docker
kubectl config use-context minikube
```

Build project images inside Minikube:

```powershell
minikube image build -t telemedicine/auth-service:local ./services/auth-service
minikube image build -t telemedicine/patient-service:local ./services/patient-service
minikube image build -t telemedicine/doctor-service:local ./services/doctor-service
minikube image build -t telemedicine/appointment-service:local ./services/appointment-service
minikube image build -t telemedicine/telemedicine-service:local ./services/telemedicine-service
minikube image build -t telemedicine/payment-service:local ./services/payment-service
minikube image build -t telemedicine/notification-service:local ./services/notification-service
minikube image build -t telemedicine/frontend:local ./frontend
```

Apply Kubernetes manifests:

```powershell
kubectl apply -k k8s
```

Check pods and services:

```powershell
kubectl get pods -n telemedicine
kubectl get services -n telemedicine
```

Access the frontend locally:

```powershell
kubectl port-forward -n telemedicine svc/frontend 5173:5173
```

Then open:

```text
http://localhost:5173
```

Clean up Kubernetes resources:

```powershell
kubectl delete namespace telemedicine
```

## Environment Variables Needed

Create `.env` files inside the relevant service folders. Use your own database connection strings, JWT secret, and provider credentials.

### Auth Service

```env
PORT=5000
MONGO_URI=your_auth_database_uri
JWT_SECRET=your_jwt_secret
```

### Patient Service

```env
PORT=4001
MONGODB_URI=your_patient_database_uri
AUTH_JWT_SECRET=your_jwt_secret
APPOINTMENT_SERVICE_URL=http://localhost:4003
DOCTOR_SERVICE_URL=http://localhost:4002
TELEMEDICINE_SERVICE_URL=http://localhost:4004
```

### Doctor Service

```env
PORT=4002
MONGODB_URI=your_doctor_database_uri
AUTH_JWT_SECRET=your_jwt_secret
APPOINTMENT_SERVICE_URL=http://localhost:4003
PATIENT_SERVICE_URL=http://localhost:4001
TELEMEDICINE_SERVICE_URL=http://localhost:4004
```

### Appointment Service

```env
PORT=4003
MONGO_URI=your_appointment_database_uri
```

### Telemedicine Service

```env
PORT=4004
MONGODB_URI=your_telemedicine_database_uri
APPOINTMENT_SERVICE_URL=http://localhost:4003
VIDEO_PROVIDER=jitsi
JITSI_DOMAIN=meet.jit.si
```

### Payment Service

```env
PORT=4005
NODE_ENV=development
MONGODB_URI=your_payment_database_uri
AUTH_JWT_SECRET=your_jwt_secret
SERVICE_API_KEY=payment-service-api-key
NOTIFICATION_SERVICE_URL=http://localhost:4006
NOTIFICATION_SERVICE_API_KEY=notification-service-api-key-2024
```

### Notification Service

```env
PORT=4006
NODE_ENV=development
MONGODB_URI=your_notification_database_uri
SERVICE_API_KEY=notification-service-api-key-2024
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_trial_phone_number
```

### Frontend / Vite Proxy

```env
AUTH_SERVICE_URL=http://localhost:5000
PATIENT_SERVICE_URL=http://localhost:4001
DOCTOR_SERVICE_URL=http://localhost:4002
APPOINTMENT_SERVICE_URL=http://localhost:4003
TELEMEDICINE_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4005
NOTIFICATION_SERVICE_URL=http://localhost:4006
```

## API / Service Ports

| Service | Port | Local URL |
| --- | ---: | --- |
| Frontend | 5173 | `http://localhost:5173` |
| Auth Service | 5000 | `http://localhost:5000` |
| Patient Service | 4001 | `http://localhost:4001` |
| Doctor Service | 4002 | `http://localhost:4002` |
| Appointment Service | 4003 | `http://localhost:4003` |
| Telemedicine Service | 4004 | `http://localhost:4004` |
| Payment Service | 4005 | `http://localhost:4005` |
| Notification Service | 4006 | `http://localhost:4006` |

## How To Test The Project

1. Start all backend services and the frontend.
2. Open `http://localhost:5173`.
3. Log in with one of the test accounts below.
4. As a patient, create an appointment.
5. As a doctor, view appointment/consultation details from the doctor dashboard.
6. Join a consultation to test the Jitsi video session flow.
7. Complete payment-related actions to test payment and notification flows.

### Test Accounts

| Role | Email | Password |
| --- | --- | --- |
| Patient | `saman@gmail.com` | `qwe123QWE!@#` |
| Admin | `atharushika50@gmail.com` | `12341234` |
| Doctor | `doctor@gmail.com` | `12341234` |

## Main Telemedicine API

```text
POST  /api/sessions/appointment/:appointmentId
GET   /api/sessions/appointment/:appointmentId
POST  /api/sessions/:sessionId/events
PATCH /api/sessions/:sessionId/complete
```
