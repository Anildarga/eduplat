# Database Setup & Test Data Guide

## Overview
This project now includes:
- ✅ Full Course CRUD
- ✅ Complete Video Management feature
- ✅ Test data seed script

## Database Configuration

The project is configured to use **MongoDB** (as per tech stack). The `.env` file already contains a MongoDB Atlas connection string.

### Schema Updates for MongoDB
The `prisma/schema.prisma` has been updated for MongoDB compatibility:
- All `@id` fields now map to MongoDB's `_id`
- Removed PostgreSQL-specific `@db.Text` annotations
- Added required `@id` fields to all models

## Getting Test Data

### Option 1: Run Seed Script (Automated)

**Prerequisites:**
1. Ensure MongoDB Atlas connection is active and the database exists
2. Stop any running dev server (to avoid file lock issues on Windows)
3. Install dependencies: `npm install`

**Steps:**

```bash
# 1. Generate Prisma client (may require closing all Node processes)
npx prisma generate

# If you get EPERM error on Windows, manually delete:
# node_modules/.prisma/client/*
# Then re-run generate

# 2. Push schema to database (creates collections)
npx prisma db push

# 3. Run seed script
npm run db:seed
```

**Expected Output:**
```
🌱 Starting seed...
✅ Instructor user exists or created: instructor@test.com
✅ Course 1 exists or created: Introduction to React
  → Added 3 videos to course 1
✅ Course 2 exists or created: Advanced TypeScript
  → Added 2 videos to course 2
✅ Admin user exists or created: admin@test.com
✅ Student user exists or created: student@test.com
🎉 Seed completed!
```

### Option 2: Manual Data Creation

If seed script fails, you can create test data manually:

1. **Start the app:** `npm run dev`
2. **Go to `/register`** and create:
   - Instructor account
   - Student account
3. **Login as Instructor** → `/instructor/courses`
4. **Create 2 test courses:**
   - Course 1 (Published): "Introduction to React"
   - Course 2 (Draft): "Advanced TypeScript"
5. **Add videos** to each course via "Manage Videos"

## Test Credentials

After running the seed, use these accounts:

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Instructor | `instructor@test.com` | `password123` |
| Admin    | `admin@test.com`       | `admin123`   |
| Student  | `student@test.com`     | `student123` |

## Test Courses (from seed)

### Course 1: Introduction to React ✅ PUBLISHED
- **Status:** Published (visible at `/courses`)
- **Instructor:** Test Instructor
- **Videos:**
  1. Getting Started with React (10:00)
  2. Components and Props (12:00)
  3. State and Lifecycle (15:00)
- **Description:** Learn the fundamentals of React.js

### Course 2: Advanced TypeScript 📝 DRAFT
- **Status:** Draft (NOT visible on public page)
- **Instructor:** Test Instructor
- **Videos:**
  1. Generics Explained (9:00)
  2. Utility Types (8:00)
- **Description:** Deep dive into TypeScript patterns

## Features to Test

### 1. Course Browsing (/courses)
- ✅ Public page shows only published courses
- ✅ Course cards display: thumbnail, title, instructor, video count, quiz count
- ✅ Search filters courses by title

### 2. Course Detail (/courses/[id])
- ✅ Shows full course info, videos, quizzes
- ✅ Instructor/admin sees Edit & Delete buttons
- ✅ Student sees "Enroll" button (disabled, coming soon)
- ✅ Lock icon on videos for non-instructors

### 3. Instructor Dashboard (/instructor/courses)
- ✅ Shows all courses (published + drafts)
- ✅ "Manage Videos" button on each card
- ✅ Create new course (Draft or Publish)
- ✅ Edit/Delete courses
- ✅ Empty state when no courses

### 4. Video Management (/instructor/courses/[id]/videos)
- ✅ List videos with order number, thumbnail, title, duration
- ✅ Up/Down buttons to reorder
- ✅ Edit video inline
- ✅ Delete video (auto-reorders remaining)
- ✅ "Add New Video" button
- ✅ YouTube URL preview in forms
- ✅ Thumbnail preview
- ✅ Duration formatting (MM:SS)
- ✅ Breadcrumb navigation

### 5. API Endpoints
- ✅ `GET /api/courses` - public published list
- ✅ `POST /api/courses` - create (instructor/admin)
- ✅ `GET /api/courses/[id]` - get single (auth for drafts)
- ✅ `PATCH /api/courses/[id]` - update (owner/admin)
- ✅ `DELETE /api/courses/[id]` - delete (owner/admin)
- ✅ `GET /api/courses/my` - instructor's own courses
- ✅ `GET /api/courses/[id]/videos` - list videos
- ✅ `POST /api/courses/[id]/videos` - add video
- ✅ `GET/PATCH/DELETE /api/courses/[id]/videos/[videoId]`
- ✅ `PATCH /api/courses/[id]/videos/reorder`

## Troubleshooting

### Windows File Lock Errors
If `prisma generate` fails with EPERM:
1. Close all terminal/Node processes
2. Delete `node_modules/.prisma/client`
3. Run `npx prisma generate` again

### MongoDB Connection Issues
- Verify `.env` DATABASE_URL is correct
- Check MongoDB Atlas network whitelist
- Ensure user has readWrite permissions

### Auth Not Working
- Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env`
- Restart dev server after env changes

### Videos Not Showing in Course Detail
- Ensure videos have `courseId` set correctly
- Check that course is published (for public view)
- Public page shows lock icon for all videos (enrollment check not implemented yet)

## Next Steps

After setup:
1. Run dev server: `npm run dev`
2. Login as `instructor@test.com`
3. Go to `/instructor/courses`
4. Click "Manage Videos" on any course
5. Test adding, editing, reordering, deleting videos
6. Publish a course and verify it appears on `/courses`

Enjoy testing! 🎬
