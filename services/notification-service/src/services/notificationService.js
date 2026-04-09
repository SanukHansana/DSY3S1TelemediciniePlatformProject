import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// Mock email service configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendEmail = async (to, subject, body) => {
  try {
    // For development/testing, we'll mock the email sending
    if (process.env.NODE_ENV === 'development') {
      console.log('=== MOCK EMAIL SENT ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', body);
      console.log('=======================');
      
      return {
        success: true,
        messageId: `mock-email-${uuidv4()}`,
        message: 'Email sent successfully (mock)'
      };
    }
    
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      html: body
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
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
