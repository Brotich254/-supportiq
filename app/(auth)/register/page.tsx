'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Account created! Sign in to continue.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-indigo-400 font-bold text-xl mb-8">⚡ SupportIQ</Link>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2">Create account</h1>
          <p className="text-sm text-gray-400 mb-6">Free plan includes 100 conversations/month</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: 'Your name', placeholder: 'Jane Smith' },
              { key: 'orgName', label: 'Company name', placeholder: 'Acme Inc.' },
              { key: 'email', label: 'Work email', placeholder: 'jane@acme.com', type: 'email' },
              { key: 'password', label: 'Password', placeholder: '8+ characters', type: 'password' },
            ].map(({ key, label, placeholder, type = 'text' }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                <input type={type} required placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 transition mt-2">
              {loading ? 'Creating...' : 'Create free account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Have an account? <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
