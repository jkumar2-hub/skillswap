import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';
import { X, ArrowLeftRight, Check } from 'lucide-react';

export default function ExchangeModal({ user, onClose }) {
  const { user: me } = useAuth();
  const [mySkills, setMySkills] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    offer_skill: '', want_skill: '', message: '',
    session_type: 'online', scheduled_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useState(() => {
    api.get('/skills/my').then(r => { setMySkills(r.data.offer); setLoaded(true); });
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.offer_skill || !form.want_skill) return setError('Please fill in all required fields');
    setLoading(true); setError('');
    try {
      await api.post('/exchanges', { receiver_id: user.id, ...form });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-xl">Propose Exchange</h2>
            <p className="text-brand-100 text-sm mt-1">with {user.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-brand-500" />
            </div>
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-gray-500 text-sm mb-6">{user.name} will be notified of your exchange proposal.</p>
            <button onClick={onClose} className="btn-primary">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl border border-red-100">{error}</div>}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">I will teach <span className="text-red-400">*</span></label>
              {mySkills.length > 0 ? (
                <select className="input" value={form.offer_skill} onChange={e => setForm(f => ({ ...f, offer_skill: e.target.value }))} required>
                  <option value="">Select a skill you offer...</option>
                  {mySkills.map(s => <option key={s.id} value={s.skill_name}>{s.skill_name}</option>)}
                </select>
              ) : (
                <input className="input" placeholder="e.g. Python Programming" value={form.offer_skill}
                  onChange={e => setForm(f => ({ ...f, offer_skill: e.target.value }))} required />
              )}
            </div>

            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <ArrowLeftRight size={18} className="text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">I want to learn <span className="text-red-400">*</span></label>
              {user.offer?.length > 0 ? (
                <select className="input" value={form.want_skill} onChange={e => setForm(f => ({ ...f, want_skill: e.target.value }))} required>
                  <option value="">Select what they offer...</option>
                  {user.offer.map(s => <option key={s.id} value={s.skill_name}>{s.skill_name}</option>)}
                </select>
              ) : (
                <input className="input" placeholder="e.g. Guitar" value={form.want_skill}
                  onChange={e => setForm(f => ({ ...f, want_skill: e.target.value }))} required />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Session type</label>
                <select className="input" value={form.session_type} onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}>
                  <option value="online">Online</option>
                  <option value="offline">In-person</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Proposed date</label>
                <input className="input" type="date" value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="input resize-none" rows={3} placeholder="Tell them about yourself and why you'd like to exchange..."
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
