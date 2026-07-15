# 🎓 College Complaint Management System (CMS)

A **production-ready, full-stack** complaint management system for colleges — built with modern technologies for students, staff, and administrators.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL (Supabase for cloud) |
| **ORM** | Prisma ORM |
| **Auth** | JWT + Refresh Tokens + bcrypt |
| **Storage** | Cloudinary |
| **Email** | Nodemailer (Gmail/SMTP) |
| **Realtime** | Socket.IO |
| **Deployment** | Vercel (Frontend) · Render (Backend) · Supabase (DB) |

---

## 📁 Project Structure

```
college-complaint-system/
├── frontend/                # React 19 Vite App
│   ├── src/
│   │   ├── pages/          # Auth, Student, Staff, Admin pages
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # Auth, Theme, Socket contexts
│   │   ├── lib/            # Axios instance, utils
│   │   ├── layouts/        # Auth & Dashboard layouts
│   │   └── types/          # TypeScript interfaces
│   └── ...
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/      # Auth, validate, upload, error
│   │   ├── services/       # Email, upload, analytics
│   │   ├── config/         # DB, cloudinary, nodemailer
│   │   └── utils/          # Helpers, validators, constants
│   ├── prisma/
│   │   ├── schema.prisma   # Full DB schema (14 tables)
│   │   └── seed.ts         # Demo seed data
│   └── ...
└── docker-compose.yml
```

---

## 🔧 Environment Setup

### Backend `.env` (copy from `.env.example`)

```env
NODE_ENV=development
PORT=5000

# PostgreSQL (Supabase)
DATABASE_URL="postgresql://user:password@host:5432/cms_db?pgbouncer=true"

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-minimum-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=CMS Support
SMTP_FROM_EMAIL=your-gmail@gmail.com

# Frontend URL (for CORS & emails)
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🏃 Running Locally

### Option 1: Docker Compose (Recommended)

```bash
# Copy env file
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Start everything
docker-compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Setup Prisma
npx prisma generate
npx prisma db push
npx prisma db seed   # Seeds demo data

# Start dev server
npm run dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 🌐 Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command**: `npm install && npm run build && npx prisma generate`
5. **Start Command**: `node dist/server.js`
6. Add all environment variables from `.env.example`

### Frontend → Vercel

1. Import project on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. Add environment variable: `VITE_API_URL=https://your-render-api.onrender.com/api`

### Database → Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **Settings → Database**
3. Copy the **Connection String (URI)** with `pgbouncer=true`
4. Set as `DATABASE_URL` in your environment

---

## 👥 Default Test Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@college.edu` | `Admin@123!` |
| Staff | `staff@college.edu` | `Staff@123!` |
| Student | `student@college.edu` | `Student@123!` |

---

## 📡 API Documentation

Swagger UI is available at: `http://localhost:5000/api-docs`

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new student |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/complaints` | List complaints (role-filtered) |
| `POST` | `/api/complaints` | Submit new complaint |
| `PATCH` | `/api/complaints/:id/status` | Update complaint status |
| `PATCH` | `/api/complaints/:id/assign` | Assign complaint to staff |
| `GET` | `/api/analytics/overview` | Dashboard stats |
| `GET` | `/api/admin/audit-logs` | Audit trail |

---

## 🔐 Role-Based Access

| Feature | Student | Staff | Admin |
|---|:---:|:---:|:---:|
| Submit complaint | ✅ | ❌ | ❌ |
| View own complaints | ✅ | ❌ | ❌ |
| View assigned complaints | ❌ | ✅ | ✅ |
| Update complaint status | ❌ | ✅ | ✅ |
| Assign complaints | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Manage departments | ❌ | ❌ | ✅ |
| View analytics | ❌ | 📊 Limited | ✅ Full |
| Broadcast announcements | ❌ | ❌ | ✅ |

---

## 🗃️ Database Schema

The system uses **14 Prisma models**:

- `User` — base authentication (STUDENT, STAFF, ADMIN roles)
- `Student` — student-specific profile
- `Staff` — staff-specific profile
- `Department` — academic departments
- `Category` — complaint categories (linked to departments)
- `Complaint` — core complaint entity
- `ComplaintAttachment` — file attachments (Cloudinary URLs)
- `ComplaintHistory` — status change audit trail
- `ComplaintMessage` — in-complaint chat messages
- `Notification` — in-app notifications
- `Announcement` — admin broadcasts
- `RefreshToken` — secure refresh token store
- `AuditLog` — admin audit trail
- `Settings` — system-wide key-value settings

---

## 📸 Features

- 🔒 **JWT Authentication** with refresh tokens
- 📝 **Complaint Lifecycle** — Submit → Assign → In Progress → Resolved
- 💬 **Real-time Chat** per complaint thread (Socket.IO)
- 📁 **File Attachments** via Cloudinary
- 📊 **Analytics Dashboard** — charts, trends, department stats
- 📧 **Email Notifications** — on status change, assignment, etc.
- 🔔 **In-app Notifications** with real-time Socket.IO updates
- 📣 **Announcements** targeted by role
- 📋 **Audit Logs** for admin accountability
- 🌙 **Dark Mode** support
- 📱 **Responsive** mobile-first design

---

## 🧪 Testing the API

A Postman collection is available at `postman_collection.json` (in the repo root).

Import it into Postman and set the `BASE_URL` variable to your backend URL.

---

## 📄 License

MIT © 2025 — College Complaint Management System
