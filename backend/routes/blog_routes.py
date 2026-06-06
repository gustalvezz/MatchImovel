"""
Blog routes — public read endpoints + admin CRUD
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from datetime import datetime, timezone
import uuid
import re
import logging
import os
import httpx
from openai import AsyncOpenAI

from database import db
from auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

_openai = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
_CLOUDINARY_CLOUD = "dfvdprrtl"
_CLOUDINARY_PRESET = "MatchImovel"

CATEGORIES = ["dicas", "mercado", "investimento", "novidades", "guias"]


def _slug(title: str) -> str:
    s = title.lower()
    for src, dst in [("àáâãä","a"),("èéêë","e"),("ìíîï","i"),("òóôõö","o"),("ùúûü","u"),("ç","c"),("ñ","n")]:
        for c in src:
            s = s.replace(c, dst)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return re.sub(r"-+", "-", s)


def _read_time(content: str) -> int:
    words = len(re.sub(r"<[^>]+>", " ", content).split())
    return max(1, round(words / 200))


@router.post("/admin/blog/generate-image")
async def generate_blog_image(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")

    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt obrigatório")

    # Prefixo fixo: composição centralizada, margens limpas, sem texto
    # Isso garante que a imagem funcione bem em qualquer tamanho de crop
    full_prompt = (
        f"Professional real estate blog cover photo, 16:9 horizontal format, "
        f"editorial photography style. Main subject centered with clean negative space "
        f"on the sides. Simple uncluttered composition that works well when cropped. "
        f"Bright and modern aesthetic, soft natural lighting. "
        f"Absolutely no text, no watermarks, no logos: {prompt}"
    )

    try:
        img_resp = await _openai.images.generate(
            model="dall-e-3",
            prompt=full_prompt,
            n=1,
            size="1792x1024",
            quality="standard",
            response_format="url",
        )
    except Exception as e:
        logger.error(f"DALL-E error: {e}")
        raise HTTPException(status_code=502, detail="Erro ao gerar imagem com IA")

    dalle_url = img_resp.data[0].url

    # Upload direto para Cloudinary usando unsigned preset
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            up = await client.post(
                f"https://api.cloudinary.com/v1_1/{_CLOUDINARY_CLOUD}/image/upload",
                data={"file": dalle_url, "upload_preset": _CLOUDINARY_PRESET},
            )
        result = up.json()
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=502, detail="Erro ao enviar imagem para Cloudinary")

    if "secure_url" not in result:
        logger.error(f"Cloudinary response: {result}")
        raise HTTPException(status_code=502, detail="Cloudinary não retornou URL")

    return {"url": result["secure_url"], "revised_prompt": img_resp.data[0].revised_prompt}


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("/blog/posts")
async def list_posts(category: str = None, limit: int = 9, offset: int = 0):
    query = {"status": "published"}
    if category:
        query["category"] = category
    total = await db.blog_posts.count_documents(query)
    posts = await db.blog_posts.find(
        query, {"_id": 0, "content": 0}
    ).sort("published_at", -1).skip(offset).limit(min(limit, 50)).to_list(50)
    return {"posts": posts, "total": total, "limit": limit, "offset": offset}


@router.get("/blog/posts/{slug}")
async def get_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    await db.blog_posts.update_one({"slug": slug}, {"$inc": {"view_count": 1}})
    related = await db.blog_posts.find(
        {"category": post.get("category"), "slug": {"$ne": slug}, "status": "published"},
        {"_id": 0, "content": 0}
    ).sort("published_at", -1).limit(3).to_list(3)
    return {"post": post, "related": related}


@router.get("/blog/sitemap.xml", response_class=Response)
async def blog_sitemap():
    posts = await db.blog_posts.find(
        {"status": "published"},
        {"slug": 1, "published_at": 1, "updated_at": 1, "_id": 0}
    ).sort("published_at", -1).to_list(1000)

    base = "https://matchimovel.com.br"
    items = f"""  <url>
    <loc>{base}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>"""

    for p in posts:
        lastmod = (p.get("updated_at") or p.get("published_at") or "")[:10]
        items += f"""
  <url>
    <loc>{base}/blog/{p['slug']}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>"""

    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{items}\n</urlset>'
    return Response(content=xml, media_type="application/xml")


@router.get("/blog/categories")
async def list_categories():
    pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = await db.blog_posts.aggregate(pipeline).to_list(20)
    return [{"category": r["_id"], "count": r["count"]} for r in result if r["_id"]]


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/admin/blog/posts")
async def admin_list_posts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    posts = await db.blog_posts.find(
        {}, {"_id": 0, "content": 0}
    ).sort("created_at", -1).to_list(500)
    return posts


@router.post("/admin/blog/posts")
async def create_post(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")

    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Título obrigatório")

    slug = (data.get("slug") or _slug(title)) or str(uuid.uuid4())[:8]
    if await db.blog_posts.find_one({"slug": slug}):
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"

    now = datetime.now(timezone.utc).isoformat()
    status = data.get("status", "draft")
    content = data.get("content", "")

    post = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": title,
        "excerpt": data.get("excerpt", ""),
        "content": content,
        "cover_image_url": data.get("cover_image_url", ""),
        "category": data.get("category", ""),
        "tags": data.get("tags", []),
        "meta_title": data.get("meta_title") or title,
        "meta_description": data.get("meta_description", ""),
        "author_name": current_user.get("name", "Admin"),
        "status": status,
        "read_time": _read_time(content),
        "created_at": now,
        "updated_at": now,
        "published_at": now if status == "published" else None,
        "view_count": 0,
    }
    await db.blog_posts.insert_one(post)
    post.pop("_id", None)
    return post


@router.put("/admin/blog/posts/{post_id}")
async def update_post(post_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")

    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    now = datetime.now(timezone.utc).isoformat()
    updates = {"updated_at": now}

    for field in ["title", "slug", "excerpt", "content", "cover_image_url",
                  "category", "tags", "meta_title", "meta_description", "status"]:
        if field in data:
            updates[field] = data[field]

    if "content" in data:
        updates["read_time"] = _read_time(data["content"])

    if data.get("status") == "published" and existing.get("status") != "published":
        updates["published_at"] = now

    await db.blog_posts.update_one({"id": post_id}, {"$set": updates})
    updated = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return updated


@router.delete("/admin/blog/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    return {"status": "deleted"}
