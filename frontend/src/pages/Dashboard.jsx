import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';
import { ArrowLeftRight, MessageSquare, Sparkles, Plus, ArrowRight, Star, Clock, CheckCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'badge-orange',
    accepted: 'badge-blue',
    completed: 'badge-green',
    rejected: 'badge-gray',
  };
  return <span className={`badge ${map[status] || 'badge-gray'} capitalize`}>{status}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mySkills, setMySkills] = useState({ offer: [], want: [] });
  const [exchanges, setExchanges] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/skills/my'),
      api.get('/exchanges'),
      api.get('/users/me/stats'),
    ]).then(([s, e, st]) => {
      setMySkills(s.data);
      setExchanges(e.data.slice(0, 5));
      setStats(st.data);
    }).finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const statCards = [
    { label: 'Pending Requests', value: stats.pending_requests || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Active Exchanges', value: stats.exchanges?.find(e => e.status === 'accepted')?.count || 0, icon: ArrowLeftRight, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats.exchanges?.find(e => e.status === 'completed')?.count || 0, icon: CheckCircle, color: 'text-brand-500', bg: 'bg-brand-50' },
    { label: 'Unread Messages', value: stats.unread_messages || 0, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Welcome card */}
      <div className="relative bg-gradient-to-r from-brand-500 to-brand-600 rounded-3xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-brand-700/30 rounded-full translate-y-1/2" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-brand-100 text-sm mb-1">Good to see you 👋</p>
            <h2 className="font-display font-bold text-2xl mb-1">{user?.name}</h2>
            {user?.location && <p className="text-brand-100 text-sm">📍 {user.location}</p>}
            <div className="mt-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-xl px-3 py-1 text-sm">
                <span className="font-semibold">{mySkills.offer.length}</span> skills offered
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-1 text-sm">
                <span className="font-semibold">{mySkills.want.length}</span> skills wanted
              </div>
            </div>
          </div>
          <div className="avatar-placeholder w-16 h-16 text-2xl !bg-white/20 flex-shrink-0">{initials}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="font-display font-bold text-2xl text-gray-900">{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Skills + Quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My skills */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-900">My Skills</h3>
            <Link to="/profile" className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {mySkills.offer.length === 0 && mySkills.want.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">No skills added yet</p>
              <Link to="/profile" className="btn-primary text-sm !py-2 !px-4">Add your first skill</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {mySkills.offer.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.skill_name}</p>
                    <p className="text-xs text-gray-400">{s.category}</p>
                  </div>
                  <span className="badge-green badge">{s.proficiency}</span>
                </div>
              ))}
              {mySkills.offer.length === 0 && (
                <p className="text-sm text-gray-400 py-2">No skills offered. <Link to="/profile" className="text-brand-600">Add one</Link></p>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: Sparkles, label: 'Find smart matches', desc: 'See who to swap with', path: '/matches', color: 'bg-purple-50 text-purple-600' },
              { icon: Plus, label: 'Add a skill', desc: 'Expand what you offer', path: '/profile', color: 'bg-brand-50 text-brand-600' },
              { icon: ArrowLeftRight, label: 'View exchanges', desc: 'Track your swaps', path: '/exchanges', color: 'bg-orange-50 text-orange-600' },
              { icon: MessageSquare, label: 'Messages', desc: `${stats.unread_messages || 0} unread`, path: '/messages', color: 'bg-blue-50 text-blue-600' },
            ].map(({ icon: Icon, label, desc, path, color }) => (
              <button key={path} onClick={() => navigate(path)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent exchanges */}
      {exchanges.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-900">Recent Exchanges</h3>
            <Link to="/exchanges" className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {exchanges.map(ex => (
              <div key={ex.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="avatar-placeholder w-9 h-9 text-sm">
                    {ex.requester_id === user?.id ? ex.receiver_name?.slice(0,2).toUpperCase() : ex.requester_name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ex.requester_id === user?.id ? ex.receiver_name : ex.requester_name}
                    </p>
                    <p className="text-xs text-gray-400">{ex.offer_skill} ↔ {ex.want_skill}</p>
                  </div>
                </div>
                <StatusBadge status={ex.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
