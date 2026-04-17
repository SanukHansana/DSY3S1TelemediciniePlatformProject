import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5000'
const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:4001'
const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:4002'
const appointmentServiceUrl =
  process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:4003'
const telemedicineServiceUrl =
  process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:4004'
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4005'
const notificationServiceUrl =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: authServiceUrl,
        changeOrigin: true,
      },
      '/admin': {
        target: authServiceUrl,
        changeOrigin: true,
      },
      '/api/patients': {
        target: patientServiceUrl,
        changeOrigin: true,
      },
      '/api/doctors': {
        target: doctorServiceUrl,
        changeOrigin: true,
      },
      '/api/appointments': {
        target: appointmentServiceUrl,
        changeOrigin: true,
      },
      '/api/sessions': {
        target: telemedicineServiceUrl,
        changeOrigin: true,
      },
      '/api/payments': {
        target: paymentServiceUrl,
        changeOrigin: true,
      },
      '/api/payment-methods': {
        target: paymentServiceUrl,
        changeOrigin: true,
      },
      '/api/refunds': {
        target: paymentServiceUrl,
        changeOrigin: true,
      },
      '/api/notifications': {
        target: notificationServiceUrl,
        changeOrigin: true,
      },
      '/api/templates': {
        target: notificationServiceUrl,
        changeOrigin: true,
      },
    },
  },
})
