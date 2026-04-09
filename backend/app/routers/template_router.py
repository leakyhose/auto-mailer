from fastapi import APIRouter, HTTPException

from ..models import TemplateContent, TemplateParseRequest
from ..services import template_service
from ..services.persistence import load_store, save_store

router = APIRouter()


@router.get("")
async def get_all_templates():
    store = load_store()
    return store.get("templates", {})


@router.get("/{name}")
async def get_template(name: str):
    store = load_store()
    templates = store.get("templates", {})
    if name not in templates:
        raise HTTPException(404, f"Template '{name}' not found")
    return templates[name]


@router.put("/{name}")
async def save_template(name: str, content: TemplateContent):
    store = load_store()
    if "templates" not in store:
        store["templates"] = {}
    store["templates"][name] = {"subject": content.subject, "body": content.body}
    save_store(store)
    return {"status": "ok"}


@router.post("/{name}/parse")
async def parse_template(name: str, req: TemplateParseRequest):
    try:
        subject, body = template_service.parse_raw_template(req.raw_text)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return TemplateContent(subject=subject, body=body)


@router.delete("/{name}")
async def delete_template(name: str):
    store = load_store()
    templates = store.get("templates", {})
    if name in templates:
        del templates[name]
        store["templates"] = templates
        save_store(store)
    return {"status": "ok"}
