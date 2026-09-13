import 'dotenv/config';
import cors from 'cors'; 
import express from 'express'; 
import mongoose from 'mongoose'; 
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';

import Patient from './models/Patient.js';
import Clinic from './models/Clinic.js';
import Visit from './models/Visit.js';
import Admin from './models/Admin.js';
import Subscription from './models/Subscription.js';
import MedicalExamination from './models/MedicalExamination.js';
import Appointment from './models/Appointments.js';
import ExternalDebt from './models/ExternalDebt.js';
import Notification from './models/Notification.js';
import { createNotification, addSseClient, removeSseClient } from './utils/notifications.js';
import { connectToDatabase } from './db.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection middleware - ensures cached DB connection for every request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('[DB Middleware] Database connection failure:', error.message);
    res.status(500).json({ error: 'Database connection failure. Please try again.' });
  }
});

const token = (admin) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET is not properly configured');
  }
  return jwt.sign(
    { id: admin._id, username: admin.username, name: admin.name, role: admin.role },
    secret.trim(), // Trim whitespace from JWT_SECRET
    { expiresIn: '12h' }
  );
};

const auth = (req, res, next) => {
  try {
    const rawToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (!rawToken) return res.status(401).json({ message: 'يرجى تسجيل الدخول أولاً.' });
    req.admin = jwt.verify(rawToken, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'جلسة الدخول غير صالحة أو منتهية.' });
  }
};

const doctor = (req, res, next) => 
  (req.admin.username === 'drahmed' || req.admin.role === 'developer') 
    ? next() 
    : res.status(403).json({ message: 'هذه الصلاحية للدكتور drahmed أو المطوّر فقط.' });

const developer = (req, res, next) => 
  req.admin.role === 'developer' 
    ? next() 
    : res.status(403).json({ message: 'هذه الصفحة مخصصة للمطور فقط.' });

