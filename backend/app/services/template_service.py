import re


def parse_raw_template(raw_text: str) -> tuple[str, str]:
    """Parse a raw template text with Subject: and Body: markers.

    Returns (subject, body).
    """
    lines = raw_text.strip().split("\n")

    subject = ""
    body_lines = []
    in_body = False

    for line in lines:
        if not in_body and line.strip().lower().startswith("subject:"):
            subject = line.strip()[len("subject:"):].strip()
        elif line.strip().lower().startswith("body:"):
            in_body = True
            # If there's text after "Body:" on the same line, include it
            remainder = line.strip()[len("body:"):].strip()
            if remainder:
                body_lines.append(remainder)
        elif in_body:
            body_lines.append(line)

    if not subject:
        raise ValueError("Template must contain a 'Subject:' line")

    body = "\n".join(body_lines).strip()
    return subject, body


def render_template(subject: str, body: str, contact: dict[str, str], sender_name: str) -> tuple[str, str]:
    """Replace all {PLACEHOLDER} tokens in subject and body.

    Replaces {NAME} with sender_name, and any {COLUMN} with the contact's value.
    """
    def replace(text: str) -> str:
        # Replace {NAME} with sender name
        text = text.replace("{NAME}", sender_name)

        # Replace any {COLUMN} with the contact's value
        def replacer(match):
            key = match.group(1)
            return contact.get(key, match.group(0))

        text = re.sub(r"\{([A-Z_]+)\}", replacer, text)
        return text

    return replace(subject), replace(body)
