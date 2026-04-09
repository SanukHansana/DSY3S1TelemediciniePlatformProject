import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4006';
const API_KEY = 'notification-service-api-key-2024';

// Test template creation
async function testTemplateCreation() {
  try {
    console.log('Testing template creation...');
    
    const response = await fetch(`${API_BASE}/api/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-api-key': API_KEY
      },
      body: JSON.stringify({
        eventType: 'APPOINTMENT_BOOKED',
        channel: 'EMAIL',
        subject: 'Appointment Confirmed',
        bodyTemplate: 'Hello {{patient.name}}, your appointment with {{doctor.name}} is confirmed for {{appointment.date}} at {{appointment.time}}.',
        description: 'Email template for appointment booking confirmation'
      })
    });
    
    const result = await response.json();
    console.log('Template creation result:', result);
    
    if (result.success) {
      console.log('Template created successfully!');
      return result.data;
    } else {
      console.error('Template creation failed:', result.message);
    }
  } catch (error) {
    console.error('Error creating template:', error.message);
  }
}

// Test notification sending
async function testNotificationSending() {
  try {
    console.log('Testing notification sending...');
    
    const response = await fetch(`${API_BASE}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-api-key': API_KEY
      },
      body: JSON.stringify({
        recipientId: '507f1f77bcf86cd799439011',
        recipientRole: 'PATIENT',
        channel: 'EMAIL',
        eventType: 'APPOINTMENT_BOOKED',
        payload: {
          patient: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          doctor: {
            name: 'Dr. Smith'
          },
          appointment: {
            date: '2024-01-15',
            time: '10:00 AM'
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('Notification sending result:', result);
    
    if (result.success) {
      console.log('Notification sent successfully!');
    } else {
      console.error('Notification sending failed:', result.message);
    }
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
}

// Test getting templates
async function testGetTemplates() {
  try {
    console.log('Testing get templates...');
    
    const response = await fetch(`${API_BASE}/api/templates`);
    const result = await response.json();
    console.log('Get templates result:', result);
  } catch (error) {
    console.error('Error getting templates:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting API tests...\n');
  
  await testTemplateCreation();
  console.log('\n');
  
  await testNotificationSending();
  console.log('\n');
  
  await testGetTemplates();
  console.log('\n');
  
  console.log('API tests completed!');
}

runTests();
