# NagarSeva

NagarSeva is a civic issue reporting platform with:
- **frontend**: citizen app (React + Vite)
- **admin**: admin dashboard (React + Vite)
- **backend**: REST API server (Node.js + Express + Supabase + Cloudinary)

## Project Structure

```text
nagarSeva/
├── frontend/
├── admin/
└── backend/
```

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Supabase project credentials
- Cloudinary credentials

## Environment Variables

### Backend (`/backend/.env`)

```env
PORT=3000
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_or_anon_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`/frontend/.env`)

```env
VITE_BASE_URL=http://localhost:3000
```

### Admin (`/admin/.env`)

```env
VITE_BASE_URL=http://localhost:3000
```

## Installation

Install dependencies in each app:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

## Running Locally

Start each app in a separate terminal:

### 1) Backend API

```bash
cd backend
npm start
```

Runs on `http://localhost:3000` by default.

### 2) Frontend (Citizen App)

```bash
cd frontend
npm run dev
```

### 3) Admin Panel

```bash
cd admin
npm run dev
```

## Available Scripts

### Backend
- `npm start` - start Express server

### Frontend / Admin
- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

## API Routes Overview

Base URL: `http://localhost:3000/api`

- `POST /users/signup`
- `POST /users/login`
- `POST /admin/signup`
- `POST /admin/login`
- `POST /issues` (multipart form, supports `images`)
- `GET /issues`
- `GET /issues/:id`
- `PATCH /issues/:id`
- `POST /issues/:id/upvote`
- `DELETE /issues/:id/upvote`
- `POST /issues/:issueId/comments`
- `DELETE /issues/:issueId/comments/:commentId`

## Notes

- The backend currently has no implemented automated tests (`npm test` exits with an error placeholder).
