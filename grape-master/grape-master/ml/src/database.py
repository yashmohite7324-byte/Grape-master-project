"""
Database connector — reads from the same PostgreSQL that Node.js writes to.
Uses SQLAlchemy Core (no ORM) to keep the ML service independent.
"""
import os
from sqlalchemy import create_engine, text
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/grape_master")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def query_df(sql: str, params: dict | None = None) -> pd.DataFrame:
    """Execute SQL and return a DataFrame."""
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        return pd.DataFrame(result.fetchall(), columns=list(result.keys()))


def fetch_user_behaviors() -> pd.DataFrame:
    return query_df("""
        SELECT ub.user_id, ub.product_id, ub.event_type,
               ub.timestamp, p.category, p.price,
               fp.primary_crop, pr.district, pr.state
        FROM user_behavior ub
        LEFT JOIN products p ON ub.product_id = p.id
        LEFT JOIN farmer_profiles fp ON fp.user_id = ub.user_id
        LEFT JOIN profiles pr ON pr.user_id = ub.user_id
        WHERE ub.product_id IS NOT NULL
        ORDER BY ub.timestamp DESC
    """)


def fetch_purchases() -> pd.DataFrame:
    return query_df("""
        SELECT o.buyer_id AS user_id, oi.product_id,
               p.category, p.price, o.created_at,
               fp.primary_crop, pr.district
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        LEFT JOIN farmer_profiles fp ON fp.user_id = o.buyer_id
        LEFT JOIN profiles pr ON pr.user_id = o.buyer_id
        WHERE o.payment_status = 'SUCCESS'
    """)


def fetch_products() -> pd.DataFrame:
    return query_df("""
        SELECT p.id, p.name, p.category, p.price, p.brand, p.unit,
               si.available_quantity,
               pr.district, pr.latitude, pr.longitude
        FROM products p
        JOIN seller_inventory si ON si.product_id = p.id
        JOIN profiles pr ON pr.user_id = p.seller_id
        WHERE p.is_active = true AND si.available_quantity > 0
    """)


def fetch_farmer_profile(user_id: str) -> dict:
    df = query_df("""
        SELECT fp.primary_crop, pr.district, pr.state,
               pr.latitude, pr.longitude
        FROM farmer_profiles fp
        JOIN profiles pr ON pr.user_id = fp.user_id
        WHERE fp.user_id = :uid
    """, {"uid": user_id})
    return df.iloc[0].to_dict() if not df.empty else {}


def save_recommendations(recommendations: list[dict]) -> None:
    """Insert generated recommendations into the DB (upsert by user+product)."""
    with engine.connect() as conn:
        for rec in recommendations:
            conn.execute(text("""
                INSERT INTO recommendations (id, user_id, product_id, model_version, score, reason, generated_at)
                VALUES (gen_random_uuid(), :user_id, :product_id, :model_version, :score, :reason, NOW())
                ON CONFLICT (user_id, product_id) DO UPDATE
                  SET score = EXCLUDED.score,
                      reason = EXCLUDED.reason,
                      model_version = EXCLUDED.model_version,
                      generated_at = NOW()
            """), rec)
        conn.commit()
