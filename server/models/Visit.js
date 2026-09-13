import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  title: { type: String, required: true, trim: true },
  cost: { type: Number, min: 0, default: 0 },
  amount: { type: Number, min: 0, default: 0 },
  // ملف طبي مستقل لكل كشف؛ لا تُستخدم هذه الحقول لأي بيانات مالية.
  diagnosis: { type: String, trim: true, default: '' },
  treatmentPlan: { type: String, trim: true, default: '' },
  clinicalNotes: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' }, // توافق مع الكشوف القديمة فقط
  financialNotes: { type: String, trim: true, default: '' }, // ملاحظات الحسابات والمالية
  status: { type: String, enum: ['مكتمل', 'انتظار', 'ملغى'], default: 'مكتمل' },
  visitDate: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Visit || mongoose.model('Visit', visitSchema);
