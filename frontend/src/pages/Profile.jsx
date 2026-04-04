import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';
import { Plus, Trash2, Edit3, Save, X, MapPin, Star, ArrowLeftRight, MessageSquare, CheckCircle } from 'lucide-react';
import ExchangeModal from '../components/ExchangeModal';

const CATEGORIES = ['Technology', 'Music', 'Languages', 'Arts & Design', 'Sports & Fitness', 'Cooking', 'Business', 'Academic', 'Photography', 'Other'];
const PROFICIENCY = ['Beginner', 'Intermediate', 'Expert'];

export default function Profile() {
  const { userId } = useParams();
  const { user: me, updateUser } = useAuth();
  const navigate = useNavigate();
  const isMe = !userId || userId === String(me?.id);

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [mySkills, setMySkills] = useState({ offer: [], want: [] });
  const [addingOffer, setAddingOffer] = useState(false);
  const [addingWant, setAddingWant] = useState(false);
  const [offerForm, setOfferForm] = useState({ skill_name: '', category: 'Technology', proficiency: 'Intermediate', description: '' });
  const [wantForm, setWantForm] = useState({ skill_name: '', category: 'Technology' });
  const [saving, setSaving] = useState(false);
  const [exchangeTarget, setExchangeTarget] = useState(null);

  useEffect(() => {
    const uid = userId || me?.id;
    if (!uid) return;
    api.get(`/users/${uid}`).then(r => {
      setProfile(r.data);
      setEditForm({ name: r.data.name, bio: r.data.bio || '', location: r.data.location || '' });
      setMySkills({ offer: r.data.offer || [], want: r.data.want || [] });
    });
  }, [userId, me?.id]);

  const saveProfile = async () => {
    setSaving(true);
    const res = await api.put('/auth/profile', editForm);
    setProfile(p => ({ ...p, ...res.data }));
    updateUser(res.data);
    setEditing(false);
    setSaving(false);
  };

  const addOffer = async () => {
    if (!offerForm.skill_name.trim()) return;
    const res = await api.post('/skills/offer', offerForm);
    setMySkills(s => ({ ...s, offer: [...s.offer, res.data] }));
    setOfferForm({ skill_name: '', category: 'Technology', proficiency: 'Intermediate', description: '' });
    setAddingOffer(false);
  };

  const addWant = async () => {
    if (!wantForm.skill_name.trim()) return;
    const res = await api.post('/skills/want', wantForm);
    setMySkills(s => ({ ...s, want: [...s.want, res.data] }));
    setWantForm({ skill_name: '', category: 'Technology' });
    setAddingWant(false);
  };

  const removeOffer = async (id) => {
    await api.delete(`/skills/offer/${id}`);
    setMySkills(s => ({ ...s, offer: s.offer.filter(x => x.id !== id) }));
  };

  const removeWant = async (id) => {
    await api.delete(`/skills/want/${id}`);
    setMySkills(s => ({ ...s, want: s.want.filter(x => x.id !== id) }));
  };

  if (!profile) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <div className="avatar-placeholder w-20 h-20 text-2xl">{initials}</div>
            {profile.rating > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-white border border-gray-100 rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-sm">
                <Star size={10} className="star-filled fill-current" />
                <span className="text-xs font-bold text-gray-700">{profile.rating}</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input className="input !py-2 font-display font-bold text-lg" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                <input className="input !py-2 text-sm" placeholder="Location (e.g. Mumbai, India)" value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
                <textarea className="input !py-2 text-sm resize-none" rows={3} placeholder="Tell others about yourself..."
                  value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm !py-2 flex items-center gap-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm !py-2"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display font-bold text-2xl text-gray-900">{profile.name}</h1>
                    {profile.location && (
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><MapPin size={13} />{profile.location}</p>
                    )}
                    {profile.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} className={s <= Math.round(profile.rating) ? 'star-filled fill-current' : 'star-empty'} />
                        ))}
                        <span className="text-sm text-gray-500 ml-1">({profile.total_reviews} reviews)</span>
                      </div>
                    )}
                  </div>
                  {isMe ? (
                    <button onClick={() => setEditing(true)} className="btn-secondary text-sm !py-2 flex items-center gap-2">
                      <Edit3 size={14} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setExchangeTarget(profile)} className="btn-primary text-sm !py-2 flex items-center gap-2">
                        <ArrowLeftRight size={14} /> Exchange
                      </button>
                      <button onClick={() => navigate(`/messages/${profile.id}`)} className="btn-secondary text-sm !py-2 flex items-center gap-2">
                        <MessageSquare size={14} /> Message
                      </button>
                    </div>
                  )}
                </div>
                {profile.bio && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{profile.bio}</p>}
                <p className="text-xs text-gray-400 mt-2">Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Skills Offered */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-900">🎓 Can Teach</h3>
            {isMe && <button onClick={() => setAddingOffer(v => !v)} className="btn-primary text-xs !py-2 !px-3 flex items-center gap-1"><Plus size={14} /> Add</button>}
          </div>

          {isMe && addingOffer && (
            <div className="mb-4 p-4 bg-brand-50 rounded-2xl border border-brand-100 space-y-3">
              <input className="input text-sm" placeholder="Skill name (e.g. Python)" value={offerForm.skill_name}
                onChange={e => setOfferForm(f => ({ ...f, skill_name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <select className="input text-sm" value={offerForm.category} onChange={e => setOfferForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="input text-sm" value={offerForm.proficiency} onChange={e => setOfferForm(f => ({ ...f, proficiency: e.target.value }))}>
                  {PROFICIENCY.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <textarea className="input text-sm resize-none" rows={2} placeholder="Brief description..." value={offerForm.description}
                onChange={e => setOfferForm(f => ({ ...f, description: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={addOffer} className="btn-primary text-xs !py-2 flex-1">Add Skill</button>
                <button onClick={() => setAddingOffer(false)} className="btn-secondary text-xs !py-2"><X size={14} /></button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {mySkills.offer.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{isMe ? 'Add skills you can teach' : 'No skills listed'}</p>
            ) : mySkills.offer.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900">{s.skill_name}</p>
                    <span className={`badge text-xs ${s.proficiency === 'Expert' ? 'badge-green' : s.proficiency === 'Intermediate' ? 'badge-blue' : 'badge-gray'}`}>
                      {s.proficiency}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.category}</p>
                  {s.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.description}</p>}
                </div>
                {isMe && (
                  <button onClick={() => removeOffer(s.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-900">📚 Wants to Learn</h3>
            {isMe && <button onClick={() => setAddingWant(v => !v)} className="btn-primary text-xs !py-2 !px-3 flex items-center gap-1"><Plus size={14} /> Add</button>}
          </div>

          {isMe && addingWant && (
            <div className="mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
              <input className="input text-sm" placeholder="What do you want to learn?" value={wantForm.skill_name}
                onChange={e => setWantForm(f => ({ ...f, skill_name: e.target.value }))} />
              <select className="input text-sm" value={wantForm.category} onChange={e => setWantForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={addWant} className="btn-accent text-xs !py-2 flex-1">Add</button>
                <button onClick={() => setAddingWant(false)} className="btn-secondary text-xs !py-2"><X size={14} /></button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {mySkills.want.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{isMe ? 'Add skills you want to learn' : 'No skills listed'}</p>
            ) : mySkills.want.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{s.skill_name}</p>
                  <p className="text-xs text-gray-400">{s.category}</p>
                </div>
                {isMe && (
                  <button onClick={() => removeWant(s.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {profile.reviews?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">⭐ Reviews</h3>
          <div className="space-y-4">
            {profile.reviews.map(r => (
              <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="avatar-placeholder w-8 h-8 text-xs">
                    {r.reviewer_name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{r.reviewer_name}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.rating ? 'star-filled fill-current' : 'star-empty'} />)}
                    </div>
                  </div>
                  <p className="ml-auto text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                {r.comment && <p className="text-sm text-gray-600 ml-11">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {exchangeTarget && <ExchangeModal user={exchangeTarget} onClose={() => setExchangeTarget(null)} />}
    </div>
  );
}
