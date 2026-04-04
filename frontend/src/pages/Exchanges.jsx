import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../hooks/api';
import { Check, X, Star, MessageSquare, Clock, CheckCircle, ArrowLeftRight } from 'lucide-react';

const tabs = ['All', 'Pending', 'Accepted', 'Completed'];

const StatusBadge = ({ status }) => {
  const cfg = {
    pending: { cls: 'badge-orange', icon: Clock, label: 'Pending' },
    accepted: { cls: 'badge-blue', icon: CheckCircle, label: 'Accepted' },
    completed: { cls: 'badge-green', icon: CheckCircle, label: 'Completed' },
    rejected: { cls: 'badge-gray', icon: X, label: 'Rejected' },
  };
  const { cls, icon: Icon, label } = cfg[status] || cfg.rejected;
  return <span className={`badge ${cls}`}><Icon size={11} />{label}</span>;
};

export default function Exchanges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [reviewModal, setReviewModal] = useState(null);

  const fetch = async () => {
    setLoading(true);
    const res = await api.get('/exchanges');
    setExchanges(res.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/exchanges/${id}/status`, { status });
    fetch();
  };

  const filtered = tab === 'All' ? exchanges : exchanges.filter(e => e.status === tab.toLowerCase());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Exchanges</h2>
        <p className="text-gray-500 text-sm">Manage all your skill swap requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const count = t === 'All' ? exchanges.length : exchanges.filter(e => e.status === t.toLowerCase()).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                tab === t ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {t}
              {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ArrowLeftRight size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-500">No {tab === 'All' ? '' : tab.toLowerCase()} exchanges</h3>
          <p className="text-gray-400 text-sm mt-1">Start by browsing skills or finding matches</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ex => {
            const isRequester = ex.requester_id === user?.id;
            const otherName = isRequester ? ex.receiver_name : ex.requester_name;
            const otherInitials = otherName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const otherId = isRequester ? ex.receiver_id : ex.requester_id;

            return (
              <div key={ex.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar-placeholder w-11 h-11 text-sm flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/profile/${otherId}`)}>
                      {otherInitials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-brand-600"
                        onClick={() => navigate(`/profile/${otherId}`)}>
                        {otherName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isRequester ? 'You proposed' : 'They proposed'} • {new Date(ex.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={ex.status} />
                </div>

                {/* Skill swap */}
                <div className="mt-4 bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">{isRequester ? 'You teach' : 'They teach'}</p>
                    <span className="badge-green badge text-sm">{ex.offer_skill}</span>
                  </div>
                  <ArrowLeftRight size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">{isRequester ? 'You learn' : 'You teach'}</p>
                    <span className="badge-orange badge text-sm">{ex.want_skill}</span>
                  </div>
                </div>

                {ex.message && (
                  <p className="mt-3 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">"{ex.message}"</p>
                )}

                {ex.scheduled_at && (
                  <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> Scheduled: {new Date(ex.scheduled_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} • {ex.session_type}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {/* Receiver can accept/reject pending */}
                  {!isRequester && ex.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(ex.id, 'accepted')}
                        className="btn-primary text-xs !py-2 flex items-center gap-1">
                        <Check size={13} /> Accept
                      </button>
                      <button onClick={() => updateStatus(ex.id, 'rejected')}
                        className="btn-secondary text-xs !py-2 flex items-center gap-1 !text-red-500 hover:!bg-red-50">
                        <X size={13} /> Decline
                      </button>
                    </>
                  )}
                  {/* Mark complete */}
                  {ex.status === 'accepted' && (
                    <button onClick={() => updateStatus(ex.id, 'completed')}
                      className="btn-primary text-xs !py-2 flex items-center gap-1 !bg-green-500 hover:!bg-green-600">
                      <CheckCircle size={13} /> Mark Completed
                    </button>
                  )}
                  {/* Leave review */}
                  {ex.status === 'completed' && (
                    <button onClick={() => setReviewModal(ex)}
                      className="btn-secondary text-xs !py-2 flex items-center gap-1">
                      <Star size={13} /> Leave Review
                    </button>
                  )}
                  {/* Chat */}
                  <button onClick={() => navigate(`/messages/${otherId}`)}
                    className="btn-secondary text-xs !py-2 flex items-center gap-1 ml-auto">
                    <MessageSquare size={13} /> Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <ReviewModal exchange={reviewModal} userId={user?.id} onClose={() => { setReviewModal(null); fetch(); }} />
      )}
    </div>
  );
}

function ReviewModal({ exchange, userId, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isRequester = exchange.requester_id === userId;
  const revieweeName = isRequester ? exchange.receiver_name : exchange.requester_name;

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/exchanges/${exchange.id}/review`, { rating, comment });
      setDone(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Error submitting review');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-slide-up">
        {done ? (
          <div className="text-center py-4">
            <span className="text-5xl mb-4 block">🎉</span>
            <h3 className="font-display font-bold text-xl mb-2">Review submitted!</h3>
            <p className="text-gray-500 text-sm mb-4">Thanks for your feedback.</p>
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Rate your session</h2>
            <p className="text-gray-500 text-sm mb-6">How was your exchange with <span className="font-semibold text-gray-700">{revieweeName}</span>?</p>
            <div className="flex gap-2 justify-center mb-6">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-3xl transition-transform hover:scale-110">
                  {s <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <textarea className="input resize-none mb-4" rows={3} placeholder="Share your experience..."
              value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