// Auth Routes
app.post('/api/auth/login', async (req, res, next) => {
  try {
    // Validate input
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Login Error: Database not connected. Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'قاعدة البيانات غير متصلة. يرجى المحاولة لاحقاً.' });
    }

    // Find admin user
    const admin = await Admin.findOne({ username: req.body.username?.toLowerCase() });

    if (!admin) {
      console.log('Login attempt for non-existent user:', req.body.username);
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    // Verify passwordHash exists
    if (!admin.passwordHash) {
      console.error('Login Error: User exists but passwordHash is missing for:', admin.username);
      return res.status(500).json({ message: 'خطأ في بيانات الحساب. يرجى الاتصال بالدعم الفني.' });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(req.body.password || '', admin.passwordHash);
    if (!isValidPassword) {
      console.log('Login attempt with incorrect password for user:', req.body.username);
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('Login Error: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'خطأ في تكوين الخادم.' });
    }

    // Generate token and respond
    const authToken = token(admin);
    res.json({
      token: authToken,
      admin: {
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      message: 'حدث خطأ أثناء تسجيل الدخول.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/auth/me', auth, (req, res) => res.json(req.admin)); 
app.get('/api/health', (_req, res) => res.json({ connected: mongoose.connection.readyState === 1 }));

// Subscription Routes
app.get('/api/subscription', auth, async (_req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    res.json({ 
      expiresAt: subscription?.expiresAt, 
      active: Boolean(subscription && subscription.expiresAt > new Date()),
      createdAt: subscription?.createdAt,
      renewedAt: subscription?.renewedAt
    }); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/subscription/renew', auth, async (req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    if (!subscription || !(await bcrypt.compare(req.body.code || '', subscription.renewalCodeHash))) {
      return res.status(400).json({ message: 'كود التحقق غير صحيح.' }); 
    }
    const newCode = `CLINIC-${new Date().getFullYear() + 1}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; 
    subscription.expiresAt = new Date(new Date().setMonth(new Date().getMonth() + 6)); 
    subscription.renewedAt = new Date(); 
    subscription.renewalCodeHash = await bcrypt.hash(newCode, 12); 
    await subscription.save();
    createNotification({
      title: 'تجديد اشتراك العيادة',
      message: `تم تجديد اشتراك العيادة بنجاح لمدة 6 أشهر حتى ${new Date(subscription.expiresAt).toLocaleDateString('ar-EG')}.`,
      type: 'system',
      link: '/settings',
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));
    res.json({ expiresAt: subscription.expiresAt, nextCode: newCode }); 
  } catch (error) { 
    next(error); 
  } 
});

app.get('/api/developer/subscription', auth, developer, async (_req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    res.json({ expiresAt: subscription?.expiresAt, renewedAt: subscription?.renewedAt, active: Boolean(subscription && subscription.expiresAt > new Date()) }); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/developer/subscription/activate', auth, developer, async (req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    const months = Number(req.body?.months);
    if (![1, 3, 6, 12].includes(months)) {
      return res.status(400).json({ message: 'مدة التفعيل يجب أن تكون شهراً، 3 أشهر، 6 أشهر أو سنة.' });
    }

    const now = new Date();
    const startAt = subscription.expiresAt > now ? subscription.expiresAt : now;
    const expiresAt = new Date(startAt);
    expiresAt.setMonth(expiresAt.getMonth() + months);
    subscription.expiresAt = expiresAt;
    subscription.renewedAt = now; 
    await subscription.save();
    createNotification({
      title: 'تفعيل اشتراك العيادة',
      message: `تم تفعيل اشتراك العيادة لمدة ${months} شهر بنجاح حتى ${new Date(subscription.expiresAt).toLocaleDateString('ar-EG')}.`,
      type: 'system',
      link: '/settings',
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));
    res.json({ expiresAt: subscription.expiresAt, active: true, months }); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/developer/subscription/stop', auth, developer, async (_req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    subscription.expiresAt = new Date(); 
    await subscription.save(); 
    res.json({ expiresAt: subscription.expiresAt, active: false }); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/developer/subscription/code', auth, developer, async (_req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    const newCode = `CLINIC-${new Date().getFullYear() + 1}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; 
    subscription.renewalCodeHash = await bcrypt.hash(newCode, 12); 
    await subscription.save(); 
    res.json({ code: newCode }); 
  } catch (error) { 
    next(error); 
  } 
});

// Middleware حماية الاشتراك
app.use('/api', auth, async (_req, res, next) => { 
  try { 
    const subscription = await Subscription.findOne(); 
    if (!subscription) return next();
    if (subscription.expiresAt && new Date(subscription.expiresAt) <= new Date()) {
      return res.status(402).json({ message: 'انتهى الاشتراك. يرجى تجديده للمتابعة.', code: 'SUBSCRIPTION_EXPIRED' }); 
    }
    next(); 
  } catch (error) { 
    console.error('Subscription Check Error:', error);
    next(); 
  } 
});

// Admins Routes
app.get('/api/admins', auth, doctor, async (req, res, next) => { 
  try { 
    const filter = req.admin.role === 'developer' ? {} : { $and: [{ role: { $ne: 'developer' } }, { username: { $ne: 'developer' } }] }; 
    res.json(await Admin.find(filter).select('username name role createdAt').sort({ createdAt: 1 })); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/admins', auth, doctor, async (req, res, next) => { 
  try { 
    const passwordHash = await bcrypt.hash(req.body.password, 12); 
    const admin = await Admin.create({ username: req.body.username, name: req.body.name, role: 'admin', passwordHash }); 
    res.status(201).json({ _id: admin._id, username: admin.username, name: admin.name, role: admin.role }); 
  } catch (error) { 
    next(error); 
  } 
});

app.put('/api/admins/:id', auth, doctor, async (req, res, next) => { 
  try { 
    const existing = await Admin.findById(req.params.id); 
    if (!existing || (existing.role === 'developer' && req.admin.role !== 'developer')) {
      return res.status(404).json({ message: 'الحساب غير موجود.' }); 
    }
    if (existing.username === 'drahmed' && req.body.username !== 'drahmed') {
      return res.status(403).json({ message: 'لا يمكن تغيير اسم مستخدم حساب د. أحمد.' }); 
    }
    const update = { name: req.body.name, username: req.body.username }; 
    if (req.body.password) update.passwordHash = await bcrypt.hash(req.body.password, 12); 
    const admin = await Admin.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('username name role'); 
    res.json(admin); 
  } catch (error) { 
    next(error); 
  } 
});

app.delete('/api/admins/:id', auth, doctor, async (req, res, next) => { 
  try { 
    const admin = await Admin.findById(req.params.id); 
    if (!admin || admin.role === 'developer') return res.status(404).json({ message: 'الحساب غير موجود.' }); 
    if (admin.username === 'drahmed') return res.status(403).json({ message: 'لا يمكن حذف حساب د. أحمد.' }); 
    await admin.deleteOne(); 
    res.json({ message: 'تم حذف حساب الأدمن.' }); 
  } catch (error) { 
    next(error); 
  } 
});

// Clinics Routes
app.get('/api/clinics', auth, async (_req, res, next) => { 
  try { 
    res.json(await Clinic.find({ active: true }).sort({ name: 1 })); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/clinics', auth, async (req, res, next) => { 
  try { 
    res.status(201).json(await Clinic.create(req.body)); 
  } catch (error) { 
    next(error); 
  } 
});

// Medical Examination Routes (أنواع الكشف)
app.get('/api/checkup-types', auth, async (_req, res) => { 
  try { 
    const types = await MedicalExamination.find({ active: true }).sort({ createdAt: -1 }); 
    res.json(types || []); 
  } catch (error) { 
    console.error('Error in GET /api/checkup-types:', error); 
    res.status(500).json({ message: 'فشل جلب أنواع الكشف', error: error.message }); 
  } 
});

app.post('/api/checkup-types', auth, async (req, res) => { 
  try { 
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'يرجى كتابة اسم نوع الكشف.' });
    }
    const created = await MedicalExamination.create({ name: name.trim() }); 
    res.status(201).json(created); 
  } catch (error) { 
    console.error('Error in POST /api/checkup-types:', error); 
    if (error.code === 11000) {
      return res.status(409).json({ message: 'نوع الكشف هذا مسجل مسبقاً.' });
    }
    res.status(500).json({ message: 'تعذر إضافة نوع الكشف', error: error.message }); 
  } 
});

app.delete('/api/checkup-types/:id', auth, async (req, res) => { 
  try { 
    await MedicalExamination.findByIdAndDelete(req.params.id); 
    res.json({ message: 'تم حذف نوع الكشف بنجاح.' }); 
  } catch (error) { 
    console.error('Error in DELETE /api/checkup-types:', error); 
    res.status(500).json({ message: 'تعذر حذف نوع الكشف', error: error.message }); 
  } 
});

// أنواع الكشف المستخدمة فعلياً في سجلات المرضى والتقارير (Visits.title).
app.get('/api/reports/checkup-types', auth, async (_req, res, next) => {
  try {
    const titles = await Visit.distinct('title', { title: { $exists: true, $ne: '' } });
    res.json(titles.filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar')));
  } catch (error) { next(error); }
});

// Patients Routes
app.get('/api/patients', auth, async (req, res, next) => { 
  try { 
    const s = req.query.search?.trim(); 
    const q = s ? { $or: [{ fullName: { $regex: s, $options: 'i' } }, { phone: { $regex: s, $options: 'i' } }, { nationalId: { $regex: s, $options: 'i' } }] } : {}; 
    res.json(await Patient.find(q).populate('clinic', 'name location').populate('createdBy', 'name username').sort({ createdAt: -1 }).limit(100)); 
  } catch (error) { 
    next(error); 
  } 
});

app.post('/api/patients', auth, async (req, res, next) => { 
  try { 
    const { initialFee, ...data } = req.body; 
    const fullName = data.fullName?.trim();
    const phone = data.phone?.trim();
    const duplicatePatient = await Patient.findOne({ fullName, phone }).collation({ locale: 'ar', strength: 2 });
    if (duplicatePatient) {
      return res.status(409).json({
        message: 'يوجد مريض مسجل بالفعل بنفس الاسم ورقم الهاتف.',
        field: 'patientDuplicate',
      });
    }
    const patient = await Patient.create({ ...data, fullName, phone, createdBy: req.admin.id }); 
    if (Number(initialFee) > 0) {
      await Visit.create({
        patient: patient._id,
        clinic: patient.clinic,
        title: 'كشف أولي',
        cost: Number(initialFee),
        amount: Number(initialFee),
        notes: 'كشف وتسجيل أولي.',
        financialNotes: 'سداد رسوم الكشف الأولي عند التسجيل.',
        createdBy: req.admin.id
      });
    }
    createNotification({
      title: 'تسجيل مريض جديد',
      message: `تم تسجيل المريض "${patient.fullName}" في النظام${Number(initialFee) > 0 ? ` مع كشف أولي بقيمة ${initialFee} ج` : ''}.`,
      type: 'patient',
      link: `/patient-profile/${patient._id}`,
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));
    res.status(201).json(patient); 
  } catch (error) { 
    next(error); 
  } 
});

app.get('/api/patients/:id', auth, async (req, res, next) => { 
  try { 
    const patient = await Patient.findById(req.params.id).populate('clinic', 'name location specialty').populate('createdBy', 'name username'); 
    if (!patient) return res.status(404).json({ message: 'المريض غير موجود.' }); 
    const visits = await Visit.find({ patient: patient._id }).populate('clinic', 'name').populate('createdBy', 'name username').sort({ visitDate: -1 }); 
    res.json({ patient, visits }); 
  } catch (error) { 
    next(error); 
  } 
});

app.put('/api/patients/:id', auth, doctor, async (req, res, next) => { 
  try { 
    const allowedFields = ['fullName', 'age', 'gender', 'nationality', 'nationalId', 'birthDate', 'phone', 'clinic', 'medicalNotes'];
    const updates = Object.fromEntries(allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
      .map((field) => [field, req.body[field]]));
    if (updates.age !== undefined) updates.age = Number(updates.age);
    const patient = await Patient.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); 
    if (!patient) return res.status(404).json({ message: 'المريض غير موجود.' }); 
    res.json(patient); 
  } catch (error) { 
    next(error); 
  } 
});

// Appointments Routes — appointments always point to an existing patient record.
app.get('/api/appointments', auth, async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const to = req.query.to ? new Date(req.query.to) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    const appointments = await Appointment.find({ appointmentAt: { $gte: from, $lte: to }, status: 'محجوز' })
      .populate('patient', 'fullName phone nationalId clinic')
      .populate('createdBy', 'name username')
      .sort({ appointmentAt: 1 });
    res.json(appointments);
  } catch (error) { next(error); }
});

