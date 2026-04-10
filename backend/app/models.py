from pydantic import BaseModel


class SettingsResponse(BaseModel):
    custom_tags: dict[str, str]
    signature: str


class SettingsUpdate(BaseModel):
    custom_tags: dict[str, str]
    signature: str


class Contact(BaseModel):
    data: dict[str, str]


class CsvUploadResponse(BaseModel):
    contacts: list[dict[str, str]]
    headers: list[str]
    template_names: list[str]
    raw_text: str


class CsvUpdateRequest(BaseModel):
    raw_text: str


class TemplateContent(BaseModel):
    subject: str
    body: str


class TemplateParseRequest(BaseModel):
    raw_text: str


class AuthStatusResponse(BaseModel):
    connected: bool
    email: str | None = None


class GmailConfigRequest(BaseModel):
    email: str
    app_password: str


class AttachmentInfo(BaseModel):
    filename: str
    size: int


class EmailPreview(BaseModel):
    to: str
    contact_name: str
    company_name: str
    template_name: str
    subject: str
    body: str
    body_html: str
    contact_index: int


class SendResult(BaseModel):
    to: str
    contact_name: str
    status: str  # "sent" or "failed"
    error: str | None = None
    message_id: str | None = None
    contact_index: int


class RetryRequest(BaseModel):
    indices: list[int]
