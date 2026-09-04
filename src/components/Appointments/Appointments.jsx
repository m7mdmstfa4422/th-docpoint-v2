import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { api } from '../../api';

const toLocalInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

export default function Appointments() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [appointmentAt, setAppointmentAt] = useState(toLocalInput());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [patientRows, appointmentRows] = await Promise.all([
        api('/patients', { showLoading: false }),
        api('/appointments', { showLoading: false }),
      ]);
      setPatients(patientRows);
      setAppointments(appointmentRows);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return patients.filter((p) => [p.fullName, p.phone, p.nationalId].some((x) => String(x || '').toLowerCase().includes(value))).slice(0, 8);
  }, [patients, query]);

  const save = async (event) => {
    event.preventDefault();
    if (!selected) return;
    await api('/appointments', { method: 'POST', body: JSON.stringify({ patientId: selected._id, appointmentAt, notes }) });
    setSelected(null); setQuery(''); setNotes(''); setAppointmentAt(toLocalInput()); await load();
  };
  const remove = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الحجز نهائياً؟')) return;
    await api(`/appointments/${id}`, { method: 'DELETE' });
    await load();
  };

  return <section className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-gradient-to-l from-sky-700 to-cyan-500 p-7 text-white shadow-lg">
        <div className="flex items-center gap-3"><CalendarDays size={28}/><div><p className="text-xs font-bold text-sky-100">DOCPOINT</p><h1 className="text-2xl font-black">الحجوزات القادمة</h1></div></div>
        <p className="mt-3 text-sm text-sky-50">حجز الحالات من قاعدة بيانات المرضى ومتابعة مواعيد الأسبوع القادم.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={save} className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-900">حجز موعد جديد</h2>
          <label className="mt-5 block text-xs font-bold text-slate-600">ابحث واختر مريضاً من السجل</label>
          <div className="relative mt-2"><Search className="absolute right-3 top-3 text-sky-600" size={17}/><input value={query} onChange={(e) => {setQuery(e.target.value); setSelected(null);}} className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-3 text-sm outline-none focus:border-sky-500" placeholder="الاسم أو رقم الهاتف"/></div>
          {!selected && query.trim() && <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-100">{results.map((p) => <button type="button" key={p._id} onClick={() => {setSelected(p); setQuery(p.fullName);}} className="flex w-full items-center justify-between border-b border-slate-50 px-3 py-3 text-right text-sm hover:bg-sky-50"><span className="font-bold">{p.fullName}</span><span className="text-xs text-slate-500">{p.phone}</span></button>)}{!results.length && <p className="p-3 text-xs text-slate-400">لا توجد نتائج مطابقة.</p>}</div>}
          {selected && <div className="mt-3 flex items-center justify-between rounded-xl bg-sky-50 p-3 text-sm text-sky-900"><span className="flex items-center gap-2 font-bold"><UserRound size={16}/>{selected.fullName}</span><button type="button" onClick={() => {setSelected(null);setQuery('');}}><X size={17}/></button></div>}
          <label className="mt-4 block text-xs font-bold text-slate-600">الموعد</label><input required type="datetime-local" value={appointmentAt} onChange={(e) => setAppointmentAt(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm"/>
          <label className="mt-4 block text-xs font-bold text-slate-600">ملاحظة اختيارية</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm"/>
          <button disabled={!selected} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white disabled:opacity-40"><Plus size={17}/>تأكيد الحجز</button>
        </form>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="font-black text-slate-900">خلال 7 أيام</h2><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{appointments.length} حجز</span></div>
          <div className="divide-y divide-slate-100">{loading ? <p className="p-8 text-center text-sm text-slate-400">جارٍ تحميل الحجوزات...</p> : appointments.length ? appointments.map((a) => <div key={a._id} className="flex items-center gap-3 p-4"><div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><CalendarDays size={19}/></div><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{a.patient?.fullName || 'مريض محذوف'}</p><p className="mt-1 text-xs text-slate-500"><b className="text-sky-700">{new Date(a.appointmentAt).toLocaleDateString('ar-EG', { weekday: 'long' })}</b> · {a.patient?.phone} · {new Date(a.appointmentAt).toLocaleString('ar-EG', {dateStyle:'medium', timeStyle:'short'})}</p>{a.notes && <p className="mt-1 text-xs text-slate-400">{a.notes}</p>}</div><button onClick={() => remove(a._id)} title="حذف نهائي" className="rounded-xl p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={18}/></button></div>) : <p className="p-8 text-center text-sm text-slate-400">لا توجد حجوزات خلال الأسبوع القادم.</p>}</div>
        </section>
      </div>
    </div>
  </section>;
}