app.post('/api/appointments', auth, async (req, res, next) => {
  try {
    const { patientId, appointmentAt, notes = '' } = req.body;
    if (!patientId || !appointmentAt) return res.status(400).json({ message: 'يرجى اختيار المريض وتحديد موعد الحجز.' });
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'المريض المختار غير موجود.' });
    const date = new Date(appointmentAt);
    if (Number.isNaN(date.getTime())) return res.status(400).json({ message: 'تاريخ الموعد غير صالح.' });
    const appointment = await Appointment.create({ patient: patient._id, appointmentAt: date, notes, createdBy: req.admin.id });
    await appointment.populate('patient', 'fullName phone nationalId clinic');

    const apptTimeStr = date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    createNotification({
      title: 'حجز موعد جديد',
      message: `تم حجز موعد للمريض "${patient.fullName}" بتاريخ ${apptTimeStr}.`,
      type: 'appointment',
      link: '/appointments',
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));

    res.status(201).json(appointment);
  } catch (error) { next(error); }
});

app.delete('/api/appointments/:id', auth, async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id).populate('patient', 'fullName');
    if (!appointment) return res.status(404).json({ message: 'الحجز غير موجود.' });

    createNotification({
      title: 'إلغاء حجز موعد',
      message: `تم إلغاء موعد المريض "${appointment.patient?.fullName || 'غير محدد'}".`,
      type: 'appointment',
      link: '/appointments',
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));

    res.json({ message: 'تم حذف الحجز نهائياً.' });
  } catch (error) { next(error); }
});

