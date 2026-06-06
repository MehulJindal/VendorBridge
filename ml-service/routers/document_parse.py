from fastapi import APIRouter
from models.schemas import DocumentParseRequest, DocumentParseResponse
from services.document_parse_service import run_document_parse

router = APIRouter()


@router.post("/parse/document", response_model=DocumentParseResponse)
async def parse_document(req: DocumentParseRequest):
    """
    **Automated Document Parsing (OCR + LLM)**

    Accepts a base64-encoded PDF or image of an invoice or quotation sheet.
    Uses Claude Vision API to extract:
    - Line items (description, quantity, unit, unit_price, total_price)
    - Vendor name, invoice number, currency
    - Total amount, tax rate, tax amount

    Returns pre-filled procurement form data and a confidence score.
    """
    return await run_document_parse(req)
