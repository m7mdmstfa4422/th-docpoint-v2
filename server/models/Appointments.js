import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentAt: { type: Date, required: true, index: true },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['محجوز', 'ملغي'], default: 'محجوز' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
