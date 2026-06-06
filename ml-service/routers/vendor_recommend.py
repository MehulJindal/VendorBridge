from fastapi import APIRouter
from models.schemas import RecommendRequest, RecommendResponse
from services.recommendation_service import run_recommendation

router = APIRouter()


@router.post("/recommend/vendors", response_model=RecommendResponse)
def recommend_vendors(req: RecommendRequest):
    """
    **Smart Vendor Recommendation Engine**

    Given an RFQ category and a list of historical vendor performance data,
    returns the top-3 vendors ranked by a weighted composite score:
    - Rating (30%), On-time delivery (30%), Win rate (25%), Price competitiveness (15%)

    Only verified + active vendors matching the RFQ category are considered.
    Falls back to all verified+active vendors if no category match found.
    """
    return run_recommendation(req)
