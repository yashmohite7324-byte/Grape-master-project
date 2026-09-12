"""
Training pipeline for Grape Master recommendation engine.

Architecture: Hybrid = Collaborative Filtering (SVD / matrix factorisation)
              +  Content-based (crop-category affinity)
              +  Popularity fallback

Run:
    python -m src.training.train
"""
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from sklearn.metrics.pairwise import cosine_similarity

from src.database import fetch_user_behaviors, fetch_purchases, fetch_products
from src.preprocessing.features import (
    build_user_item_matrix,
    build_product_features,
    content_score,
)

MODEL_PATH = os.getenv("MODEL_PATH", "./models/recommendation_model.pkl")


def train() -> dict:
    print(f"[{datetime.now()}] Starting Grape Master ML training…")

    # ── 1. Fetch data ──
    behaviors = fetch_user_behaviors()
    purchases  = fetch_purchases()
    products   = fetch_products()

    if products.empty:
        print("No products found — skipping training.")
        return {}

    # ── 2. Build user-item matrix ──
    uim = build_user_item_matrix(behaviors, purchases)
    product_features = build_product_features(products)

    # ── 3. Collaborative filtering (SVD) ──
    cf_model = {}
    if not uim.empty and len(uim["user_id"].unique()) >= 3:
        pivot = uim.pivot_table(index="user_id", columns="product_id", values="score", fill_value=0)
        sparse = csr_matrix(pivot.values)
        k = min(10, min(sparse.shape) - 1)
        U, sigma, Vt = svds(sparse.toarray(), k=k)
        reconstructed = np.dot(np.dot(U, np.diag(sigma)), Vt)
        cf_model = {
            "pivot_index": list(pivot.index),
            "pivot_columns": list(pivot.columns),
            "reconstructed": reconstructed,
        }
        print(f"  SVD: {sparse.shape[0]} users × {sparse.shape[1]} products, k={k}")
    else:
        print("  Not enough users for SVD — using content-only mode.")

    # ── 4. Product similarity matrix (for item-based CF) ──
    similarity_matrix: np.ndarray | None = None
    if not product_features.empty:
        feat_cols = [c for c in ["category_enc", "price_norm", "stock_norm"] if c in product_features.columns]
        mat = product_features[feat_cols].fillna(0).values
        similarity_matrix = cosine_similarity(mat)

    # ── 5. Popularity ranking ──
    popular_products: list[str] = []
    if not purchases.empty:
        popular_products = (
            purchases.groupby("product_id")
            .size()
            .sort_values(ascending=False)
            .head(20)
            .index.tolist()
        )

    # ── 6. Bundle and save ──
    model_bundle = {
        "version": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "cf_model": cf_model,
        "product_features": product_features,
        "similarity_matrix": similarity_matrix,
        "popular_products": popular_products,
        "products_df": products,
        "trained_at": datetime.now().isoformat(),
    }

    os.makedirs(os.path.dirname(MODEL_PATH) if os.path.dirname(MODEL_PATH) else ".", exist_ok=True)
    joblib.dump(model_bundle, MODEL_PATH)
    print(f"  Model saved → {MODEL_PATH}  (version {model_bundle['version']})")
    return model_bundle


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    train()
