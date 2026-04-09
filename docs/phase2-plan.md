# Phase 2 Plan: Real Authentication & Database

## Current State
✅ Phase 1 complete: Basic skeleton with mock auth, 3 role-based dashboards

## Phase 2 Goals
Replace mock auth with real authentication using:
- PostgreSQL database (local Docker)
- JWT tokens for session management
- OAuth (Google + GitHub)
- User registration/login forms
- Admin user management panel

---

## What Will Be Added

### 1. Backend API (Node.js + Express)
- User registration (email/password)
- Login/Logout with JWT
- OAuth callbacks (Google/GitHub)
- User CRUD operations
- Role-based access control middleware

### 2. Database (PostgreSQL + Prisma)
- User model (with role)
- Email verification tokens
- Password reset tokens
- Seed data for admin user

### 3. Frontend Auth Forms
- Registration page (email, password, name, role selection)
- Login page (email/password + OAuth buttons)
- Forgot password page (future)
- Profile page (view/edit)

### 4. Admin Panel (real)
- View all users in a table
- Create new users
- Edit user details
- Change user roles
- Activate/deactivate users
- Delete users

### 5. Security Improvements
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- HTTP-only cookies for tokens
- CORS configuration

---

## Implementation Steps

**Step 1**: Create backend folder structure
**Step 2**: Setup PostgreSQL (Docker)
**Step 3**: Install Prisma, define schema
**Step 4**: Build auth service (register, login, JWT)
**Step 5**: Create Express routes
**Step 6**: Add role-based middleware
**Step 7**: Seed admin user
**Step 8**: Test API with Postman/curl
**Step 9**: Create frontend login/register pages
**Step 10**: Connect frontend to backend API
**Step 11**: Replace mock auth with real auth
**Step 12**: Build admin panel UI
**Step 13**: Test complete flow end-to-end

---

## Estimated Time
~4-6 hours depending on complexity

---

## Questions Before Starting

1. Should we keep the landing page role buttons? Or make it a proper login page?
2. Do we need email verification in Phase 2, or can it be later?
3. Should we add "Forgot Password" functionality now or later?
4. Any additional user profile fields? (bio, avatar, timezone, etc.)
5. Should users be able to delete their own accounts?

---

**Ready to proceed with Phase 2?** Confirm and I'll start building! 🚀
