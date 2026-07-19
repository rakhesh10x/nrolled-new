# 🤖 AI-Powered HR Assistant & Leave Management System

A production-grade, full-stack enterprise HR portal combining **Employee Self-Service**, **Admin Workforce Analytics**, and an **AI-powered RAG Engine** for instant company HR policy answers.

![License](https://img.shields.io/badge/License-MIT-purple.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg)

---

## 🌟 Key Features

### 👤 1. Employee Self-Service Portal
* **Interactive Dashboard**: View remaining leave balances, attendance metrics, leaves used, and pending approvals. Click stats cards for detailed policy breakdowns.
* **Leave Application**: Apply for Casual, Sick, or Earned leave with real-time balance checks and date validation.
* **Leave History**: Filter and view all past leave requests with status badges (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`).
* **Profile Management**: View designation, department, manager info, and annual leave allocation.

### 🛡️ 2. Admin Management Portal
* **Workforce Analytics**: Monitor total employees, pending approvals, approved/rejected leaves, and department distribution.
* **Leave Approval Workflow**: Approve or reject leave applications with mandatory rejection reasons and instant balance deductions.
* **Audit Trail**: View immutable system compliance logs (`LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_SUBMITTED`).
* **1-Click CSV Reports**: Export complete employee leave applications to downloadable CSV reports.

### 🤖 3. AI RAG Policy Assistant
* **Retrieval-Augmented Generation (RAG)**: Answers questions based on company HR policy documents (`knowledge_base.json`).
* **Intent Classifier**: Automatically categorizes queries into *HR Policy*, *Leave Balance*, *Attendance*, *Payroll*, *WFH*, or *General Inquiry*.
* **Source Citations**: Displays clickable policy source cards for complete transparency.
* **Pluggable Retriever**: Designed using the Strategy Pattern (`IRetriever` interface), supporting both `KeywordRetriever` and `VectorRetriever` (ChromaDB / FAISS).

### 🎨 4. Design & UX
* **Enterprise Dark & Light Themes**: Smooth live theme switcher supporting deep navy dark mode and crisp slate light mode.
* **Glassmorphism Design System**: Soft shadows, blur effects, gradient text, and micro-animations inspired by Linear and Vercel.
* **Backdrop Modal UX**: Interactive pop-ups close smoothly on outside backdrop clicks or `Escape` key press.

---

## 🛠️ Technology Stack

### Backend
* **Framework**: FastAPI (Python 3.11+)
* **Database**: SQLite with SQLAlchemy 2.0 ORM
* **Security & Auth**: JWT (python-jose) with salted Bcrypt password hashing (passlib)
* **AI & LLM**: Oxlo.ai (DeepSeek-V3.2 API) with exponential backoff retries
* **Testing**: Pytest automated unit testing suite

### Frontend
* **Core**: React 18 (Vite)
* **Styling**: Tailwind CSS v4 + Lucide React Icons
* **Charts**: Recharts analytics visualization
* **Routing**: React Router v6

---

## 📁 Repository Structure

```text
hr-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Entrypoint & Middleware
│   │   ├── config.py                # Environment configuration settings
│   │   ├── database.py              # SQLAlchemy DB session management
│   │   ├── auth.py                  # JWT Auth & Bcrypt password utilities
│   │   ├── models.py                # Database ORM Entities
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── seed.py                  # Seed database generator
│   │   ├── repositories/            # Data access layer repositories
│   │   ├── routers/                 # API endpoint routers (Auth, Employee, Admin, Chat)
│   │   └── services/                # Business logic, RAG engine, Intent Classifier
│   ├── tests/
│   │   └── test_auth_and_leave.py   # Pytest automated unit tests
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Production Docker image configuration
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components (Sidebar, Header, Modals)
│   │   ├── pages/                   # Application view pages (Dashboard, Chat, Profile)
│   │   ├── context/                 # Auth, Theme, and Toast React Contexts
│   │   └── index.css                # Global CSS design tokens & theme variables
│   ├── package.json                 # Node dependencies
│   ├── nginx.conf                   # Production Nginx SPA routing config
│   └── Dockerfile                   # Multi-stage frontend Docker image
├── docker-compose.yml               # 1-Command Docker orchestration
└── DEPLOYMENT_GUIDE.md              # Production deployment documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* **Python**: `v3.11+`
* **Node.js**: `v18+`
* **npm**: `v9+`

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Oxlo.ai API Key
echo "OXLO_API_KEY=your_oxlo_api_key_here" > .env
echo "SECRET_KEY=super_secret_jwt_key_2026" >> .env

# Run database seed
python -m app.seed

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API & Swagger Docs will be live at: **`http://localhost:8000/docs`**

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run build && npm run dev
```

Frontend application will be live at: **`http://localhost:5173`**

---

## 🔑 Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Employee** | `john_smith` | `password123` |
| **Admin** | `admin` | `admin123` |

---

## 🧪 Running Automated Tests

Run the Pytest unit test suite:

```bash
cd backend
python -m pytest tests/test_auth_and_leave.py
```

---

## 🐳 Docker Deployment

Run the complete platform locally or on a VPS with Docker Compose:

```bash
docker compose up --build -d
```

* **Frontend**: `http://localhost`
* **Backend API Docs**: `http://localhost:8000/docs`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
