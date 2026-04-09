# Test Users Credentials

After running `npm run db:seed`, you can use these test accounts:

## Instructor
- Email: `instructor@test.com`
- Password: `password123`
- Role: INSTRUCTOR
- Access: Can create/edit courses, manage videos

## Admin
- Email: `admin@test.com`
- Password: `admin123`
- Role: ADMIN
- Access: Full platform access, can manage any course

## Student
- Email: `student@test.com`
- Password: `student123`
- Role: STUDENT
- Access: Can view courses (enrollment feature coming in Feature 3)

## Test Courses

### Course 1 (Published)
- **Title**: Introduction to React
- **Instructor**: Test Instructor
- **Status**: Published (visible on `/courses`)
- **Videos**: 3 videos
  1. Getting Started with React (10:00)
  2. Components and Props (12:00)
  3. State and Lifecycle (15:00)
- **Description**: Learn the fundamentals of React.js including components, hooks, and state management.

### Course 2 (Draft)
- **Title**: Advanced TypeScript
- **Instructor**: Test Instructor
- **Status**: Draft (NOT visible on `/courses`)
- **Videos**: 2 videos
  1. Generics Explained (9:00)
  2. Utility Types (8:00)
- **Description**: Deep dive into TypeScript advanced types, generics, and patterns.

## How to Use

1. Run the seed: `npm run db:seed`
2. Start the dev server: `npm run dev`
3. Go to `/login` and sign in with one of the test accounts
4. Navigate to `/instructor/courses` to see the instructor's courses
5. Click "Manage Videos" to test video management features
6. Visit `/courses` to see the published course

## Features to Test

✅ **Course CRUD**
- Create, edit, delete courses
- Publish/unpublish courses
- Draft courses hidden from public

✅ **Video Management**
- Add new videos to a course
- Edit video title, description, URL, thumbnail, duration
- Delete videos (remaining videos are auto-reordered)
- Reorder videos with up/down buttons
- YouTube URL preview in forms

✅ **Authorization**
- Instructors can only manage their own courses
- Admins can edit any course
- Public can only view published courses

✅ **UI/UX**
- Responsive design
- Dark mode support
- Loading states and error messages
- Success notifications
