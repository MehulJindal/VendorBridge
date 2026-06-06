"""
Automated Document Parsing  (OCR + LLM)
-----------------------------------------
Accepts a base64-encoded PDF or image (invoice / quotation sheet),
sends it to Claude claude-sonnet-4-20250514 as a vision document, and asks the model
to extract structured procurement fields.

Returns:
  - line_items        (list of {description, quantity, unit, unit_price, total_price})
  - vendor_name
  - invoice_number
  - total_amount
  - tax_rate / tax_amount
  - currency
  - confidence (heuristic: based on how many fields were found)
  - raw_text_preview  (first 500 chars of extracted text)
"""

import base64
import json
import re
import httpx
from models.schemas import (
    DocumentParseRequest,
    DocumentParseResponse,
    ParsedLineItem,
)
from utils.logger import logger


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"

EXTRACTION_PROMPT = """You are a procurement document parser.
Extract ALL structured data from the attached invoice or quotation document.

Return ONLY a valid JSON object (no markdown, no preamble) with this exact shape:
{
  "vendor_name": "<string or null>",
  "invoice_number": "<string or null>",
  "currency": "<3-letter ISO code or USD>",
  "total_amount": <number or null>,
  "tax_rate": <number as percentage e.g. 18 for 18% or null>,
  "tax_amount": <number or null>,
  "line_items": [
    {
      "description": "<item description>",
      "quantity": <number>,
      "unit": "<unit string e.g. pcs, kg, hrs>",
      "unit_price": <number>,
      "total_price": <number>
    }
  ],
  "raw_text_preview": "<first 300 characters of raw text you can read from the document>"
}

Rules:
- For missing/unreadable fields use null.
- Ensure total_price = quantity * unit_price for each line item (recalculate if needed).
- If the document is not an invoice or quotation return an empty line_items array.
"""


def _build_confidence(parsed: dict) -> float:
    """Heuristic: count filled fields / total expected fields."""
    checks = [
        bool(parsed.get("vendor_name")),
        bool(parsed.get("invoice_number")),
        parsed.get("total_amount") is not None,
        len(parsed.get("line_items", [])) > 0,
        bool(parsed.get("currency")),
    ]
    return round(sum(checks) / len(checks), 2)


async def run_document_parse(req: DocumentParseRequest) -> DocumentParseResponse:
    """
    Send document to Claude Vision API and parse the JSON response.
    Falls back to an empty result on any error.
    """
    # Determine media type
    if req.file_type == "pdf":
        media_type = "application/pdf"
        content_type_block = {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": req.file_base64,
            },
        }
    else:
        # image — detect sub-type from base64 header or filename
        if req.file_base64.startswith("/9j"):
            media_type = "image/jpeg"
        elif req.file_base64.startswith("iVBOR"):
            media_type = "image/png"
        else:
            media_type = "image/jpeg"  # safe default

        content_type_block = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": req.file_base64,
            },
        }

    payload = {
        "model": MODEL,
        "max_tokens": 1500,
        "messages": [
            {
                "role": "user",
                "content": [
                    content_type_block,
                    {"type": "text", "text": EXTRACTION_PROMPT},
                ],
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                ANTHROPIC_API_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        raw_text = data["content"][0]["text"].strip()

        # Strip markdown fences if model adds them
        raw_text = re.sub(r"^```json\s*", "", raw_text)
        raw_text = re.sub(r"```$", "", raw_text).strip()

        parsed = json.loads(raw_text)

    except Exception as e:
        logger.error(f"Document parse error: {e}")
        # Return a safe fallback
        return DocumentParseResponse(
            line_items=[],
            vendor_name=None,
            invoice_number=None,
            total_amount=None,
            tax_rate=None,
            tax_amount=None,
            currency="USD",
            confidence=0.0,
            raw_text_preview="Parsing failed — check logs.",
        )

    line_items = [
        ParsedLineItem(
            description=item.get("description", ""),
            quantity=float(item.get("quantity") or 0),
            unit=item.get("unit", "pcs"),
            unit_price=float(item.get("unit_price") or 0),
            total_price=float(item.get("total_price") or 0),
        )
        for item in parsed.get("line_items", [])
    ]

    return DocumentParseResponse(
        line_items=line_items,
        vendor_name=parsed.get("vendor_name"),
        invoice_number=parsed.get("invoice_number"),
        total_amount=parsed.get("total_amount"),
        tax_rate=parsed.get("tax_rate"),
        tax_amount=parsed.get("tax_amount"),
        currency=parsed.get("currency") or "USD",
        confidence=_build_confidence(parsed),
        raw_text_preview=(parsed.get("raw_text_preview") or "")[:500],
    )
