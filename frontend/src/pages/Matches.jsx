import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../hooks/api';
import { Sparkles, ArrowLeftRight, MessageSquare, MapPin, Star, TrendingUp } from 'lucide-react';
import ExchangeModal from '../components/ExchangeModal';

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/skills/matches').then(r => setMatches(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-brand-50 border-purple-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900">Smart Matches</h2>
            <p className="text-gray-500 text-sm">People who want what you offer AND offer what you want</p>
          </div>
        </div>
        {matches.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-700">
            <TrendingUp size={14} />
            Found <span className="font-bold">{matches.length}</span> perfect match{matches.length !== 1 ? 'es' : ''}!
          </div>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-6xl mb-4 block">🔮</span>
          <h3 className="font-display font-bold text-xl text-gray-700 mb-2">No matches yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add more skills to your profile to find perfect exchange partners.</p>
          <button onClick={() => navigate('/profile')} className="btn-primary">Add Skills</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {matches.map(u => (
            <MatchCard key={u.id} user={u}
              onExchange={() => setSelected(u)}
              onMessage={() => navigate(`/messages/${u.id}`)}
              onProfile={() => navigate(`/profile/${u.id}`)} />
          ))}
        </div>
      )}

      {selected && <ExchangeModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function MatchCard({ user, onExchange, onMessage, onProfile }) {
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="card p-5 border-purple-100 hover:border-purple-200 hover:shadow-md transition-all">
      {/* Match score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="avatar-placeholder w-12 h-12 text-base cursor-pointer flex-shrink-0" onClick={onProfile}>{initials}</div>
          <div>
            <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-brand-600" onClick={onProfile}>{user.name}</h3>
            {user.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{user.location}</p>}
            {user.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={11} className="star-filled fill-current" />
                <span className="text-xs font-medium text-gray-600">{user.rating}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
            {user.matchScore} match{user.matchScore > 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* What they can teach me */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-brand-600 mb-1.5">🎓 They can teach you</p>
        <div className="flex flex-wrap gap-1">
          {user.theyCanTeachMe.map(s => (
            <span key={s} className="badge-green badge font-medium">{s}</span>
          ))}
        </div>
      </div>

      {/* What I can teach them */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-orange-600 mb-1.5">🤝 You can teach them</p>
        <div className="flex flex-wrap gap-1">
          {user.iCanTeachThem.map(s => (
            <span key={s} className="badge-orange badge font-medium">{s}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <button onClick={onExchange} className="flex-1 btn-primary text-xs !py-2 flex items-center justify-center gap-1">
          <ArrowLeftRight size={13} /> Exchange Now
        </button>
        <button onClick={onMessage} className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1">
          <MessageSquare size={13} />
        </button>
      </div>
    </div>
  );
}
