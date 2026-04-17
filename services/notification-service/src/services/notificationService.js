import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const BREVO_EMAIL_URL = process.env.BREVO_EMAIL_URL || 'https://api.brevo.com/v3/smtp/email';

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toHtmlContent = (body) => {
  const content = String(body || '').trim();

  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  return `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
};

const normalizeEmailAddress = (email) => {
  const value = String(email || '').trim();
  return value.includes('@') ? value : '';
};

const resolveSenderEmail = () =>
  normalizeEmailAddress(
    process.env.BREVO_SENDER_EMAIL ||
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER
  );

export const sendEmail = async (to, subject, body) => {
  try {
    const recipientEmail = normalizeEmailAddress(to);

    if (!recipientEmail) {
      return {
        success: false,
        error: 'Recipient email address is required',
        message: 'Failed to send email'
      };
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = resolveSenderEmail();
    const senderName = process.env.BREVO_SENDER_NAME || 'Telemedicine Platform';

    if (apiKey && senderEmail) {
      const response = await fetch(BREVO_EMAIL_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail
          },
          to: [
            {
              email: recipientEmail
            }
          ],
          subject,
          htmlContent: toHtmlContent(body)
        })
      });

      const responseText = await response.text();
      let result = {};

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (error) {
          result = { message: responseText };
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: result.message || result.code || 'Brevo email service error',
          message: 'Failed to send email'
        };
      }

      return {
        success: true,
        messageId: result.messageId || `brevo-email-${uuidv4()}`,
        message: 'Email sent successfully'
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('=== MOCK EMAIL SENT ===');
      console.log('To:', recipientEmail);
      console.log('Subject:', subject);
      console.log('Body:', body);
      console.log('=======================');
      
      return {
        success: true,
        messageId: `mock-email-${uuidv4()}`,
        message: 'Email sent successfully (mock)'
      };
    }
    
    return {
      success: false,
      error: 'BREVO_API_KEY and BREVO_SENDER_EMAIL are required',
      message: 'Failed to send email'
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

// Mock SMS service
export const sendSMS = async (to, body) => {
  try {
    // For development/testing, we'll mock the SMS sending
    if (process.env.NODE_ENV === 'development') {
      console.log('=== MOCK SMS SENT ===');
      console.log('To:', to);
      console.log('Body:', body);
      console.log('====================');
      
      return {
        success: true,
        messageId: `mock-sms-${uuidv4()}`,
        message: 'SMS sent successfully (mock)'
      };
    }
    
    // In production, you would integrate with a real SMS service like Twilio
    const response = await fetch(process.env.SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMS_API_KEY}`
      },
      body: JSON.stringify({
        to: to,
        body: body
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'SMS service error',
        message: 'Failed to send SMS'
      };
    }
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send SMS'
    };
  }
};
