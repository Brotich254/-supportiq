import Link from 'next/link';

const FEATURES = [
  { icon: '🤖', title: 'AI resolves 80% of tickets', desc: 'GPT-4o trained on your docs answers questions instantly, 24/7.' },
  { icon: '🧠', title: 'Custom knowledge base', desc: 'Train the AI on your FAQs, docs, and product info in minutes.' },
  { icon: '👨‍💼', title: 'Human handoff', desc: 'Complex cases escalate to your team with full context preserved.' },
  { icon: '📊', title: 'Analytics dashboard', desc: 'Track resolution rates, response times, and customer satisfaction.' },
  { icon: '🔌', title: 'One-line embed', desc: 'Add the chat widget to any site with a single script tag.' },
  { icon: '⚡', title: 'Semantic search', desc: 'pgvector finds the most relevant docs for every question.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-bold text-indigo-400">⚡ SupportIQ</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-gray-400 hover:text-white transition">Sign in</Link>
          <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition">
            Start free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-700 text-indigo-300 text-sm px-3 py-1 rounded-full mb-8">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          AI-powered customer support
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Resolve 80% of support tickets<br />
          <span className="text-indigo-400">automatically with AI</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Train the AI on your docs, embed a chat widget, and watch it handle FAQs, troubleshooting, and common requests — escalating only the complex ones to your team.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition shadow-lg shadow-indigo-900">
            Get started free
          </Link>
          <Link href="#features"
            className="border border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-3.5 rounded-xl font-semibold text-lg transition">
            See how it works
          </Link>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12 text-gray-200">Everything you need to automate support</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code snippet */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Add to your site in seconds</h2>
        <p className="text-gray-400 mb-6">Paste one script tag. That's it.</p>
        <pre className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-left text-sm text-indigo-300 overflow-x-auto">
{`<script src="https://supportiq.ai/embed.js"
  data-key="YOUR_API_KEY">
</script>`}
        </pre>
      </div>

      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        © 2026 SupportIQ. Built to scale.
      </footer>
    </div>
  );
}
