# Backend patch (2 small additions)

The frontend works with your backend as uploaded **except for two gaps**. Both are tiny, additive changes;
nothing existing is removed or modified.

| Gap | Effect if you skip it |
| --- | --- |
| **CORS middleware** missing in `backend/main.py` | **The browser blocks every API call from the frontend.** Required. |
| **`GET /api/auth/me`** missing in `backend/routes/auth.py` | Everything works, but the Profile page can only show limited details (your name and email come from what you typed at sign-in/sign-up on this browser). |

## 1. CORS: `backend/main.py` (required)

Add the import at the top:

```python
from fastapi.middleware.cors import CORSMiddleware
```

Add this right after `app = FastAPI(...)`:

```python
# Allow the Vite dev server (React frontend) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Only the two explicit frontend origins are allowed (no wildcard). Authentication uses the `Authorization: Bearer`
header, not cookies.

## 2. Current user endpoint: `backend/routes/auth.py` (recommended)

Append at the end of the file. Everything it needs (`Depends`, `User`, `UserResponse`, `get_current_user`) is already imported there:

```python
@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
```

It returns `{ id, full_name, email, is_active }` and never exposes the password hash.

## Then restart the backend

```
cd D:\job_market_analyst\backend
uvicorn main:app --reload
```

(Use whatever command you already use to start the API; it must listen on http://127.0.0.1:8000.)
