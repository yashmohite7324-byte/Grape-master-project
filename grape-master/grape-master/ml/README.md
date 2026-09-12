# 🤖 Grape Master — ML Recommendation Service (FastAPI)

Standalone Python service that the Node.js backend calls for personalized agricultural input recommendations.

## Architecture

```
Node.js backend → POST /recommend → ML service → PostgreSQL (same DB)
                                              → Model file (pkl)
                                              → Return ranked list
```

## Algorithm

**Hybrid recommender** combining:
- **Collaborative Filtering** (SVD) — 40% weight: "farmers like you bought this"
- **Content-based** — 35% weight: crop-category affinity (grapes → NPK, MOP, fungicide)
- **Popularity** — 15% weight: most purchased platform-wide
- **Location bonus** — 10%: nearby sellers ranked slightly higher

## Setup

```bash
cd ml
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # set DATABASE_URL

# Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/model/info` | Model version + training date |
| POST | `/recommend` | Get top-N recommendations for a user |
| POST | `/train` | Trigger background retraining |
| GET | `/analytics` | ML funnel analytics for admin |

## Trigger training

```bash
# Manual training (first time)
python -m src.training.train

# Or via API (async, runs in background)
curl -X POST http://localhost:8000/train
```

## Example request

```bash
curl -X POST http://localhost:8000/recommend \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "YOUR_FARMER_USER_ID", "n": 8}'
```

## Response

```json
{
  "user_id": "...",
  "recommendations": [
    {
      "product_id": "...",
      "product_name": "NPK 10-26-26",
      "category": "NPK",
      "score": 0.8724,
      "reason": "Recommended for Grapes cultivation",
      "model_version": "20260830_120000"
    }
  ],
  "model_version": "20260830_120000",
  "generated_at": "2026-08-30T12:00:00"
}
```

## Notes

- First run without training data uses rule-based fallback (crop-category affinity)
- Model retrains automatically when `/train` is called or after 24h (configurable)
- Reads the same PostgreSQL database as the Node.js backend (read-only)
- Model stored as a `.pkl` file in `./models/`
