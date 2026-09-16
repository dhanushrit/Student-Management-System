# Student Management System

A full-stack CRUD web application for managing student records, built with a vanilla HTML/CSS/JavaScript frontend and a Django REST Framework backend. Every user registers their own account — there is no default or shared login — and all API access is protected with token-based authentication.

## Features

- User registration and login (token-based authentication, no default credentials)
- Create, read, update, and delete student records
- Live search by name, roll number, or department
- Client-side and server-side validation on every field
- Each user's records are private — one account cannot see or edit another account's students
- Responsive UI with add/edit and delete-confirmation modals

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Backend | Django, Django REST Framework |
| Database | SQLite |
| Auth | DRF Token Authentication |
| Version Control | Git / GitHub |

## Architecture

```
Browser (HTML/CSS/JS)
   │  fetch() → JSON over HTTP
   │  Authorization: Token <key>
   ▼
Django REST Framework
   ├── accounts app    /api/auth/register/  /api/auth/login/  /api/auth/logout/
   └── students app    /api/students/  (full CRUD)
   │  Django ORM
   ▼
SQLite Database
```

The frontend never touches the database directly — every read or write goes through the REST API, which authenticates the request, validates the input, and scopes student records to the logged-in user.

## Database Schema

**Student**

| Field | Type | Notes |
|---|---|---|
| id | AutoField | Primary key |
| owner | ForeignKey → User | Owner of the record, cascade delete |
| name | CharField(150) | Required |
| roll_number | CharField(30) | Required, unique |
| email | EmailField | Required, validated format |
| department | CharField(100) | Required |
| year | PositiveSmallInteger | Required, 1–4 |
| phone | CharField(15) | Optional, digits only |
| created_at | DateTimeField | Auto-set |
| updated_at | DateTimeField | Auto-updated |

`User` and `Token` are Django/DRF's built-in models, related one user → one token → many students.

## API Reference

| Purpose | Method | Endpoint | Auth |
|---|---|---|---|
| Register | POST | `/api/auth/register/` | No |
| Login | POST | `/api/auth/login/` | No |
| Logout | POST | `/api/auth/logout/` | Yes |
| List / search students | GET | `/api/students/?search=` | Yes |
| Create student | POST | `/api/students/` | Yes |
| Retrieve student | GET | `/api/students/{id}/` | Yes |
| Update student | PUT/PATCH | `/api/students/{id}/` | Yes |
| Delete student | DELETE | `/api/students/{id}/` | Yes |

Authenticated requests must include:
```
Authorization: Token <token-returned-by-login-or-register>
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
API runs at `http://127.0.0.1:8000/`.

### Frontend

```bash
cd frontend
python -m http.server 5500
```
Open `http://127.0.0.1:5500/` in your browser. (Or use VS Code's Live Server extension on `index.html`.)

Register a new account first — there's no default login — then log in and use the dashboard to add, edit, search, and delete student records.

## Testing

The core flow was verified end-to-end with curl: register → login → create student → list students → confirm unauthenticated requests are rejected with `401`. All cases passed, including validation errors for missing fields, duplicate usernames, and duplicate roll numbers.

## Project Structure

```
student-management-app/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/          # settings, urls, wsgi, asgi
│   ├── accounts/         # register / login / logout
│   └── students/          # Student model + CRUD API
└── frontend/
    ├── index.html          # login
    ├── register.html       # registration
    ├── dashboard.html       # CRUD dashboard
    ├── css/style.css
    └── js/  config.js, auth.js, api.js, app.js
```

## Future Enhancements

- Pagination for large student lists
- JWT access/refresh tokens instead of static DRF tokens
- Role-based access (admin vs. staff)
- CSV import/export
- Deployment to a live hosting service
