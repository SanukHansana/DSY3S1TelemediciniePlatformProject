import { getDB } from '../config/db.js';

export class SessionEvent {
  constructor(data) {
    this.id = data.id;
    this.sessionId = data.sessionId;
    this.eventType = data.eventType;
    this.participantId = data.participantId;
    this.participantRole = data.participantRole;
    this.participantName = data.participantName;
    this.occurredAt = data.occurredAt;
  }

  static async create(sessionId, eventData) {
    const db = getDB();
    const event = {
      id: eventData.id,
      sessionId,
      eventType: eventData.eventType,
      participantId: eventData.participantId,
      participantRole: eventData.participantRole,
      participantName: eventData.participantName,
      occurredAt: new Date().toISOString()
    };

    await db.collection('sessionEvents').insertOne(event);
    return new SessionEvent(event);
  }

  static async findBySessionId(sessionId) {
    const db = getDB();
    const events = await db.collection('sessionEvents')
      .find({ sessionId })
      .sort({ occurredAt: 1 })
      .toArray();
    return events.map(event => new SessionEvent(event));
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      eventType: this.eventType,
      participantId: this.participantId,
      participantRole: this.participantRole,
      participantName: this.participantName,
      occurredAt: this.occurredAt
    };
  }
}