// Visits Routes
app.post('/api/patients/:id/visits', auth, async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'المريض غير موجود.' });

    const cost = Number(req.body.cost ?? req.body.amount ?? 0);
    const amount = Number(req.body.amount || 0);

    const visit = await Visit.create({
      title: req.body.title,
      diagnosis: req.body.diagnosis || '',
      treatmentPlan: req.body.treatmentPlan || '',
      clinicalNotes: req.body.clinicalNotes || '',
      notes: req.body.diagnosis || req.body.notes || '',
      financialNotes: req.body.financialNotes || (cost > amount ? `متبقي من الكشف: ${cost - amount} ج` : 'تم السداد بالكامل'), // ملاحظات الحسابات
      clinic: req.body.clinic,
      status: req.body.status || 'مكتمل',
      cost,
      amount,
      patient: patient._id,
      createdBy: req.admin.id
    });

    createNotification({
      title: 'تسجيل كشف جديد',
      message: `تم تسجيل كشف (${visit.title}) للمريض "${patient.fullName}" بقيمة ${cost || amount} ج.`,
      type: 'billing',
      link: `/patient-profile/${patient._id}`,
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));

    res.status(201).json(visit);
  } catch (error) {
    next(error);
  }
});

// مسار تعديل تفاصيل الكشف وفصل الملاحظات
app.put('/api/visits/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'معرف الزيارة غير صحيح.' });
    }

    const { title, diagnosis, treatmentPlan, clinicalNotes, notes, financialNotes, cost, amount } = req.body;

    const updatedVisit = await Visit.findByIdAndUpdate(
      id,
      {
        $set: {
          title: title?.trim(),
          diagnosis: diagnosis !== undefined ? diagnosis : '',
          treatmentPlan: treatmentPlan !== undefined ? treatmentPlan : '',
          clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : '',
          notes: diagnosis !== undefined ? diagnosis : (notes !== undefined ? notes : ''),
          financialNotes: financialNotes !== undefined ? financialNotes : '', // ملاحظات التعاملات المالية فقط
          cost: Number(cost || 0),
          amount: Number(amount || 0)
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedVisit) {
      return res.status(404).json({ message: 'الزيارة غير موجودة.' });
    }

    res.json(updatedVisit);
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ message: 'فشل حفظ تعديلات الكشف', error: error.message });
  }
});

// حفظ الملف الطبي للكشف فقط — لا يلمس السعر أو التحصيل أو ملاحظات الحسابات.
app.put('/api/visits/:id/medical-record', auth, doctor, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'معرف الزيارة غير صحيح.' });
    const clean = (value) => String(value || '').trim();
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          diagnosis: clean(req.body.diagnosis),
          treatmentPlan: clean(req.body.treatmentPlan),
          clinicalNotes: clean(req.body.clinicalNotes),
          // يحتفظ بالحقل القديم متزامناً كي تظهر الكشوف السابقة والجديدة بصورة متوافقة.
          notes: clean(req.body.diagnosis),
        },
      },
      { new: true, runValidators: true }
    );
    if (!visit) return res.status(404).json({ message: 'الزيارة غير موجودة.' });
    res.json({ message: 'تم حفظ السجل الطبي للكشف.', visit });
  } catch (error) {
    console.error('Error saving medical record:', error);
    res.status(500).json({ message: 'تعذر حفظ السجل الطبي للكشف.' });
  }
});

// سداد مديونية الجلسات السابقة (توثيق السداد في خانة المال وملاحظات الحسابات فقط)
app.post('/api/patients/:id/pay-debt', auth, async (req, res, next) => {
  try {
    let payment = Number(req.body.amount) || 0;
    if (payment <= 0) return res.status(400).json({ message: 'يرجى إدخال مبلغ صحيح.' });

    const visits = await Visit.find({ patient: req.params.id }).sort({ visitDate: 1, createdAt: 1 });
    const today = new Date().toLocaleDateString('ar-EG');
    
    const initialAmount = Number(req.body.amount) || 0;
    for (const v of visits) {
      const cost = Number(v.cost ?? v.amount ?? 0);
      const paid = Number(v.amount || 0);
      const remaining = Math.max(0, cost - paid);

      if (remaining > 0 && payment > 0) {
        const payForThis = Math.min(remaining, payment);

        v.amount = paid + payForThis;

        // يتم توثيق العملية حصرياً داخل ملاحظات المال دون لمس التشخيص
        const paymentEntry = `تم سداد ${payForThis} ج بتاريخ ${today}`;
        v.financialNotes = v.financialNotes
          ? `${v.financialNotes} | ${paymentEntry}`
          : paymentEntry;

        await v.save();
        payment -= payForThis;
      }
    }

    Patient.findById(req.params.id).select('fullName').then((pat) => {
      createNotification({
        title: 'سداد مديونية مريض',
        message: `تم سداد دفعة مالية بقيمة ${initialAmount} ج لحساب المريض "${pat?.fullName || 'غير محدد'}".`,
        type: 'billing',
        link: `/patient-profile/${req.params.id}`,
        createdBy: req.admin.id,
      }).catch((err) => console.error('Notification error:', err));
    }).catch(() => {});

    res.json({ message: 'تم تسوية وتحديث الحسابات بنجاح.' });
  } catch (error) { 
    next(error); 
  }
});

