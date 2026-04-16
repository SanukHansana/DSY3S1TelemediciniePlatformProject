import { getDB } from '../config/db.js';

export class Session {
  constructor(data) {
    this.id = data.id;
    this.appointmentId = data.appointmentId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.provider = data.provider;
    this.roomName = data.roomName;
    this.status = data.status;
    this.scheduledAt = data.scheduledAt;
    this.startedAt = data.startedAt;
    this.endedAt = data.endedAt;
    this.durationSeconds = data.durationSeconds;
    this.recordingUrl = data.recordingUrl;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async create(data) {
    const db = getDB();
    const sessionData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('sessions').insertOne(sessionData);
    return new Session({ ...sessionData, _id: result.insertedId });
  }

  static async findByAppointmentId(appointmentId) {
    const db = getDB();
    const session = await db.collection('sessions').findOne({ appointmentId });
    return session ? new Session(session) : null;
  }

  static async findById(id) {
    const db = getDB();
    const session = await db.collection('sessions').findOne({ id });
    return session ? new Session(session) : null;
  }

  async update(updates) {
    const db = getDB();
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.collection('sessions').updateOne(
      { id: this.id },
      { $set: updateData }
    );

    Object.assign(this, updateData);
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      provider: this.provider,
      roomName: this.roomName,
      status: this.status,
      scheduledAt: this.scheduledAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationSeconds: this.durationSeconds,
      recordingUrl: this.recordingUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}