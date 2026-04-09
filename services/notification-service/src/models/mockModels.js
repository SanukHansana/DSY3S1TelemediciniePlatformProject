// Simple in-memory storage for development
let notifications = [];
let templates = [];
let nextId = 1;

// Mock Notification model
class MockNotification {
  constructor(data) {
    this._id = (nextId++).toString();
    this.recipientId = data.recipientId;
    this.recipientRole = data.recipientRole;
    this.recipientModel = data.recipientModel;
    this.channel = data.channel;
    this.eventType = data.eventType;
    this.payload = data.payload;
    this.status = data.status || 'PENDING';
    this.externalMsgId = data.externalMsgId;
    this.sentAt = data.sentAt;
    this.deliveredAt = data.deliveredAt;
    this.retryCount = data.retryCount || 0;
    this.errorMessage = data.errorMessage;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const index = notifications.findIndex(n => n._id === this._id);
    if (index >= 0) {
      notifications[index] = { ...this };
    } else {
      notifications.push({ ...this });
    }
    return this;
  }

  static async findById(id) {
    return notifications.find(n => n._id === id) || null;
  }

  static async find(query) {
    let filtered = notifications;
    
    if (query.recipientId) {
      filtered = filtered.filter(n => n.recipientId === query.recipientId);
    }
    if (query.status) {
      filtered = filtered.filter(n => n.status === query.status);
    }
    if (query.eventType) {
      filtered = filtered.filter(n => n.eventType === query.eventType);
    }

    return {
      sort: (sortObj) => ({
        limit: (limit) => ({
          skip: (skip) => {
            let sorted = [...filtered];
            if (sortObj.createdAt === -1) {
              sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
            return sorted.slice(skip || 0, (skip || 0) + limit);
          }
        })
      })
    };
  }

  static async countDocuments(query) {
    let filtered = notifications;
    
    if (query.recipientId) {
      filtered = filtered.filter(n => n.recipientId === query.recipientId);
    }
    if (query.status) {
      filtered = filtered.filter(n => n.status === query.status);
    }
    if (query.eventType) {
      filtered = filtered.filter(n => n.eventType === query.eventType);
    }

    return filtered.length;
  }

  static async create(data) {
    const notification = new MockNotification(data);
    notifications.push(notification);
    return notification;
  }
}

// Mock NotificationTemplate model
class MockNotificationTemplate {
  constructor(data) {
    this._id = (nextId++).toString();
    this.eventType = data.eventType;
    this.channel = data.channel;
    this.subject = data.subject;
    this.bodyTemplate = data.bodyTemplate;
    this.isActive = data.isActive !== false;
    this.description = data.description;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const index = templates.findIndex(t => t._id === this._id);
    if (index >= 0) {
      templates[index] = { ...this };
    } else {
      templates.push({ ...this });
    }
    return this;
  }

  static async findById(id) {
    return templates.find(t => t._id === id) || null;
  }

  static async findOne(query) {
    return templates.find(t => {
      if (query.eventType && t.eventType !== query.eventType) return false;
      if (query.channel && t.channel !== query.channel) return false;
      if (query.isActive !== undefined && t.isActive !== query.isActive) return false;
      return true;
    }) || null;
  }

  static async find(query) {
    let filtered = templates;
    
    if (query.eventType) {
      filtered = filtered.filter(t => t.eventType === query.eventType);
    }
    if (query.channel) {
      filtered = filtered.filter(t => t.channel === query.channel);
    }
    if (query.isActive !== undefined) {
      filtered = filtered.filter(t => t.isActive === query.isActive);
    }

    return [...filtered];
  }

  static async findByIdAndDelete(id) {
    const index = templates.findIndex(t => t._id === id);
    if (index >= 0) {
      const deleted = templates[index];
      templates.splice(index, 1);
      return deleted;
    }
    return null;
  }

  static async create(data) {
    const template = new MockNotificationTemplate(data);
    templates.push(template);
    return template;
  }
}

// Create some default templates for testing
const createDefaultTemplates = () => {
  if (templates.length === 0) {
    templates.push(new MockNotificationTemplate({
      eventType: 'APPOINTMENT_BOOKED',
      channel: 'EMAIL',
      subject: 'Appointment Confirmed',
      bodyTemplate: 'Hello {{patient.name}}, your appointment with {{doctor.name}} is confirmed for {{appointment.date}} at {{appointment.time}}.',
      description: 'Email template for appointment booking confirmation'
    }));

    templates.push(new MockNotificationTemplate({
      eventType: 'APPOINTMENT_BOOKED',
      channel: 'SMS',
      bodyTemplate: 'Hi {{patient.name}}, your appointment with {{doctor.name}} is confirmed for {{appointment.date}} at {{appointment.time}}.',
      description: 'SMS template for appointment booking confirmation'
    }));
  }
};

// Initialize default templates
createDefaultTemplates();

export { MockNotification, MockNotificationTemplate };