// ── استعلام مديونيات المرضى (المبالغ المتبقية على المرضى من الكشوفات) ──
app.get('/api/debts/patients', auth, async (req, res, next) => {
  try {
    const search = req.query.search?.trim();

    // جلب الكشوف التي فيها التكلفة أكبر من المدفوع
    const visits = await Visit.find({
      $expr: { $gt: [{ $ifNull: ['$cost', 0] }, { $ifNull: ['$amount', 0] }] }
    })
      .populate('patient', 'fullName phone nationalId age gender')
      .populate('clinic', 'name')
      .sort({ visitDate: -1, createdAt: -1 });

    const patientMap = new Map();
    let totalDebt = 0;

    for (const v of visits) {
      if (!v.patient) continue;
      const cost = Number(v.cost || 0);
      const paid = Number(v.amount || 0);
      const remaining = Math.max(0, cost - paid);
      if (remaining <= 0) continue;

      const pid = String(v.patient._id);
      if (!patientMap.has(pid)) {
        patientMap.set(pid, {
          patient: v.patient,
          clinic: v.clinic,
          totalCost: 0,
          totalPaid: 0,
          totalRemaining: 0,
          lastVisitDate: v.visitDate || v.createdAt,
          visits: []
        });
      }

      const pData = patientMap.get(pid);
      pData.totalCost += cost;
      pData.totalPaid += paid;
      pData.totalRemaining += remaining;
      pData.visits.push({
        _id: v._id,
        title: v.title,
        cost,
        paid,
        remaining,
        visitDate: v.visitDate || v.createdAt,
        financialNotes: v.financialNotes
      });
      totalDebt += remaining;
    }

    let result = Array.from(patientMap.values());

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item => 
        item.patient?.fullName?.toLowerCase().includes(s) ||
        item.patient?.phone?.includes(s) ||
        item.patient?.nationalId?.includes(s)
      );
    }

    // فرز تنازلي حسب إجمالي المتبقي (الأعلى أولاً)
    result.sort((a, b) => b.totalRemaining - a.totalRemaining);

    res.json({
      totalDebt,
      patientCount: patientMap.size,
      patients: result
    });
  } catch (error) {
    next(error);
  }
});

// ── إحصائيات عامة لكافة الأموال والمديونيات الخارجية ──
app.get('/api/debts/overview', auth, async (req, res, next) => {
  try {
    const visits = await Visit.find({
      $expr: { $gt: [{ $ifNull: ['$cost', 0] }, { $ifNull: ['$amount', 0] }] }
    });

    let patientsDebt = 0;
    const indebtedPatientIds = new Set();
    for (const v of visits) {
      const cost = Number(v.cost || 0);
      const paid = Number(v.amount || 0);
      const remaining = Math.max(0, cost - paid);
      if (remaining > 0) {
        patientsDebt += remaining;
        if (v.patient) indebtedPatientIds.add(String(v.patient));
      }
    }

    const externalDebts = await ExternalDebt.find();
    let externalReceivables = 0;
    let externalPayables = 0;

    for (const d of externalDebts) {
      const total = Number(d.totalAmount || 0);
      const paid = Number(d.paidAmount || 0);
      const remaining = Math.max(0, total - paid);

      if (d.type === 'receivable') {
        externalReceivables += remaining;
      } else if (d.type === 'payable') {
        externalPayables += remaining;
      }
    }

    const totalOwedToDoctor = patientsDebt + externalReceivables;
    const netPosition = totalOwedToDoctor - externalPayables;

    res.json({
      patientsDebt,
      indebtedPatientsCount: indebtedPatientIds.size,
      externalReceivables,
      externalPayables,
      totalOwedToDoctor,
      netPosition,
      externalCount: externalDebts.length
    });
  } catch (error) {
    next(error);
  }
});

