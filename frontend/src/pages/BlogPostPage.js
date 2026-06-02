import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppLogo from '@/components/AppLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function RelatedCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex gap-3 items-start">
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-xl">🏠</div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">{post.title}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(post.published_at)}</p>
      </div>
    </Link>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/blog/posts/${slug}`)
      .then(({ data }) => {
        setPost(data.post);
        setRelated(data.related || []);
        // Update page meta
        document.title = `${data.post.meta_title || data.post.title} | MatchImóvel Blog`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.post.meta_description || data.post.excerpt || '');
      })
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false));

    return () => { document.title = 'MatchImóvel'; };
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-white shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <AppLogo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Cadastrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {/* Cover image */}
        {post.cover_image_url && (
          <div className="w-full h-72 md:h-96 overflow-hidden bg-gray-200">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex gap-10 flex-col lg:flex-row">
            {/* Article */}
            <article className="flex-1 min-w-0">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4" /> Voltar ao blog
              </Link>

              {post.category && (
                <Badge variant="outline" className="capitalize text-xs mb-4 border-blue-200 text-blue-700 bg-blue-50">
                  {post.category}
                </Badge>
              )}

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
                {post.author_name && <span className="font-medium text-gray-600">Por {post.author_name}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(post.published_at)}</span>
                {post.read_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.read_time} min de leitura</span>}
              </div>

              {/* Content */}
              <div
                className="prose prose-gray max-w-none blog-post-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-200">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Bottom CTA */}
              <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-3">Pronto para encontrar seu imóvel?</h2>
                <p className="text-blue-100 mb-6">Cadastre seu perfil e conecte-se com corretores que têm o imóvel certo para você.</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button className="bg-white text-blue-700 hover:bg-blue-50" size="lg">
                      Sou comprador <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10" size="lg">
                      Sou corretor
                    </Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-72 shrink-0 space-y-6">
              {/* Related posts */}
              {related.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Posts relacionados</h3>
                  <div className="space-y-4">
                    {related.map(r => <RelatedCard key={r.id} post={r} />)}
                  </div>
                </div>
              )}

              {/* CTA card */}
              <div className="bg-blue-600 rounded-2xl p-6 text-white sticky top-24">
                <h3 className="font-bold text-lg mb-2">Encontre seu imóvel ideal</h3>
                <p className="text-blue-100 text-sm mb-4">Cadastre seu perfil gratuitamente e receba propostas de corretores.</p>
                <Link to="/register">
                  <Button className="w-full bg-white text-blue-700 hover:bg-blue-50" size="sm">
                    Começar agora <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <div className="mt-3 pt-3 border-t border-blue-500">
                  <a href="https://wa.me/5511000000000" target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white/10" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" /> Via WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <style>{`
        .blog-post-content h2 { font-size: 1.75rem; font-weight: 700; margin: 2rem 0 0.75rem; color: #111827; }
        .blog-post-content h3 { font-size: 1.375rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #1f2937; }
        .blog-post-content p  { margin: 1rem 0; color: #374151; line-height: 1.8; }
        .blog-post-content ul { list-style: disc; padding-left: 1.75rem; margin: 1rem 0; color: #374151; }
        .blog-post-content ol { list-style: decimal; padding-left: 1.75rem; margin: 1rem 0; color: #374151; }
        .blog-post-content li { margin: 0.375rem 0; line-height: 1.7; }
        .blog-post-content blockquote { border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; background: #eff6ff; border-radius: 0 0.5rem 0.5rem 0; margin: 1.5rem 0; color: #1e40af; font-style: italic; }
        .blog-post-content a  { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
        .blog-post-content a:hover { color: #1d4ed8; }
        .blog-post-content img { max-width: 100%; border-radius: 0.75rem; margin: 1.5rem 0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .blog-post-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
        .blog-post-content strong { font-weight: 700; color: #111827; }
        .blog-post-content em { font-style: italic; }
      `}</style>
    </div>
  );
}
