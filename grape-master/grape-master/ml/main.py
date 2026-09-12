"""
Grape Master — ML Recommendation Service
FastAPI server that the Node.js backend calls.

Endpoints:
  POST /recommend          → get recommendations for a user
  POST /train              → trigger model retraining
  GET  /health             → liveness check
  GET  /model/info         → model version + training date
  POST /analytics          → ML analytics for admin dashboard
"""
import os
import threading
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from src.prediction.predictor import recommend, reload_model, load_model
from src.training.train import train
from src.database import fetch_user_behaviors, fetch_purchases

app = FastAPI(
    title="Grape Master ML Service",
    description="Recommendation engine for agricultural inputs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_training_lock = threading.Lock()
_last_trained: str | None = None


# ── Schemas ──

class RecommendRequest(BaseModel):
    user_id: str
    n: int = 8
    exclude_product_ids: list[str] = []


class RecommendResponse(BaseModel):
    user_id: str
    recommendations: list[dict]
    model_version: str
    generated_at: str


# ── Endpoints ──

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "grape-master-ml",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/model/info")
def model_info():
    model = load_model()
    return {
        "version":      model.get("version", "not-trained"),
        "trained_at":   model.get("trained_at", None),
        "has_cf_model": bool(model.get("cf_model")),
        "product_count": len(model.get("products_df", [])),
    }


@app.post("/recommend", response_model=RecommendResponse)
def get_recommendations(req: RecommendRequest):
    try:
        recs = recommend(
            user_id=req.user_id,
            n=req.n,
            exclude_product_ids=req.exclude_product_ids,
        )
        model = load_model()
        return RecommendResponse(
            user_id=req.user_id,
            recommendations=recs,
            model_version=model.get("version", "rule-based-v1"),
            generated_at=datetime.now().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
def trigger_training(background_tasks: BackgroundTasks):
    """Trigger model retraining in the background."""
    if _training_lock.locked():
        return {"message": "Training already in progress"}

    def _train():
        global _last_trained
        with _training_lock:
            train()
            reload_model()
            _last_trained = datetime.now().isoformat()

    background_tasks.add_task(_train)
    return {"message": "Training started in background"}


@app.get("/analytics")
def ml_analytics():
    """Admin ML analytics — behavior counts and conversion funnel."""
    behaviors = fetch_user_behaviors()
    purchases  = fetch_purchases()

    if behaviors.empty:
        return {
            "total_events": 0,
            "recommendation_views": 0,
            "recommendation_clicks": 0,
            "add_to_cart": 0,
            "purchases": len(purchases),
            "conversion_rate": 0.0,
            "top_categories": [],
        }

    views  = int((behaviors["event_type"] == "RECOMMENDATION_VIEW").sum())
    clicks = int((behaviors["event_type"] == "RECOMMENDATION_CLICK").sum())
    carts  = int((behaviors["event_type"] == "ADD_TO_CART").sum())
    total  = len(behaviors)

    conversion = round(len(purchases) / max(views, 1) * 100, 2)

    top_cats: list[dict] = []
    if "category" in behaviors.columns:
        top_cats = (
            behaviors.groupby("category").size()
            .sort_values(ascending=False)
            .head(5)
            .reset_index(name="count")
            .rename(columns={"category": "name"})
            .to_dict("records")
        )

    return {
        "total_events":          total,
        "recommendation_views":  views,
        "recommendation_clicks": clicks,
        "add_to_cart":           carts,
        "purchases":             len(purchases),
        "conversion_rate":       conversion,
        "top_categories":        top_cats,
        "last_trained":          _last_trained,
        "model_version":         load_model().get("version", "not-trained"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("ML_HOST", "0.0.0.0"),
        port=int(os.getenv("ML_PORT", 8000)),
        reload=True,
    )
