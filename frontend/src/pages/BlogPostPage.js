import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppLogo from '@/components/AppLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, ArrowRight, MessageCircle, Share2, Link2, Check } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { cloudinaryImg } from '@/utils/cloudinary';

const API = process.env.REACT_APP_BACKEND_URL;

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function ShareButtons({ post }) {
  const [copied, setCopied] = useState(false);
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(post.title || '');
  const excerpt = encodeURIComponent(post.excerpt || post.title || '');

  const shares = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${title}%20${url}`,
      bg: 'bg-[#25D366] hover:bg-[#1ebe5e]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      bg: 'bg-[#1877F2] hover:bg-[#166fe5]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      bg: 'bg-black hover:bg-gray-800',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      bg: 'bg-[#0A66C2] hover:bg-[#095bb5]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      label: 'Threads',
      href: `https://www.threads.net/intent/post?text=${title}%20${url}`,
      bg: 'bg-gray-900 hover:bg-gray-700',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 1.868-.015 3.421-.364 4.594-1.035 1.344-.77 2.064-1.983 2.14-3.6v-.003c-.07-1.497-.554-2.52-1.44-3.04-.613-.359-1.368-.54-2.249-.54-.17 0-.34.006-.51.018-.28.014-.567.043-.857.088a7.127 7.127 0 01-1.153.088c-2.064 0-3.536-.607-4.376-1.804-.672-.956-.978-2.273-.91-3.914.076-1.872.618-3.318 1.611-4.297.987-.974 2.386-1.467 4.158-1.467.71 0 1.384.077 2.007.228 1.348.325 2.44 1.009 3.246 2.033l-1.65 1.234c-.56-.748-1.33-1.235-2.292-1.469a6.4 6.4 0 00-1.311-.152c-1.207 0-2.12.295-2.714.878-.587.576-.904 1.5-.943 2.746-.05 1.18.162 2.054.63 2.597.464.537 1.255.809 2.352.809.27 0 .547-.016.824-.047.34-.038.684-.078 1.024-.078.984 0 1.893.18 2.706.534 1.567.68 2.533 2.02 2.636 4.04.12 2.354-.725 4.197-2.514 5.32-1.37.844-3.096 1.28-5.13 1.296z"/>
        </svg>
      ),
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-8 pt-8 border-t border-gray-200">
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mr-1">
        <Share2 className="w-4 h-4" /> Compartilhar:
      </span>
      {shares.map(s => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noreferrer noopener"
          title={`Compartilhar no ${s.label}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all ${s.bg}`}
        >
          {s.icon}
          <span className="hidden sm:inline">{s.label}</span>
        </a>
      ))}
      <button
        onClick={handleCopy}
        title="Copiar link"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          copied
            ? 'bg-green-50 border-green-300 text-green-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar link'}</span>
      </button>
    </div>
  );
}

function RelatedCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex gap-3 items-start">
      {post.cover_image_url ? (
        <img src={cloudinaryImg(post.cover_image_url, { width: 128, height: 128 })} alt={post.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
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

  useSEO({
    title:       post ? (post.meta_title || post.title) : undefined,
    description: post ? (post.meta_description || post.excerpt) : undefined,
    image:       post?.cover_image_url || undefined,
    path:        `/blog/${slug}`,
    type:        'article',
    article:     post,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/api/blog/posts/${slug}`)
      .then(({ data }) => {
        setPost(data.post);
        setRelated(data.related || []);
      })
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false));
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
          <Link to="/" className="flex items-center gap-2">
            <AppLogo className="h-8 w-auto" />
            <span className="text-xl font-bold"><span className="text-slate-900">Match</span><span className="text-indigo-600">Imovel</span></span>
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
            <img src={cloudinaryImg(post.cover_image_url, { width: 1400, height: 560 })} alt={post.title} className="w-full h-full object-cover" />
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

              {/* Share */}
              <ShareButtons post={post} />

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
