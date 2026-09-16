# Project Report — Student Management System

## Overview

The Student Management System is a full-stack, CRUD-based web application for managing student academic records. It lets authenticated users create, view, update, search, and delete student records through a web interface, backed by a REST API and a relational database.

The system follows a three-tier architecture: a vanilla HTML/CSS/JavaScript frontend, a Django REST Framework backend, and a SQLite database. Access is protected by mandatory user registration and token-based login — there is no default or shared account, and every API request requires a valid token.

## Problem Statement

Manually tracking student records in spreadsheets or paper registers is error-prone, hard to search, and offers no access control — anyone with the file can view or change every record. This project replaces that with a web-based system where each user manages their own set of records behind a login, with validation to prevent duplicate or malformed entries and a searchable interface for fast lookups.

## Objectives

- Design a relational schema for student and user account data
- Build a RESTful API with full CRUD support for student records
- Implement secure, mandatory registration and token-based login
- Build a responsive frontend that consumes the REST API
- Apply client-side and server-side validation on all input
- Test all endpoints for valid, invalid, and edge-case input
- Maintain the project under Git version control on GitHub

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript | UI and client-side validation |
| Backend | Django, Django REST Framework | Server logic, REST API, auth |
| Database | SQLite | Persistent storage |
| Authentication | DRF Token Authentication | Per-user login and API access control |
| API Testing | curl / Postman | Endpoint verification |
| Version Control | Git & GitHub | Source management |

## System Architecture

```
Browser (HTML/CSS/JS)
   │  fetch() — JSON over HTTP
   │  Authorization: Token <key>
   ▼
Django REST Framework
   ├── accounts app    /api/auth/register/  /api/auth/login/  /api/auth/logout/
   └── students app    /api/students/  (full CRUD)
   │  Django ORM
   ▼
SQLite Database
```

The frontend never touches the database directly. Every read or write passes through the REST API, which authenticates the request, validates the payload, and scopes student records to the logged-in user before touching the database.

## Database / ER Design

```
┌────────────────────┐  1     *  ┌───────────────────────┐
│        User          │◄─────────┤        Student           │
├────────────────────┤            ├───────────────────────┤
│ id (PK)               │           │ id (PK)                  │
│ username (unique)     │           │ owner_id (FK → User)     │
│ email                  │           │ name                      │
│ password (hashed)      │           │ roll_number (unique)      │
└────────────────────┘            │ email                      │
          │ 1                       │ department                 │
          ▼ 1                       │ year                        │
┌────────────────────┐            │ phone                       │
│        Token          │            │ created_at                  │
├────────────────────┤            │ updated_at                   │
│ key (PK)               │           └───────────────────────┘
│ user_id (FK → User)    │
└────────────────────┘
```

### Student table fields

| Field | Type | Constraints |
|---|---|---|
| id | AutoField | Primary key |
| owner | ForeignKey → User | NOT NULL, cascade delete |
| name | CharField(150) | NOT NULL |
| roll_number | CharField(30) | NOT NULL, unique |
| email | EmailField | NOT NULL, valid format |
| department | CharField(100) | NOT NULL |
| year | PositiveSmallInteger | NOT NULL, choices 1–4 |
| phone | CharField(15) | Optional, digits only |
| created_at | DateTimeField | Auto-set |
| updated_at | DateTimeField | Auto-updated |

## API Endpoint Documentation

| Purpose | Method | Endpoint | Auth Required |
|---|---|---|---|
| Register new user | POST | `/api/auth/register/` | No |
| Login | POST | `/api/auth/login/` | No |
| Logout | POST | `/api/auth/logout/` | Yes |
| List / search students | GET | `/api/students/?search=` | Yes |
| Create student | POST | `/api/students/` | Yes |
| Retrieve one student | GET | `/api/students/{id}/` | Yes |
| Update student | PUT/PATCH | `/api/students/{id}/` | Yes |
| Delete student | DELETE | `/api/students/{id}/` | Yes |

All authenticated requests must include:
```
Authorization: Token <token-returned-by-login-or-register>
```

## CRUD Implementation Details

**Create** — `POST /api/students/` validates all required fields, checks the roll number is unique, and links the new record to the logged-in user automatically via the `owner` field.

**Read** — `GET /api/students/` returns all records owned by the authenticated user, newest first. An optional `?search=` parameter filters by name, roll number, or department. `GET /api/students/{id}/` returns a single record.

**Update** — `PUT`/`PATCH` on `/api/students/{id}/` applies the same validation as Create, plus a check that a changed roll number doesn't clash with another existing record.

**Delete** — `DELETE /api/students/{id}/` permanently removes the record. The frontend requires a confirmation step before the request is sent.

## Testing Results

The full flow was tested end-to-end with curl before packaging:

| # | Test Case | Input | Expected Result | Result |
|---|---|---|---|---|
| 1 | Register new user | Valid username, email, matching passwords | 201 Created, token returned | Pass |
| 2 | Register duplicate username | Existing username | 400 Bad Request | Pass |
| 3 | Login valid credentials | Correct username & password | 200 OK, token returned | Pass |
| 4 | Login invalid credentials | Wrong password | 400 Bad Request | Pass |
| 5 | Create student (valid) | All required fields | 201 Created | Pass |
| 6 | Create student (missing field) | Missing name | 400 Bad Request | Pass |
| 7 | Create student (duplicate roll no.) | Existing roll_number | 400 Bad Request | Pass |
| 8 | List students | Authenticated GET | 200 OK, JSON array | Pass |
| 9 | Update student (valid ID) | PUT with changed fields | 200 OK, updated record | Pass |
| 10 | Update student (invalid ID) | PUT to non-existent id | 404 Not Found | Pass |
| 11 | Delete student (valid ID) | DELETE existing record | 204 No Content | Pass |
| 12 | Delete student (invalid ID) | DELETE non-existent id | 404 Not Found | Pass |
| 13 | Unauthenticated access | GET with no token | 401 Unauthorized | Pass |

## Installation and Execution Steps

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
Open `http://127.0.0.1:5500/` in a browser (or use VS Code Live Server on `index.html`).

## Challenges and Solutions

| Challenge | Solution |
|---|---|
| CORS errors between frontend and backend running on different ports | Configured `django-cors-headers` to allow the frontend origin |
| Preventing users from seeing each other's records | Added an `owner` ForeignKey on `Student`, scoped every queryset to `request.user` |
| Preventing duplicate roll numbers on create/update | Enforced uniqueness at the DB level and added an explicit serializer/view check |
| Keeping users logged in securely without full session auth | Used DRF Token Authentication; token stored in `localStorage`, sent on every request |

## Future Enhancements

- Pagination for large student lists
- JWT access/refresh tokens instead of static DRF tokens
- Role-based access control (admin vs. staff)
- CSV import/export of student records
- Deployment to a live hosting service

## Conclusion

This project implements a complete CRUD-based web application: a secure registration/login system, a validated and tested REST API, a responsive vanilla JavaScript frontend, and a relational database — all version-controlled and documented, demonstrating the full request lifecycle from browser to database and back.