// ── مسارات الديون والالتزامات للجهات الخارجية ──
app.get('/api/external-debts', auth, async (req, res, next) => {
  try {
    const { type, category, status, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search?.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { debtorName: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ];
    }

    const items = await ExternalDebt.find(query)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.post('/api/external-debts', auth, async (req, res, next) => {
  try {
    const { title, debtorName, type, category, phone, totalAmount, paidAmount, dueDate, notes } = req.body;
    if (!title || !debtorName || totalAmount === undefined) {
      return res.status(400).json({ message: 'يرجى إدخال اسم المعاملة، واسم الطرف، والمبلغ الإجمالي.' });
    }

    const initialPaid = Number(paidAmount || 0);
    const payments = initialPaid > 0 ? [{
      amount: initialPaid,
      date: new Date(),
      notes: 'دفعة أولية عند تسجيل المعاملة'
    }] : [];

    const item = await ExternalDebt.create({
      title: title.trim(),
      debtorName: debtorName.trim(),
      type: type || 'receivable',
      category: category || 'أخرى',
      phone: phone?.trim() || '',
      totalAmount: Number(totalAmount),
      paidAmount: initialPaid,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes?.trim() || '',
      payments,
      createdBy: req.admin.id
    });

    createNotification({
      title: item.type === 'receivable' ? 'تسجيل مستحق مالي خارجي' : 'تسجيل التزام مالي خارجي',
      message: `تم تسجيل معاملة "${item.title}" للطرف "${item.debtorName}" بإجمالي ${item.totalAmount} ج.`,
      type: 'billing',
      link: '/indebtedness',
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/api/external-debts/:id', auth, async (req, res, next) => {
  try {
    const item = await ExternalDebt.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'المعاملة غير موجودة.' });

    const allowed = ['title', 'debtorName', 'type', 'category', 'phone', 'totalAmount', 'dueDate', 'notes'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    }

    await item.save();
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/external-debts/:id', auth, async (req, res, next) => {
  try {
    const item = await ExternalDebt.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'المعاملة غير موجودة.' });
    res.json({ message: 'تم حذف المعاملة بنجاح.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/external-debts/:id/pay', auth, async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    const notes = req.body.notes?.trim() || '';
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'يرجى إدخال مبلغ صحيح للدفعة.' });
    }

    const item = await ExternalDebt.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'المعاملة غير موجودة.' });

    item.paidAmount = (item.paidAmount || 0) + amount;
    item.payments.push({
      amount,
      date: new Date(),
      notes
    });

    await item.save();

    createNotification({
      title: 'سداد دفعة مالية خارجية',
      message: `تم تسجيل سداد بقيمة ${amount} ج للمعاملة "${item.title}".`,
      type: 'billing',
      link: '/indebtedness',
      createdBy: req.admin.id,
    }).catch((err) => console.error('Notification error:', err));

    res.json({ message: 'تم تسجيل الدفعة وتحديث الرصيد بنجاح.', item });
  } catch (error) {
    next(error);
  }
});

// Dashboard & Reports Routes
app.get('/api/finance/checkup-summary', auth, async (req, res, next) => {
  try {
    const match = { status: 'مكتمل' };
    if (req.query.checkupType?.trim()) match.title = req.query.checkupType.trim();
    const rows = await Visit.aggregate([
      { $match: match },
      { $group: { _id: '$title', visits: { $sum: 1 }, people: { $addToSet: '$patient' }, revenue: { $sum: '$amount' }, totalCost: { $sum: '$cost' } } },
      { $sort: { revenue: -1, _id: 1 } },
    ]);
    res.json(rows.map((row) => ({ name: row._id || 'غير محدد', visits: row.visits, people: row.people.length, revenue: row.revenue, totalCost: row.totalCost })));
  } catch (error) { next(error); }
});

app.get('/api/dashboard', auth, async (req, res, next) => { 
  try { 
    const visitMatch = { status: 'مكتمل' };
    if (req.query.checkupType?.trim()) visitMatch.title = req.query.checkupType.trim();
    const [visits, clinics, totals, patientIds, byCheckupType] = await Promise.all([
      Visit.countDocuments(visitMatch), 
      Clinic.find({ active: true }).sort({ name: 1 }), 
      Visit.aggregate([{ $match: visitMatch }, { $group: { _id: '$clinic', income: { $sum: '$amount' }, visits: { $sum: 1 } } }]),
      Visit.distinct('patient', visitMatch),
      Visit.aggregate([{ $match: visitMatch }, { $group: { _id: '$title', revenue: { $sum: '$amount' }, visits: { $sum: 1 }, patients: { $addToSet: '$patient' } } }, { $sort: { revenue: -1 } }])
    ]); 
    const map = new Map(totals.map((v) => [String(v._id), v])); 
    const totalIncome = totals.reduce((sum, v) => sum + v.income, 0); 
    res.json({ 
      patients: patientIds.length, 
      visits, 
      totalIncome, 
      checkupType: req.query.checkupType?.trim() || '',
      byCheckupType: byCheckupType.map((item) => ({ name: item._id || 'غير محدد', revenue: item.revenue || 0, visits: item.visits || 0, people: item.patients?.length || 0 })),
      clinics: clinics.map((c) => ({ ...c.toObject(), income: map.get(String(c._id))?.income || 0, visits: map.get(String(c._id))?.visits || 0 }))
    });
  } catch (error) {
    next(error);
  }
});

