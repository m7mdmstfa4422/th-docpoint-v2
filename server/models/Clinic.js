import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  location: { type: String, required: true, trim: true },
  specialty: { type: String, trim: true, default: 'عيادة عامة' },
  phone: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Clinic || mongoose.model('Clinic', clinicSchema);
