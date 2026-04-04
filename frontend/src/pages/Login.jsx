import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#fafaf8]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-brand-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-brand-700/30 rounded-full blur-3xl" />
        <div className="relative text-white max-w-sm text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={32} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-4xl mb-4">Welcome back to SkillSwap</h2>
          <p className="text-brand-100 text-lg">Continue your skill exchange journey and grow your network.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">SkillSwap</span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">Sign in</h1>
          <p className="text-gray-500 mb-8">Don't have an account? <Link to="/register" className="text-brand-600 font-medium hover:underline">Sign up</Link></p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <div className="relative">
                <input className="input pr-11" type={show ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign in <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo account:</p>
            <p className="text-xs text-gray-600">Email: <span className="font-mono text-brand-600">demo@skillswap.com</span></p>
            <p className="text-xs text-gray-600">Password: <span className="font-mono text-brand-600">demo1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
