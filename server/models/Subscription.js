import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  expiresAt: { type: Date, required: true },
  renewalCodeHash: { type: String, required: true },
  renewedAt: Date,
}, { timestamps: true });

export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
