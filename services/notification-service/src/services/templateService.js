export const processTemplate = (template, payload) => {
  let { subject, bodyTemplate } = template;
  
  // Replace placeholders in subject (for emails)
  if (subject) {
    subject = replacePlaceholders(subject, payload);
  }
  
  // Replace placeholders in body
  const body = replacePlaceholders(bodyTemplate, payload);
  
  return {
    subject: subject || '',
    body
  };
};

const replacePlaceholders = (template, payload) => {
  // Replace {{variable}} placeholders with actual values
  let processed = template;
  
  // Handle nested objects in payload (e.g., patient.name, doctor.name)
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects
      Object.keys(value).forEach(nestedKey => {
        const nestedValue = value[nestedKey];
        const nestedPlaceholder = `{{${key}.${nestedKey}}}`;
        processed = processed.replace(new RegExp(nestedPlaceholder, 'g'), nestedValue);
      });
    } else {
      // Handle simple values
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    }
  });
  
  // Handle common date formatting
  const currentDate = new Date().toISOString();
  processed = processed.replace(/{{currentDate}}/g, currentDate);
  processed = processed.replace(/{{currentYear}}/g, new Date().getFullYear());
  
  return processed;
};

// Template validation helper
export const validateTemplate = (template, payload) => {
  const { subject, bodyTemplate } = template;
  const requiredPlaceholders = [];
  
  // Find all placeholders in template
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  let match;
  
  const checkPlaceholders = (text) => {
    while ((match = placeholderRegex.exec(text)) !== null) {
      requiredPlaceholders.push(match[1]);
    }
  };
  
  if (subject) checkPlaceholders(subject);
  checkPlaceholders(bodyTemplate);
  
  // Check if all required placeholders are available in payload
  const missingPlaceholders = requiredPlaceholders.filter(placeholder => {
    const keys = placeholder.split('.');
    let value = payload;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return true; // Missing placeholder
      }
    }
    
    return false;
  });
  
  return {
    isValid: missingPlaceholders.length === 0,
    missingPlaceholders
  };
};
