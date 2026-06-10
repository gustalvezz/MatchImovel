import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AppLogo from '@/components/AppLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, MessageCircle, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { cloudinaryImg } from '@/utils/cloudinary';
import { useAuth } from '@/context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      {post.cover_image_url ? (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img src={cloudinaryImg(post.cover_image_url, { width: 600, height: 340 })} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <span className="text-4xl opacity-40">🏠</span>
        </div>
      )}
      <div className="p-5">
        {post.category && (
          <Badge variant="outline" className="capitalize text-xs mb-3 border-blue-200 text-blue-700 bg-blue-50">
            {post.category}
          </Badge>
        )}
        <h2 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.published_at)}</span>
          {post.read_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time} min</span>}
        </div>
      </div>
    </Link>
  );
}

// Modal para gerenciar categorias (admin only)
function CategoryModal({ onClose, onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/admin/blog/categories`);
      setCategories(data);
    } catch {
      setError('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setSaving(true);
    setError('');
    try {
      await axios.post(`${API}/api/admin/blog/categories`, { label });
      setNewLabel('');
      await fetchCategories();
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao criar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    const label = editLabel.trim();
    if (!label) return;
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/api/admin/blog/categories/${id}`, { label });
      setEditingId(null);
      setEditLabel('');
      await fetchCategories();
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao atualizar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Excluir a categoria "${label}"?`)) return;
    try {
      await axios.delete(`${API}/api/admin/blog/categories/${id}`);
      await fetchCategories();
      onRefresh();
    } catch {
      setError('Erro ao excluir categoria.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Gerenciar Categorias</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma categoria ainda.</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                {editingId === cat.id ? (
                  <>
                    <input
                      className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                      autoFocus
                    />
                    <Button size="sm" disabled={saving} onClick={() => handleUpdate(cat.id)} className="h-8 px-3">
                      Salvar
                    </Button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-800">{cat.label}</span>
                    <span className="text-xs text-gray-400 font-mono">{cat.value}</span>
                    <button
                      onClick={() => { setEditingId(cat.id); setEditLabel(cat.label); }}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Renomear"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.label)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-6 pb-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nova categoria..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" disabled={saving || !newLabel.trim()} onClick={handleCreate} className="gap-1">
              <Plus className="w-4 h-4" /> Criar
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Renomear uma categoria não altera os posts já cadastrados com ela.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BlogListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const LIMIT = 9;

  useSEO({
    title:       'Blog — Dicas e tendências do mercado imobiliário',
    description: 'Artigos sobre compra e venda de imóveis, dicas para compradores, tendências de mercado e guias para corretores. Conteúdo do MatchImóvel.',
    path:        '/blog',
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCategories = useCallback(() => {
    axios.get(`${API}/api/blog/categories`)
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    const params = { limit: LIMIT, offset };
    if (category) params.category = category;
    axios.get(`${API}/api/blog/posts`, { params })
      .then(({ data }) => { setPosts(data.posts); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, offset]);

  const handleCategory = (cat) => { setCategory(cat); setOffset(0); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-white shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <AppLogo className="h-8 w-auto" />
            <span className="text-xl font-bold"><span className="text-slate-900">Match</span><span className="text-indigo-600">Imovel</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b pt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Blog MatchImóvel</h1>
          <p className="text-lg text-gray-500 max-w-xl">Dicas, tendências e guias para compradores e corretores do mercado imobiliário.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Posts grid */}
          <div className="flex-1">
            {/* Category filter */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <button
                onClick={() => handleCategory('')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                Todos
              </button>
              {categories.map(c => (
                <button
                  key={c.value}
                  onClick={() => handleCategory(c.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === c.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => setShowCategoryModal(true)}
                  title="Gerenciar categorias"
                  className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-blue-400 text-blue-500 hover:border-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-video bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl font-medium">Nenhum post encontrado</p>
                {category && <p className="text-sm mt-1">Tente outra categoria</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
            )}

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex justify-center gap-3 mt-10">
                <Button variant="outline" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>
                  Anterior
                </Button>
                <span className="flex items-center text-sm text-gray-500">
                  {Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <Button variant="outline" disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>
                  Próxima
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            {/* CTA compradores */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Encontre seu imóvel ideal</h3>
              <p className="text-blue-100 text-sm mb-4">Cadastre seu perfil e receba propostas de corretores que têm o imóvel certo para você.</p>
              <Link to="/register">
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50" size="sm">
                  Cadastrar agora <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* CTA corretores */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">É corretor?</h3>
              <p className="text-gray-300 text-sm mb-4">Acesse perfis reais de compradores ativos e feche mais negócios.</p>
              <Link to="/register">
                <Button className="w-full bg-white text-gray-900 hover:bg-gray-100" size="sm">
                  Sou corretor <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* WhatsApp CTA */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900">Fale no WhatsApp</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">Cadastre seu interesse ou imóvel diretamente pelo WhatsApp em poucos minutos.</p>
              <a href="https://wa.me/5511000000000" target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50" size="sm">
                  Abrir WhatsApp
                </Button>
              </a>
            </div>
          </aside>
        </div>
      </div>

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onRefresh={fetchCategories}
        />
      )}
    </div>
  );
}
