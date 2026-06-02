import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenSquare, Trash2, Plus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';

const CATEGORIES = ['dicas', 'mercado', 'investimento', 'novidades', 'guias'];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const EMPTY_FORM = {
  title: '', slug: '', excerpt: '', content: '',
  cover_image_url: '', category: '', tags: '',
  meta_title: '', meta_description: '', status: 'draft',
};

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/admin/blog/posts');
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setView('edit');
  };

  const openEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image_url: post.cover_image_url || '',
      category: post.category || '',
      tags: (post.tags || []).join(', '),
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      status: post.status || 'draft',
    });
    setError('');
    setView('edit');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm(f => ({
      ...f,
      title,
      slug: f.slug === slugify(f.title) || f.slug === '' ? slugify(title) : f.slug,
    }));
  };

  const handleSave = async (status) => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editingId) {
        await axios.put(`/api/admin/blog/posts/${editingId}`, payload);
      } else {
        await axios.post('/api/admin/blog/posts', payload);
      }
      await fetchPosts();
      setView('list');
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao salvar post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este post permanentemente?')) return;
    try {
      await axios.delete(`/api/admin/blog/posts/${id}`);
      setPosts(p => p.filter(x => x.id !== id));
    } catch (e) {
      alert('Erro ao excluir post.');
    }
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await axios.put(`/api/admin/blog/posts/${post.id}`, { status: newStatus });
      setPosts(p => p.map(x => x.id === post.id ? { ...x, status: newStatus } : x));
    } catch (e) {
      alert('Erro ao alterar status.');
    }
  };

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Posts do Blog</h2>
          <Button onClick={openNew} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Post
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Nenhum post criado ainda</p>
            <p className="text-sm mt-1">Clique em "Novo Post" para começar.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Visualizações</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => (
                  <tr key={post.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-xs">{post.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">/blog/{post.slug}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {post.category && <Badge variant="outline" className="capitalize">{post.category}</Badge>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={post.status === 'published' ? 'bg-green-100 text-green-700 border-0' : 'bg-yellow-100 text-yellow-700 border-0'}>
                        {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{post.view_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title={post.status === 'published' ? 'Despublicar' : 'Publicar'} onClick={() => toggleStatus(post)}>
                          {post.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                          <PenSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Edit view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h2 className="text-xl font-semibold">{editingId ? 'Editar Post' : 'Novo Post'}</h2>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Título do post"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/blog/</span>
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="titulo-do-post"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resumo / Excerpt</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Breve descrição do post (aparece nos cards e no SEO)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo *</label>
            <BlogEditor
              value={form.content}
              onChange={content => setForm(f => ({ ...f, content }))}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 text-sm">Publicação</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">Sem categoria</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="compra, dicas, apartamento"
              />
              <p className="text-xs text-gray-400 mt-1">Separadas por vírgula</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de capa (URL)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.cover_image_url}
                onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                placeholder="https://..."
              />
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="preview" className="mt-2 rounded-lg w-full h-32 object-cover" />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={saving} onClick={() => handleSave('draft')}>
                Salvar rascunho
              </Button>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" disabled={saving} onClick={() => handleSave('published')}>
                {saving ? 'Salvando...' : 'Publicar'}
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 text-sm">SEO</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título SEO</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.meta_title}
                onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                placeholder="Título para Google (padrão: título do post)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta descrição</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                value={form.meta_description}
                onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                placeholder="Descrição para Google (150–160 caracteres)"
                maxLength={160}
              />
              <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
