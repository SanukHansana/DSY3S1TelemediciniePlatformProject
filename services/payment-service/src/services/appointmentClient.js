import fetch from 'node-fetch';

const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:4003';

const parseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await fetch(
      `${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    );
    const data = await parseBody(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to update appointment status');
    }

    return data;
  } catch (error) {
    console.error('Could not update appointment payment status:', error.message);
    return null;
  }
};
