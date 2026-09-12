"""
Feature engineering for the Grape Master recommendation system.

Produces a user-product feature matrix used by both the training
pipeline and the real-time scorer.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler


CROP_CATEGORY_AFFINITY: dict[str, list[str]] = {
    "Grapes":      ["NPK", "MOP", "MICRONUTRIENT", "FUNGICIDE", "DAP"],
    "Onion":       ["DAP", "UREA", "SSP", "FUNGICIDE"],
    "Tomato":      ["DAP", "NPK", "PESTICIDE", "MICRONUTRIENT"],
    "Wheat":       ["UREA", "DAP", "SSP", "MOP"],
    "Cotton":      ["UREA", "DAP", "PESTICIDE", "MOP"],
    "Sugarcane":   ["UREA", "SSP", "MOP", "MICRONUTRIENT"],
    "Rice":        ["UREA", "DAP", "PESTICIDE", "SSP"],
    "General":     ["DAP", "UREA", "NPK"],
}

EVENT_WEIGHTS = {
    "PURCHASE":             5.0,
    "ADD_TO_CART":          3.0,
    "RECOMMENDATION_CLICK": 2.5,
    "CLICK":                2.0,
    "PRODUCT_VIEW":         1.0,
    "SEARCH":               0.5,
    "WISHLIST":             1.5,
    "REMOVE_FROM_CART":    -1.0,
}


def get_crop_affinity(crop: str, category: str) -> float:
    """Return 1.0 if the product category is recommended for this crop."""
    categories = CROP_CATEGORY_AFFINITY.get(crop, CROP_CATEGORY_AFFINITY["General"])
    if category in categories:
        return 1.0 - (categories.index(category) * 0.1)
    return 0.0


def build_user_item_matrix(behaviors: pd.DataFrame, purchases: pd.DataFrame) -> pd.DataFrame:
    """
    Build user × product implicit-feedback matrix.
    Combines weighted behavior events with purchase counts.
    """
    if behaviors.empty and purchases.empty:
        return pd.DataFrame()

    rows = []

    if not behaviors.empty:
        for _, row in behaviors.iterrows():
            weight = EVENT_WEIGHTS.get(row["event_type"], 0.5)
            rows.append({
                "user_id": row["user_id"],
                "product_id": row["product_id"],
                "score": weight,
            })

    if not purchases.empty:
        for _, row in purchases.iterrows():
            rows.append({
                "user_id": row["user_id"],
                "product_id": row["product_id"],
                "score": EVENT_WEIGHTS["PURCHASE"],
            })

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    matrix = df.groupby(["user_id", "product_id"])["score"].sum().reset_index()
    return matrix


def build_product_features(products: pd.DataFrame) -> pd.DataFrame:
    """
    Create a normalised product feature vector.
    Encodes category, price bucket, and availability.
    """
    if products.empty:
        return pd.DataFrame()

    df = products.copy()

    le = LabelEncoder()
    df["category_enc"] = le.fit_transform(df["category"].fillna("OTHER"))

    scaler = MinMaxScaler()
    df[["price_norm", "stock_norm"]] = scaler.fit_transform(
        df[["price", "available_quantity"]].fillna(0)
    )

    return df[["id", "name", "category", "category_enc", "price", "price_norm", "stock_norm"]]


def content_score(user_crop: str, product_category: str, product_price: float, max_price: float) -> float:
    """Content-based score for a (user-crop, product) pair."""
    affinity  = get_crop_affinity(user_crop, product_category)
    price_fit = 1.0 - min(product_price / max(max_price, 1), 1.0) * 0.3  # cheaper is slightly preferred
    return round(affinity * 0.7 + price_fit * 0.3, 4)
