'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { timeAgo } from '@/lib/utils';

const SOURCE_ICONS: Record<string, string> = {
  MANUAL: '📝', FAQ: '❓', URL: '🔗', FILE: '📄',
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', source: 'MANUAL' as const });

  useEffect(() => {
    fetch('/api/knowledge').then((r) => r.json()).then(setDocs).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocs((p) => [{ ...data, source: form.source, createdAt: new Date(), updatedAt: new Date() }, ...p]);
      setForm({ title: '', content: '', source: 'MANUAL' });
      setShowForm(false);
      toast.success('Document added and indexed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    setDocs((p) => p.filter((d) => d.id !== id));
    toast.success('Deleted');
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-gray-400 mt-1">Train your AI by adding docs, FAQs, and product info.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          + Add Document
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Refund Policy"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Type</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as any })}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                {['MANUAL', 'FAQ', 'URL'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Content</label>
            <textarea required rows={6} value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Paste your document content here. The AI will use this to answer questions."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
              {saving ? 'Indexing...' : 'Save & Index'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-3">Cancel</button>
          </div>
          <p className="text-xs text-gray-600">⚡ The content will be converted to embeddings for semantic search.</p>
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="text-4xl mb-3">🧠</div>
          <p>No documents yet.</p>
          <p className="text-xs mt-1">Add your FAQs, docs, and policies to train the AI.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center gap-4 group">
              <span className="text-xl">{SOURCE_ICONS[doc.source] ?? '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {doc.source} · Updated {timeAgo(doc.updatedAt)}
                </p>
              </div>
              <button onClick={() => handleDelete(doc.id)}
                className="text-xs text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
