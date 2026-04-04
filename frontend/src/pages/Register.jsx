import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const perks = ['Smart skill matching', 'Built-in messaging', 'Rating & reviews', '100% free'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.location);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#fafaf8]">
      <div className="hidden lg:flex flex-1 bg-gray-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl" />
        <div className="relative text-white max-w-sm">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-6">
            <Zap size={32} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-4xl mb-4">Join the skill economy</h2>
          <p className="text-gray-400 text-lg mb-8">No money. No gatekeeping. Just knowledge shared between students.</p>
          <div className="space-y-3">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-brand-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl">SkillSwap</span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-500 mb-8">Already have one? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link></p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm mb-6 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full name</label>
              <input className="input" type="text" placeholder="Arjun Mehta" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <div className="relative">
                <input className="input pr-11" type={show ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" type="text" placeholder="Mumbai, India" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Create account <ArrowRight size={18} /></>}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-4 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
