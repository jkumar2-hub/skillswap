import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Star, Users, Sparkles, CheckCircle } from 'lucide-react';

const skills = ['Python', 'Guitar', 'Spanish', 'Yoga', 'UI Design', 'Photography', 'Cooking', 'French', 'React', 'Piano'];

const features = [
  { icon: '🔍', title: 'Smart Matching', desc: 'Our algorithm finds people who want what you know and know what you want.' },
  { icon: '🤝', title: 'Skill Exchange', desc: 'No money needed. Trade skills directly — both of you grow together.' },
  { icon: '⭐', title: 'Reputation System', desc: 'Build your credibility through reviews after each exchange session.' },
  { icon: '💬', title: 'Built-in Chat', desc: 'Coordinate sessions directly in-app without switching platforms.' },
];

const testimonials = [
  { name: 'Arjun M.', skill: 'Traded Python for Spanish', text: 'Found a match in 2 days! Taught Python, learned conversational Spanish. Incredible experience.', rating: 5 },
  { name: 'Priya S.', skill: 'UI Design ↔ Guitar', text: 'I never thought I\'d learn guitar this way. Gave away design skills, got music in return!', rating: 5 },
  { name: 'Rahul K.', skill: 'Math tutoring ↔ Cooking', text: 'My exchange partner is an amazing cook. I just had to teach him calculus. Worth it!', rating: 5 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#fafaf8] overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl">SkillSwap</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm !py-2 !px-5">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm !py-2 !px-5">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-32 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl -z-10" />

        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-brand-100">
          <Sparkles size={14} /> The skill economy for students
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl text-gray-900 leading-tight max-w-3xl mx-auto mb-6">
          Trade skills.<br />
          <span className="text-brand-500">Grow together.</span>
        </h1>

        <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto mb-10 font-body leading-relaxed">
          SkillSwap connects students who want to learn with those who can teach — no money, just a fair exchange of knowledge.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base !py-4 !px-8">
            Start Swapping <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary inline-flex items-center gap-2 text-base !py-4 !px-8">
            Sign in
          </Link>
        </div>

        {/* Floating skill chips */}
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {skills.map((s, i) => (
            <span key={s} className={`px-4 py-2 rounded-full text-sm font-medium border animate-fade-in ${
              i % 3 === 0 ? 'bg-brand-50 border-brand-200 text-brand-700' :
              i % 3 === 1 ? 'bg-orange-50 border-orange-200 text-orange-700' :
              'bg-gray-100 border-gray-200 text-gray-600'
            }`} style={{ animationDelay: `${i * 80}ms` }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-500 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center text-white">
          {[['500+', 'Skills Listed'], ['1,200+', 'Students'], ['98%', 'Satisfaction']].map(([val, label]) => (
            <div key={label}>
              <p className="font-display font-bold text-4xl">{val}</p>
              <p className="text-brand-100 text-sm mt-1 font-body">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">How SkillSwap works</h2>
          <p className="text-gray-500 text-lg">Simple, fair, and rewarding for everyone involved.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(f => (
            <div key={f.title} className="card p-8 group hover:scale-[1.01] transition-transform duration-200">
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3 className="font-display font-semibold text-xl text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works steps */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">3 steps to your first swap</h2>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'List your skills', desc: 'Tell us what you can teach and what you want to learn.' },
            { step: '02', title: 'Get matched', desc: 'Our algorithm finds people with complementary skills.' },
            { step: '03', title: 'Exchange & grow', desc: 'Schedule a session, meet up or go online, and learn together.' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mb-4">
                <span className="font-display font-bold text-white text-lg">{s.step}</span>
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">Loved by students</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="card p-6">
              <div className="flex mb-3">
                {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} className="star-filled fill-current" />)}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-brand-600 text-xs">{t.skill}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/50 to-gray-900" />
        <div className="relative z-10">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-6">Ready to start swapping?</h2>
          <p className="text-gray-400 text-lg mb-10">Join thousands of students already growing with SkillSwap.</p>
          <Link to="/register" className="inline-flex items-center gap-2 btn-primary !text-base !py-4 !px-10">
            Create free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center text-gray-400 text-sm font-body">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="font-display font-semibold text-gray-700">SkillSwap</span>
        </div>
        <p>© 2024 SkillSwap — DBMS Project. Built with ❤️</p>
      </footer>
    </div>
  );
}
