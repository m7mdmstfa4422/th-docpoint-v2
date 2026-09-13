import mongoose from 'mongoose';

const externalDebtSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  debtorName: { type: String, required: true, trim: true },
  type: { type: String, enum: ['receivable', 'payable'], default: 'receivable' }, // receivable = لنا بالخارج, payable = علينا للغير
  category: { 
    type: String, 
    trim: true, 
    default: 'أخرى',
    enum: ['معمل تحاليل', 'مركز أشعة', 'شركة مستلزمات', 'مستشفى شريك', 'شخصي', 'أخرى']
  },
  phone: { type: String, trim: true, default: '' },
  totalAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ['معلق', 'مسدد جزئياً', 'مسدد بالكامل'], 
    default: 'معلق' 
  },
  notes: { type: String, trim: true, default: '' },
  payments: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      notes: { type: String, trim: true, default: '' },
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
}, { timestamps: true });

// تحديث الحالة تلقائياً قبل الحفظ
externalDebtSchema.pre('save', function (next) {
  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.status = 'مسدد بالكامل';
  } else if (this.paidAmount > 0) {
    this.status = 'مسدد جزئياً';
  } else {
    this.status = 'معلق';
  }
  next();
});

export default mongoose.models.ExternalDebt || mongoose.model('ExternalDebt', externalDebtSchema);

