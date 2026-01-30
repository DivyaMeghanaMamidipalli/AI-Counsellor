# 🎓 AI Counsellor

AI Counsellor is a full‑stack study‑abroad guidance platform with personalized onboarding, AI chat guidance, university discovery and recommendations, and application tracking.

---

## ✨ Features

### Core Experience
- **Authentication**: Signup, login, profile, password change, and reset password by email.
- **Onboarding (4 steps)**: Academic background, study goals, budget & funding, exam readiness.
- **Dashboard**: Stage‑based guidance, stats, tasks, profile summary, and next actions.
- **AI Counsellor**: Chat with personalized recommendations, action buttons, and task generation.
- **Universities**:
  - **Discover** shows all universities with search and filters (country, field).
  - **Recommendations** filtered by country and field, categorized by budget fit only:
    - **Safe**: cost ≤ budget
    - **Target**: cost ≤ 120% of budget
    - **Dream**: cost > 120% of budget
  - Acceptance likelihood and risk are shown only in recommendations.
  - Shortlist, lock, and manage choices.
- **Applications**: Task tracking and progress after locking a university.
---

## 🧱 Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- Axios

**Backend**
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL
- JWT authentication

---

## 📁 Project Structure

```
ai-counsellor/
├── backend/
│   ├── app/
│   │   ├── auth.py
│   │   ├── onboarding.py
│   │   ├── dashboard.py
│   │   ├── universities.py
│   │   ├── tasks.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── store/
    │   ├── routes/
    │   └── App.tsx
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs at http://localhost:8000

### Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```
Runs at http://localhost:5173

---

## 🔌 Environment Variables

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:8000
```

**Backend**
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| POST | /api/auth/change-password | Change password |
| POST | /api/auth/reset-password | Reset password by email |
| POST | /api/onboarding | Complete onboarding |
| GET | /api/dashboard | Dashboard data |
| GET | /api/universities/all | Discover list |
| GET | /api/universities/recommendations | Recommendations |
| POST | /api/universities/shortlist | Shortlist |
| POST | /api/universities/lock | Lock |
| POST | /api/universities/unlock | Unlock |
| GET | /api/universities/shortlisted | Shortlisted list |
| GET | /api/universities/locked | Locked list |
| GET | /api/tasks | Tasks |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Delete task |


---

## 🎓 Conclusion

You now have a **complete, professional, production-ready AI Counsellor platform**! 

The frontend seamlessly integrates with your backend API and provides a beautiful, responsive user experience with a calming nude color palette.

**Ready to help students make confident study-abroad decisions! 🚀**

---

## 🙏 Credits

Built with:
- React + TypeScript
- Tailwind CSS
- Zustand
- FastAPI
- PostgreSQL

**Happy coding!** ✨
