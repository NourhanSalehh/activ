'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

type Booking = {
  _id: string; activityName: string; activityId: string;
  userFullName: string; userAge?: string; userId: string;
  userPhone?: string; userEmail?: string; coach?: string;
  date?: string; time?: string; location?: string;
  paymentMethod: string; walletType?: string;
  proofUrl?: string; proofFileName?: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: string; approvedPrice?: string | number;
  holdUntil?: string; adminNote?: string; createdAt: string;
  traineeName?: string; parentName?: string; parentPhone?: string; nationalId?: string;
};

const STATUS_META = {
  pending: { label: 'Pending', cls: 'bg-amber-900/30 text-amber-400 border-amber-700/30', dot: 'bg-amber-400' },
  approved: { label: 'Approved', cls: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', cls: 'bg-red-900/30 text-red-400 border-red-700/30', dot: 'bg-red-400' },
};

const PayIcons: Record<string, React.ReactElement> = {
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  instapay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
      <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
      <path d="M20 12V8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <circle cx="17" cy="15" r="1" fill="currentColor" />
    </svg>
  ),
};

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const AttachIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function AdminBookingsTable() {
  const t = useTranslations('adminPanel.bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [panelPrice, setPanelPrice] = useState('');
  const [panelNote, setPanelNote] = useState('');
  const [panelHold, setPanelHold] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/booking');
      if (Array.isArray(res.data)) setBookings(res.data);
    } catch { toast.error(t('failedLoad')); }
    finally { setLoading(false); }
  };

  const params = useParams();
  const lang = params?.locale || 'ar';
  const isAr = lang === 'ar';

  useEffect(() => { fetchBookings(); }, []);

  const openPanel = (b: Booking) => {
    setSelectedBooking(b);
    setPanelPrice(b.approvedPrice?.toString() || '');
    setPanelNote(b.adminNote || '');
    setPanelHold(b.holdUntil ? b.holdUntil.slice(0, 10) : '');
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setSaving(true);
    try {
      const res = await api.put(`/booking/${id}/status`, {
        status, approvedPrice: panelPrice ? Number(panelPrice) : undefined, adminNote: panelNote || undefined
      });
      const updated = res.data.booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
      setSelectedBooking(prev => prev ? { ...prev, ...updated } : null);
      toast.success(status === 'approved' ? t('approveSuccess') : t('rejectSuccess'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('actionError'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد أنك تريد حذف هذا الحجز نهائياً؟' : 'Are you sure you want to completely delete this booking?')) return;
    setSaving(true);
    try {
      await api.delete(`/booking/${id}`);
      setBookings(prev => prev.filter(b => b._id !== id));
      setSelectedBooking(null);
      toast.success(isAr ? 'تم حذف الحجز بنجاح' : 'Booking deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete booking');
    } finally { setSaving(false); }
  };

  const handleSaveNote = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const res = await api.put(`/booking/${selectedBooking._id}/status`, {
        status: selectedBooking.status,
        approvedPrice: panelPrice ? Number(panelPrice) : undefined,
        adminNote: panelNote || undefined,
      });
      const updated = res.data.booking;
      setBookings(prev => prev.map(b => b._id === selectedBooking._id ? { ...b, ...updated } : b));
      setSelectedBooking(prev => prev ? { ...prev, ...updated } : null);
      toast.success(t('saveSuccess'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('saveError'));
    } finally { setSaving(false); }
  };

  const filtered = bookings.filter(b => {
    const matchesStatus = filter === 'all' || b.status === filter;
    const matchesSport = sportFilter === 'all' || b.activityName === sportFilter;
    return matchesStatus && matchesSport;
  });

  const uniqueSports = Array.from(new Set(bookings.map(b => b.activityName))).filter(Boolean);
  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-[#111] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">

      {/* ── Table Side ──────────────────────────────────── */}
      <div className={`${selectedBooking ? 'lg:w-[60%]' : 'w-full'} min-w-0 transition-all duration-300 space-y-4`}>

        {/* Filter + Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => {
            const meta = f !== 'all' ? STATUS_META[f] : null;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${filter === f
                  ? 'bg-red-600/15 border-red-600/30 text-red-400'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                  }`}
              >
                {meta && <span className={`w-1.5 h-1.5 rounded-full ${filter === f ? meta.dot : 'bg-white/20'}`} />}
                <span className="capitalize">{f === 'all' ? t('all') : t(f as any)}</span>
                <span className="opacity-50 text-[10px]">({counts[f]})</span>
              </button>
            );
          })}
          <div className="flex-1" />

          {/* Sport Filter Dropdown */}
          <div className="relative">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/[0.03] border border-white/[0.07] text-white/60 focus:border-red-500/50 focus:outline-none transition appearance-none pr-8"
            >
              <option value="all" className="bg-[#0f0f0f]">كل الرياضات</option>
              {uniqueSports.map(sport => (
                <option key={sport} value={sport} className="bg-[#0f0f0f]">{sport}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <button onClick={fetchBookings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/[0.03] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/[0.06] transition">
            <RefreshIcon /> {t('refresh')}
          </button>
        </div>

        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-white/[0.05] rounded-2xl bg-[#0f0f0f]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-4 text-white/10">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p className="text-white/25 font-semibold">{t('noBookings')}</p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {[t('name'), t('activity'), t('paymentMethod'), t('date'), t('status'), t('price'), ''].map((h, i) => (
                      <th key={i} className="px-5 py-4 text-left text-white/25 font-bold text-[11px] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map(b => {
                    const sm = STATUS_META[b.status];
                    return (
                      <tr
                        key={b._id}
                        onClick={() => openPanel(b)}
                        className={`cursor-pointer transition-colors group ${selectedBooking?._id === b._id
                          ? 'bg-red-950/20'
                          : 'hover:bg-white/[0.02]'
                          }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900/60 to-black border border-red-800/20 flex items-center justify-center text-xs font-black text-red-300 flex-shrink-0">
                              {b.userFullName?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white/80 group-hover:text-white transition-colors">{b.userFullName}</div>
                              <div className="text-white/30 text-[11px] font-mono">{b.userPhone || b.userId.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-white/60 font-medium">{b.activityName}</td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-white/40 text-xs font-semibold bg-white/[0.04] px-2.5 py-1 rounded-lg w-fit">
                            {PayIcons[b.paymentMethod] ?? PayIcons.wallet}
                            <span className="capitalize">{b.paymentMethod}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-white/30 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sm.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            {b.status === 'pending' ? t('pending') : b.status === 'approved' ? t('approved') : t('rejected')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {b.approvedPrice
                            ? <span className="text-emerald-400 font-black">{b.approvedPrice}</span>
                            : <span className="text-white/15">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          {b.proofUrl && (
                            <a href={b.proofUrl} target="_blank" onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-red-500/70 hover:text-red-400 text-xs font-bold transition px-2 py-1 bg-red-900/10 rounded-lg">
                              <AttachIcon /> {t('receipt')}
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Panel ──────────────────────────────── */}
      {selectedBooking && (() => {
        const sm = STATUS_META[selectedBooking.status];
        return (
          <div className="w-full lg:w-[40%] flex-shrink-0 bg-[#0f0f0f] border border-white/[0.07] rounded-2xl overflow-y-auto max-h-[85vh] sticky top-0 shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-black text-white text-lg">{t('details')}</h3>
              <button onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white transition">
                <CloseIcon />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${sm.cls}`}>
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">{t('status')}</span>
                <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider`}>
                  <span className={`w-2 h-2 rounded-full ${sm.dot}`} />
                  {selectedBooking.status === 'pending' ? t('pending') : selectedBooking.status === 'approved' ? t('approved') : t('rejected')}
                </span>
              </div>

              {/* Trainee info */}
              {(selectedBooking.traineeName || selectedBooking.parentName || selectedBooking.parentPhone || selectedBooking.nationalId) && (
                <div className="bg-blue-950/20 border border-blue-800/20 rounded-xl p-4 space-y-2">
                  <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-widest mb-3">{t('traineeName')}</p>
                  {[
                    [t('traineeName'), selectedBooking.traineeName, 'text-blue-300 font-bold'],
                    [t('parentName'), selectedBooking.parentName, 'text-white/70'],
                    [t('parentPhone'), selectedBooking.parentPhone, 'text-blue-400 font-mono'],
                    [t('nationalId'), selectedBooking.nationalId, 'text-white/40 font-mono'],
                  ].map(([l, v, c]) => v ? (
                    <div key={l as string} className="flex justify-between gap-4">
                      <span className="text-white/25 text-xs">{l}</span>
                      <span className={`text-sm text-right ${c}`}>{v}</span>
                    </div>
                  ) : null)}
                </div>
              )}

              {/* Main info */}
              <div className="bg-black/40 border border-white/[0.05] rounded-xl p-4 space-y-2.5">
                {[
                  [t('name'), selectedBooking.userFullName, 'font-bold text-white'],
                  [t('age'), selectedBooking.userAge, ''],
                  [t('phone'), selectedBooking.userPhone, 'font-mono text-red-400'],
                  [t('email'), selectedBooking.userEmail, 'font-mono'],
                  [t('activity'), selectedBooking.activityName, 'font-bold'],
                  [t('coach'), selectedBooking.coach, ''],
                  [t('date'), selectedBooking.date, ''],
                  [t('time'), selectedBooking.time, ''],
                  [t('location'), selectedBooking.location, ''],
                  [t('paymentMethod'), selectedBooking.paymentMethod, 'capitalize text-emerald-400 font-bold'],
                  [t('bookingDate'), new Date(selectedBooking.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }), ''],
                ].map(([l, v, c]) => v ? (
                  <div key={l as string} className="flex justify-between items-start gap-4">
                    <span className="text-white/25 text-xs font-semibold whitespace-nowrap pt-0.5">{l}</span>
                    <span className={`text-white/60 text-sm text-right ${c}`}>{v}</span>
                  </div>
                ) : null)}
              </div>

              {/* Proof */}
              {selectedBooking.proofUrl && (
                <div className="bg-black/40 border border-white/[0.05] rounded-xl p-4">
                  <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-3">{t('proofOfPayment')}</p>
                  {selectedBooking.proofUrl.match(/\.(jpg|jpeg|png|webp)$/i) || selectedBooking.proofUrl.startsWith('data:image/') ? (
                    <a href={selectedBooking.proofUrl} target="_blank" rel="noreferrer"
                      onClick={(e) => {
                        if (selectedBooking.proofUrl?.startsWith('data:image/')) {
                          e.preventDefault();
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;min-height:100vh;"><img src="${selectedBooking.proofUrl}" style="max-width:100%;max-height:100vh;"/></body>`);
                            win.document.close();
                          }
                        }
                      }}
                      className="block relative group rounded-xl overflow-hidden border border-white/[0.08]">
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center text-sm font-bold backdrop-blur-sm">
                        View Full
                      </div>
                      <img src={selectedBooking.proofUrl} alt="proof" className="w-full max-h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                    </a>
                  ) : (
                    <a href={selectedBooking.proofUrl} target="_blank"
                      className="flex items-center gap-3 text-red-400 font-bold hover:text-red-300 transition bg-red-950/20 rounded-xl p-4 border border-red-900/20">
                      <AttachIcon />{selectedBooking.proofFileName || t('viewFile')}
                    </a>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="space-y-3 pt-1">
                {[
                  { label: t('approvedPrice'), value: panelPrice, setter: setPanelPrice, type: 'number', focusColor: 'focus:border-emerald-500/50', placeholder: '0.00' },
                  { label: t('holdUntil'), value: panelHold, setter: setPanelHold, type: 'date', focusColor: 'focus:border-amber-500/50', placeholder: '' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-white/25 text-[10px] font-bold block mb-1.5 uppercase tracking-widest">{f.label}</label>
                    <input type={f.type} value={f.value} placeholder={f.placeholder}
                      onChange={e => f.setter(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm ${f.focusColor} focus:outline-none transition dark:[color-scheme:dark] font-mono`}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-white/25 text-[10px] font-bold block mb-1.5 uppercase tracking-widest">{t('adminNote')}</label>
                  <textarea rows={3} value={panelNote} placeholder={t('adminNotePlaceholder')}
                    onChange={e => setPanelNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-blue-500/50 focus:outline-none transition resize-none"
                  />
                </div>

                <button onClick={handleSaveNote} disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/[0.07] hover:text-white/90 transition disabled:opacity-30 disabled:cursor-not-allowed">
                  <SaveIcon /> {t('saveChanges')}
                </button>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.05]">
                  <button
                    onClick={() => handleAction(selectedBooking._id, 'approved')}
                    disabled={saving || selectedBooking.status === 'approved'}
                    className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                  >
                    {t('approve')}
                  </button>
                  <button
                    onClick={() => handleAction(selectedBooking._id, 'rejected')}
                    disabled={saving || selectedBooking.status === 'rejected'}
                    className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                  >
                    {t('reject')}
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(selectedBooking._id)}
                  disabled={saving}
                  className="w-full mt-2 py-3 rounded-xl bg-black hover:bg-red-950/40 border border-white/5 hover:border-red-900/50 text-red-500 font-bold text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  <TrashIcon /> {isAr ? 'حذف الحجز نهائياً' : 'Delete Booking Permanently'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
