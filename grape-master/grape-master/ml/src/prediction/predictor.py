"""
Real-time recommendation predictor.

Scoring strategy (weighted):
  40%  Collaborative filtering (SVD) — what similar users bought
  35%  Content-based (crop-category affinity)
  15%  Popularity
  10%  Location proximity (same district sellers ranked higher)
"""
import os
import joblib
import numpy as np
import pandas as pd
from src.preprocessing.features import content_score, get_crop_affinity
from src.database import fetch_products, fetch_farmer_profile

MODEL_PATH = os.getenv("MODEL_PATH", "./models/recommendation_model.pkl")
_model_cache: dict | None = None


def load_model() -> dict:
    global _model_cache
    if _model_cache is None:
        if os.path.exists(MODEL_PATH):
            _model_cache = joblib.load(MODEL_PATH)
        else:
            _model_cache = {}
    return _model_cache


def reload_model() -> None:
    global _model_cache
    _model_cache = None
    load_model()


def _cf_scores(model: dict, user_id: str) -> dict[str, float]:
    """Return CF scores per product_id for this user."""
    cf = model.get("cf_model", {})
    if not cf or user_id not in cf.get("pivot_index", []):
        return {}
    idx = cf["pivot_index"].index(user_id)
    row = cf["reconstructed"][idx]
    return dict(zip(cf["pivot_columns"], row.tolist()))


def recommend(
    user_id: str,
    n: int = 8,
    exclude_product_ids: list[str] | None = None,
) -> list[dict]:
    model = load_model()
    live_products = fetch_products()

    if live_products.empty:
        return []

    farmer = fetch_farmer_profile(user_id)
    crop    = farmer.get("primary_crop", "General")
    district = farmer.get("district", "")
    max_price = float(live_products["price"].max() or 1)

    exclude = set(exclude_product_ids or [])
    cf_scores = _cf_scores(model, user_id)
    popular = model.get("popular_products", [])

    results = []
    for _, p in live_products.iterrows():
        pid = str(p["id"])
        if pid in exclude:
            continue

        # Content score
        cs = content_score(crop, str(p.get("category", "")), float(p.get("price", 0)), max_price)

        # CF score (normalised 0-1)
        raw_cf = cf_scores.get(pid, 0.0)
        cf_norm = min(raw_cf / 10.0, 1.0) if raw_cf > 0 else 0.0

        # Popularity score
        pop_score = 1.0 - (popular.index(pid) / len(popular)) if pid in popular else 0.0

        # Location proximity bonus
        loc_bonus = 0.05 if str(p.get("district", "")) == district else 0.0

        final_score = (cs * 0.35) + (cf_norm * 0.40) + (pop_score * 0.15) + loc_bonus

        # Build human-readable reason
        if cf_norm > 0.4:
            reason = f"Popular with farmers who grow {crop}"
        elif cs > 0.6:
            reason = f"Recommended for {crop} cultivation"
        elif pop_score > 0.5:
            reason = "Trending in your region"
        else:
            reason = "Matches your farming profile"

        results.append({
            "product_id":    pid,
            "product_name":  str(p.get("name", "")),
            "category":      str(p.get("category", "")),
            "score":         round(final_score, 4),
            "reason":        reason,
            "model_version": model.get("version", "rule-based-v1"),
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:n]
