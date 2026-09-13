import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 150 },
  gender: { type: String, enum: ['ذكر', 'أنثى'], required: true },
  nationality: { type: String, required: true, trim: true, default: 'مصري' },
  nationalId: { type: String, trim: true, unique: true, sparse: true },
  birthDate: Date,
  phone: { type: String, required: true, trim: true },
  clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  medicalNotes: { type: String, trim: true, default: '' },
}, { timestamps: true });

export default mongoose.models.Patient || mongoose.model('Patient', patientSchema);
