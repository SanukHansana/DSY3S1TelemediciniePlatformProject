import Appointment from "../models/appointment.model.js";
import StatusLog from "../models/appointmentStatus.model.js";

export const createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const old = await Appointment.findById(req.params.id);

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (req.body.status && old.status !== req.body.status) {
      await StatusLog.create({
        appointment_id: old._id,
        old_status: old.status,
        new_status: req.body.status,
        changed_by_role: "system"
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStatusLogs = async (req, res) => {
  try {
    const logs = await StatusLog.find({
      appointment_id: req.params.id
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};