// Lightweight Sidebar Counts & Badges Endpoint
app.get(['/api/dashboard/sidebar-counts', '/api/sidebar-counts'], auth, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const adminId = req.admin?.id || req.admin?._id;

    const notifFilter = {
      $and: [
        {
          $or: [
            { recipient: adminId },
            { recipient: null }
          ]
        },
        {
          $or: [
            { isRead: false },
            { isRead: { $exists: false } }
          ]
        },
        {
          readBy: {
            $not: {
              $elemMatch: { admin: adminId }
            }
          }
        }
      ]
    };

    const [
      todayAppointments,
      upcomingAppointments,
      totalPatients,
      pendingDebts,
      todayVisits,
      prescriptions,
      totalVisits,
      unreadNotifications,
      urgentCases
    ] = await Promise.all([
      // Appointments for today
      Appointment.countDocuments({
        status: { $ne: 'ملغي' },
        appointmentAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      // Upcoming appointments
      Appointment.countDocuments({
        status: { $ne: 'ملغي' },
        appointmentAt: { $gte: startOfDay }
      }),
      // Total patients
      Patient.countDocuments(),
      // Pending or partially paid external debts
      ExternalDebt.countDocuments({
        status: { $in: ['معلق', 'مسدد جزئياً'] }
      }),
      // Operations / Visits conducted today
      Visit.countDocuments({
        $or: [
          { visitDate: { $gte: startOfDay, $lte: endOfDay } },
          { createdAt: { $gte: startOfDay, $lte: endOfDay } }
        ]
      }),
      // Prescriptions with treatments / diagnosis
      Visit.countDocuments({
        $or: [
          { treatmentPlan: { $exists: true, $ne: '' } },
          { diagnosis: { $exists: true, $ne: '' } }
        ]
      }),
      // Completed visits / Clinical reports
      Visit.countDocuments({ status: 'مكتمل' }),
      // Unread notifications for this admin
      Notification.countDocuments(notifFilter),
      // Urgent alerts
      Notification.countDocuments({
        type: 'urgent',
        ...notifFilter
      })
    ]);

    res.json({
      appointments: todayAppointments > 0 ? todayAppointments : upcomingAppointments,
      todayAppointments,
      upcomingAppointments,
      patients: totalPatients,
      debts: pendingDebts,
      operations: todayVisits,
      prescriptions,
      reports: totalVisits,
      unreadNotifications,
      urgentCases
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/reports', auth, async (req, res, next) => { 
  try { 
    const match = { status: 'مكتمل' }; 
    if (req.query.clinic) match.clinic = new mongoose.Types.ObjectId(req.query.clinic); 
    const selectedCheckupType = req.query.checkupType?.trim() || '';
    if (selectedCheckupType) match.title = selectedCheckupType;
    if (req.query.from || req.query.to) { 
      match.visitDate = {}; 
      if (req.query.from) match.visitDate.$gte = new Date(`${req.query.from}T00:00:00`); 
      if (req.query.to) match.visitDate.$lte = new Date(`${req.query.to}T23:59:59`); 
    } 
    const pipeline = [
      { $match: match }, 
      { $lookup: { from: 'patients', localField: 'patient', foreignField: '_id', as: 'patient' } }, 
      { $unwind: '$patient' }
    ]; 
    const [byClinic, byCheckupType, summary] = await Promise.all([
      Visit.aggregate([...pipeline, { $group: { _id: '$clinic', revenue: { $sum: '$amount' }, visitors: { $sum: 1 } } }]), 
      Visit.aggregate([...pipeline, { $group: { _id: '$title', revenue: { $sum: '$amount' }, totalCost: { $sum: '$cost' }, visits: { $sum: 1 }, patients: { $addToSet: '$patient' } } }]),
      Visit.aggregate([...pipeline, { $group: { _id: null, revenue: { $sum: '$amount' }, visitors: { $sum: 1 }, averagePayment: { $avg: '$amount' } } }]), 
    ]); 
    const clinics = await Clinic.find({ active: true }); 
    const map = new Map(byClinic.map((v) => [String(v._id), v])); 
    const typeMetrics = new Map(byCheckupType.map((item) => [item._id || '', item]));
    const visibleTypes = selectedCheckupType ? [selectedCheckupType] : byCheckupType.map((item) => item._id).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ar'));
    res.json({
      rows: clinics.map((c) => ({ id: c._id, name: c.name, location: c.location, checkupType: selectedCheckupType || 'كل أنواع الكشف', revenue: map.get(String(c._id))?.revenue || 0, visitors: map.get(String(c._id))?.visitors || 0 })),
      typeRows: visibleTypes.map((type) => { const item = typeMetrics.get(type); return { id: type, name: type, people: item?.patients?.length || 0, visits: item?.visits || 0, revenue: item?.revenue || 0, totalCost: item?.totalCost || 0 }; }),
      summary: summary[0] || { revenue: 0, visitors: 0, averagePayment: 0 },
    });
  } catch (error) {
    next(error);
  }
});

// ── Notifications Routes ──

// Real-time Server-Sent Events (SSE) Stream
app.get('/api/notifications/stream', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const clientId = `${req.admin.id || req.admin._id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  addSseClient(clientId, res, req.admin);

  req.on('close', () => {
    removeSseClient(clientId);
  });
});

// Get User's Notifications (with unread count, pagination & filter)
app.get('/api/notifications', auth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const unreadOnly = req.query.unreadOnly === 'true';

    const baseFilter = {
      $or: [
        { recipient: req.admin.id },
        { recipient: null },
        { recipient: { $exists: false } }
      ]
    };

    const filter = unreadOnly
      ? { ...baseFilter, isRead: false, 'readBy.admin': { $ne: req.admin.id } }
      : baseFilter;

    const [rawNotifications, unreadCount, total] = await Promise.all([
      Notification.find(filter)
        .populate('createdBy', 'name username role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({
        ...baseFilter,
        isRead: false,
        'readBy.admin': { $ne: req.admin.id }
      }),
      Notification.countDocuments(baseFilter)
    ]);

    const notifications = rawNotifications.map((n) => {
      const isReadForUser = Boolean(n.isRead || n.readBy?.some((r) => String(r.admin) === String(req.admin.id)));
      const obj = n.toObject();
      return {
        ...obj,
        isRead: isReadForUser
      };
    });

    res.json({
      notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
});

// Mark single notification as read
app.patch('/api/notifications/:id/read', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'الإشعار غير موجود.' });
    }

    notification.isRead = true;
    const hasRead = notification.readBy.some((r) => String(r.admin) === String(req.admin.id));
    if (!hasRead) {
      notification.readBy.push({ admin: req.admin.id, readAt: new Date() });
    }

    await notification.save();

    const formatted = {
      ...notification.toObject(),
      isRead: true
    };

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read for current user
app.patch('/api/notifications/mark-all-read', auth, async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { recipient: req.admin.id },
        { recipient: null },
        { recipient: { $exists: false } }
      ]
    };

    const result = await Notification.updateMany(
      filter,
      {
        $set: { isRead: true },
        $addToSet: { readBy: { admin: req.admin.id, readAt: new Date() } }
      }
    );

    res.json({ success: true, count: result.modifiedCount, message: 'تم تحديد جميع الإشعارات كمقروءة.' });
  } catch (error) {
    next(error);
  }
});

// Delete a single notification
app.delete('/api/notifications/:id', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'الإشعار غير موجود.' });
    }
    res.json({ success: true, message: 'تم حذف الإشعار بنجاح.' });
  } catch (error) {
    next(error);
  }
});

// Clear all notifications
app.delete('/api/notifications', auth, async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { recipient: req.admin.id },
        { recipient: null }
      ]
    };
    await Notification.deleteMany(filter);
    res.json({ success: true, message: 'تم مسح الإشعارات بنجاح.' });
  } catch (error) {
    next(error);
  }
});

// Central Error Handler
app.use((error, _req, res, _next) => { 
  console.error('Express Uncaught Error:', error);
  if (error.code === 11000) { 
    const field = Object.keys(error.keyPattern || {})[0]; 
    if (field === 'nationalId') return res.status(409).json({ message: 'الرقم القومي مسجل بالفعل لمريض آخر.', field }); 
    if (field === 'name') return res.status(409).json({ message: 'هذا الاسم مسجل بالفعل.', field }); 
    return res.status(409).json({ message: 'هذه البيانات مسجلة بالفعل.', field }); 
  } 
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'يرجى مراجعة البيانات المدخلة.' }); 
  res.status(500).json({ message: 'حدث خطأ في الخادم.', error: error.message }); 
});

// Seed default database collections if empty
async function seedInitialData() {
  try {
    if (!await Clinic.countDocuments()) {
      await Clinic.insertMany([
        { name: 'عيادة الأسنان', location: 'الفرع الرئيسي', specialty: 'طب الأسنان' },
        { name: 'عيادة الأطفال', location: 'الفرع الرئيسي', specialty: 'طب الأطفال' },
        { name: 'عيادة الباطنة', location: 'الفرع الرئيسي', specialty: 'باطنة عامة' }
      ]);
    }

    try {
      if (!await MedicalExamination.countDocuments()) {
        await MedicalExamination.insertMany([
          { name: 'كشف عام' },
          { name: 'استشارة' },
          { name: 'كشف مستعجل' }
        ]);
      }
    } catch (err) {
      console.warn('Seeding checkup types notice:', err.message);
    }

    if (!await Admin.countDocuments()) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'ChangeMeNow123!', 12);
      await Admin.insertMany([
        { username: 'drahmed', name: 'د. أحمد', role: 'doctor', passwordHash },
        { username: 'admin1', name: 'مدير العيادات', passwordHash },
        { username: 'admin2', name: 'مدير الحسابات', passwordHash },
        { username: 'admin3', name: 'مدير الاستقبال', passwordHash }
      ]);
    }

    if (!await Admin.exists({ username: 'developer' })) {
      await Admin.create({
        username: 'developer',
        name: 'مطور النظام',
        role: 'developer',
        passwordHash: await bcrypt.hash(process.env.DEVELOPER_SEED_PASSWORD || 'DevClinic!2026', 12)
      });
    }

    if (!await Subscription.countDocuments()) {
      await Subscription.create({
        expiresAt: new Date('2026-08-22T18:05:00+03:00'),
        renewalCodeHash: await bcrypt.hash('CLINIC-2027-START', 12)
      });
    }

    try {
      if (!await Notification.countDocuments()) {
        await Notification.create({
          title: 'مرحباً بك في نظام العيادة',
          message: 'تم تفعيل مركز الإشعارات الفوري بنجاح. ستصلك هنا تنبيهات المواعيد، المرضى والعمليات المالية فور حدوثها.',
          type: 'system',
          isRead: false,
        });
      }
    } catch (err) {
      console.warn('Seeding notification notice:', err.message);
    }
  } catch (err) {
    console.warn('[DB Seed] Seeding notice:', err.message);
  }
}

// Local server startup
if (!process.env.VERCEL) {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.warn('تنبيه: تأكد من ضبط MONGODB_URI و JWT_SECRET في ملف .env');
  }

  connectToDatabase()
    .then(async () => {
      await seedInitialData();
      app.listen(port, () => console.log(`API running at http://localhost:${port}`));
    })
    .catch((e) => {
      console.error(`تعذر الاتصال بـ MongoDB Atlas عند بدء التشغيل المحلي: ${e.message}`);
      app.listen(port, () => console.log(`API running at http://localhost:${port} (Waiting for MongoDB connection...)`));
    });
}

export default app;
