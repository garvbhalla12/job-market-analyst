# Job Market Analyst

A full-stack web app that analyses real job postings: which skills are in demand, what jobs pay, where companies are hiring and how many roles suit freshers. It also includes an **AI career assistant** that answers questions from the data, reviews resumes and matches them against job descriptions.

> All insights come from a collected sample of job postings (about 1,000), not the entire job market.

---

## Features

### 📊 Job market analytics
- **Overview:** total jobs, companies, disclosed salaries and remote share, with key charts
- **Skills analytics:** most in-demand skills and how often each is mentioned
- **Salary analytics:** validated annual and hourly salary statistics (min, median, average, max)
- **Location and company analytics:** top hiring locations and companies
- **Fresher jobs:** entry-level and internship opportunities
- **Job explorer:** search postings and filter by workplace type, employment type and location

### 🤖 AI assistant (powered by Groq)
- **Chat with history:** ChatGPT-style sidebar with new, rename, delete and search; answers stream in word by word
- **Answers from the dataset:** the assistant calls the app's analytics functions as tools, so its numbers match the dashboard instead of being guessed
- **Resume analyzer:** upload a PDF, DOCX or TXT resume and get:
  - a **score out of 100** (market skill match 60 + resume structure 40)
  - in-demand skills you have and the ones you're missing, with demand %
  - a structure checklist and improvement tips
- **Resume vs job description (JD) match:** paste a JD with your resume and get:
  - a **match %** and the skills you already have
  - each missing skill marked **must-have** or **nice-to-have**
  - **what to learn and how long it takes** for each gap, plus its market demand %
- Copy and regenerate answers, drag & drop upload, keyboard shortcut (Ctrl + K for a new chat)

### 🔐 Authentication
- Sign up and log in with hashed passwords (Argon2)
- JWT access tokens plus rotating, single-use refresh tokens
- All analytics and AI routes are protected

### 🎨 UI
- Dark SaaS-style design: grouped sidebar, breadcrumbs, `/` to focus search
- Fully responsive: phones, tablets and desktops

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios, Recharts, Lucide icons, react-markdown |
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic, PyJWT, pwdlib (Argon2) |
| Data | pandas, Jupyter notebooks |
| AI | Groq API (`openai/gpt-oss-120b` by default), pypdf, python-docx |

---

## Project structure

```
job_market_analyst/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── database.py             # SQLite + SQLAlchemy session
│   ├── models.py               # User, RefreshToken, Conversation, Message, MessageAnalysis
│   ├── schemas.py              # Pydantic request/response models
│   ├── security.py             # Password hashing, JWT, refresh tokens
│   ├── dependencies.py         # get_current_user (route protection)
│   ├── analytics.py            # Job market analytics engine (pandas)
│   ├── data_cleaning.py        # Dataset cleaning
│   ├── skill_extraction.py     # Skill detection + skill demand
│   ├── ai_service.py           # Groq client, analytics tools, resume score, JD match
│   └── routes/
│       ├── auth.py             # /api/auth/*
│       ├── analytics_routes.py # /api/analytics/*
│       └── chat_routes.py      # /api/chat/*
├── frontend/
│   └── src/
│       ├── pages/              # Dashboard, Skills, Salary, Locations, Companies, Fresher, Jobs, AI Assistant, Profile, Login, Signup
│       ├── components/         # layout, common, charts, jobs, chat
│       ├── services/           # api (Axios + token refresh), analytics, auth, chat
│       ├── context/            # AuthContext
│       └── hooks/              # useApi, useDebounce, useElementWidth
├── dataset/                    # jobs.json → jobs.csv → jobs_cleaned.csv, skill_demand.csv
├── notebooks/                  # Dataset exploration and skill analysis
├── convert_dataset.py          # jobs.json → jobs.csv
└── .env.example                # Backend environment variables template
```

---

## Getting started

