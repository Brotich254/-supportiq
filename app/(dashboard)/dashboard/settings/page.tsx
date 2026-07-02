'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [form, setForm] = useState({ greeting: '', widgetColor: '#6366f1' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((data) => {
      setOrg(data);
      setForm({ greeting: data.greeting, widgetColor: data.widgetColor });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const copyApiKey = () => {
    if (!org?.apiKey) return;
    navigator.clipboard.writeText(org.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const embedSnippet = org
    ? `<script src="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://supportiq.ai'}/embed.js"\n  data-key="${org.apiKey}">\n</script>`
    : '';

  if (!org) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Widget config */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Widget Configuration</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Greeting Message</label>
            <input value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              placeholder="Hi! How can I help you today?"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-gray-600 mt-1">This is the first message visitors see when they open the widget.</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Widget Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.widgetColor}
                onChange={(e) => setForm({ ...form, widgetColor: e.target.value })}
                className="w-12 h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer" />
              <input value={form.widgetColor} onChange={(e) => setForm({ ...form, widgetColor: e.target.value })}
                className="w-32 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="w-10 h-10 rounded-full border border-gray-700" style={{ backgroundColor: form.widgetColor }} />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* API key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-semibold mb-1">API Key</h2>
        <p className="text-xs text-gray-400 mb-4">Keep this secret. Used by the widget to authenticate.</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-300 truncate">
            {org.apiKey}
          </code>
          <button onClick={copyApiKey}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl text-sm transition">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Embed code */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-semibold mb-1">Embed Code</h2>
        <p className="text-xs text-gray-400 mb-4">Add this script tag to your website's <code className="bg-gray-800 px-1 rounded">&lt;body&gt;</code> to add the chat widget.</p>
        <pre className="bg-gray-950 border border-gray-700 rounded-xl p-4 text-sm text-indigo-300 overflow-x-auto whitespace-pre">
          {embedSnippet}
        </pre>
        <button onClick={() => { navigator.clipboard.writeText(embedSnippet); toast.success('Copied!'); }}
          className="mt-3 text-xs text-indigo-400 hover:underline">
          Copy snippet
        </button>
      </div>

      {/* Org info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Organization</h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Name</span>
            <span>{org.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Slug</span>
            <span className="font-mono text-xs">{org.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Plan</span>
            <span className="text-indigo-400 font-medium">{org.plan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
