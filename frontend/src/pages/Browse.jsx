import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../hooks/api';
import { Search, MapPin, Star, MessageSquare, ArrowLeftRight, Filter, Video } from 'lucide-react';
import ExchangeModal from '../components/ExchangeModal';
import { useCall } from '../App';

const CATEGORIES = ['All', 'Technology', 'Music', 'Languages', 'Arts & Design', 'Sports & Fitness', 'Cooking', 'Business', 'Academic', 'Photography'];

export default function Browse() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page });
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      const res = await api.get(`/skills/browse?${params}`);
      setUsers(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [category, page]);

  const handleSearch = e => { e.preventDefault(); fetchUsers(); };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-4">Browse Skills</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-11" placeholder="Search skills or people..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary !py-3 !px-6">Search</button>
        </form>

        {/* Category filter */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === c ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl mb-4 block">🔍</span>
          <h3 className="font-display font-semibold text-lg text-gray-700 mb-2">No results found</h3>
          <p className="text-gray-400 text-sm">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => <UserCard key={u.id} user={u} onExchange={() => setSelectedUser(u)} onMessage={() => navigate(`/messages/${u.id}`)} onProfile={() => navigate(`/profile/${u.id}`)} />)}
        </div>
      )}

      {selectedUser && (
        <ExchangeModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

function UserCard({ user, onExchange, onMessage, onProfile }) {
  const { startCall } = useCall();
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="card p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform duration-200">
      <div className="flex items-start gap-3">
        <div className="avatar-placeholder w-12 h-12 text-base flex-shrink-0 cursor-pointer" onClick={onProfile}>{initials}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-brand-600 truncate" onClick={onProfile}>{user.name}</h3>
          {user.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11} />{user.location}</p>}
          {user.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="star-filled fill-current" />
              <span className="text-xs text-gray-600 font-medium">{user.rating}</span>
              <span className="text-xs text-gray-400">({user.total_reviews})</span>
            </div>
          )}
        </div>
      </div>

      {user.bio && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{user.bio}</p>}

      {user.offer?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Can teach</p>
          <div className="flex flex-wrap gap-1">
            {user.offer.slice(0, 4).map(s => (
              <span key={s.id} className="badge-green badge text-xs">{s.skill_name}</span>
            ))}
            {user.offer.length > 4 && <span className="badge-gray badge text-xs">+{user.offer.length - 4}</span>}
          </div>
        </div>
      )}

      {user.want?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Wants to learn</p>
          <div className="flex flex-wrap gap-1">
            {user.want.slice(0, 3).map(s => (
              <span key={s.id} className="badge-orange badge text-xs">{s.skill_name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
        <button onClick={onExchange} className="flex-1 btn-primary text-xs !py-2 flex items-center justify-center gap-1">
          <ArrowLeftRight size={13} /> Exchange
        </button>
        <button onClick={onMessage} className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1">
          <MessageSquare size={13} /> Chat
        </button>
        <button onClick={() => startCall({ id: user.id, name: user.name }, 'video')}
          title="Video call"
          className="btn-secondary text-xs !py-2 !px-3 flex items-center gap-1 hover:!text-brand-600 hover:!bg-brand-50">
          <Video size={13} />
        </button>
      </div>
    </div>
  );
}