### Prerequisites
- Python 3.11+ (developed on 3.13)
- Node.js 18+
- A free Groq API key from [console.groq.com](https://console.groq.com), needed only for the AI assistant

### 1. Clone the repository
```bash
git clone https://github.com/garvbhalla12/job-market-analyst.git
cd job-market-analyst
```

### 2. Backend setup
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r backend/requirements.txt
```

Create a `.env` file in the **project root** (copy `.env.example`) and fill in your values:
```env
SECRET_KEY=your_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Start the API. Run it from inside the `backend` folder, because the backend uses flat imports:
```bash
cd backend
uvicorn main:app --reload
```
- API: http://127.0.0.1:8000
- Interactive docs (Swagger): http://127.0.0.1:8000/docs

The SQLite database (`job_market.db`) and all tables are created automatically on the first run.

### 3. Frontend setup
In a second terminal:
```bash
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```
Open http://localhost:5173, create an account and sign in.

---

## Environment variables

**Backend** (`.env` in the project root):

| Variable | Required | Description |
| --- | --- | --- |
| `SECRET_KEY` | ✅ | Secret used to sign JWTs. Use a long random string |
| `ALGORITHM` | | JWT algorithm (default `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | Access token lifetime (default `30`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | | Refresh token lifetime (default `7`) |
| `GROQ_API_KEY` | For AI | Groq API key for the AI assistant |
| `GROQ_MODEL` | | Groq model ID (default `openai/gpt-oss-120b`) |

**Frontend** (`frontend/.env`):

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend URL |

> ⚠️ Never commit `.env` files. They are already listed in `.gitignore`. Each developer uses their own keys.

---

## API reference

All `/api/analytics/*` and `/api/chat/*` routes need an `Authorization: Bearer <access_token>` header.

### Auth: `/api/auth`
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/signup` | Create an account |
| POST | `/login` | Get access and refresh tokens |
| POST | `/refresh` | Exchange a refresh token for a new pair (rotation) |
| POST | `/logout` | Revoke a refresh token |
| GET | `/me` | Current user |

### Analytics: `/api/analytics`
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/overview` | Totals, salary disclosure, workplace and employment split |
| GET | `/skills?limit=` | Most in-demand skills |
| GET | `/salary` | Validated salary statistics |
| GET | `/locations?limit=` | Top hiring locations |
| GET | `/workplace` | Remote / hybrid / on-site distribution |
| GET | `/employment` | Employment types |
| GET | `/roles` | Jobs by role category |
| GET | `/companies?limit=` | Top hiring companies |
| GET | `/fresher` | Fresher and internship analytics |
| GET | `/jobs?search=&location=&workplace_type=&employment_type=&limit=` | Search job postings |

### AI assistant: `/api/chat`
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/conversations` | List the user's chats |
| POST | `/conversations` | Create a chat |
| GET | `/conversations/{id}` | Chat with all messages (including resume / JD cards) |
| PATCH | `/conversations/{id}` | Rename a chat |
| DELETE | `/conversations/{id}` | Delete a chat |
| POST | `/conversations/{id}/messages` | Send a message (`multipart/form-data`: `content`, optional `file`). The reply is **streamed** (Server-Sent Events) |
| POST | `/conversations/{id}/regenerate` | Regenerate the last answer (streamed) |

---

## How the AI assistant works

1. The user's message and recent chat history are sent to the Groq model along with a set of **tools**, which are the functions in `analytics.py`.
2. For market questions, the model calls these tools (for example `get_skill_demand` or `get_salary_analytics`), so its answers use the real dataset.
3. **Resume score:** calculated in code, not by the AI, so the same resume always gets the same score:
   - **Skill match (60):** coverage of the dataset's top 20 skills, weighted by how often each is in demand.
   - **Structure (40):** checks for contact details, education, experience, projects, a skills section, quantified results and links.
4. **JD match:**
   - Skills from the project's skill list are matched in code, with must-have / nice-to-have read from the JD's wording.
   - The AI adds skills outside that list and writes a learning plan for each gap.
   - The result is saved, so the card looks the same when the chat is reopened.
5. Replies are streamed to the browser and stored with the conversation.

---

## Data pipeline

```
jobs.json ──convert_dataset.py──► jobs.csv ──data_cleaning.py──► jobs_cleaned.csv
                                                     │
                                         skill_extraction.py
                                                     ▼
                                jobs_with_skills.csv + skill_demand.csv
```
`analytics.py` reads `jobs_cleaned.csv` and `skill_demand.csv` to serve every analytics endpoint.

---

## Notes and limitations
- The dataset is a **sample** (about 1,000 postings, mostly US, salaries in USD), not the full market.
- Skill detection uses a fixed list of 34 technical skills. The JD match uses the AI to cover skills outside this list.
- Scanned (image-only) PDFs can't be read. Use a text-based PDF or DOCX.
- The free Groq tier has rate limits. If the assistant stops responding, wait a minute and try again.

---

## Team
- **Garv Bhalla**
- **Himanshu Vats**
