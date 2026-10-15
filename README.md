# GlobalImage — Photography Business Management System

A full-stack web application designed for professional photography studios to manage client bookings, portfolio galleries, photography services, staff assignments, customer feedback, and financial transaction slips.

---

## 📸 Key Features

- **User Authentication & Role-Based Access Control (RBAC):**
  - Secure registration and login with `bcryptjs` password hashing.
  - Granular role enforcement: `client`, `staff`, and `admin`.
  - Ephemeral cryptographically random password-reset tokens (SHA-256 hashed in database).
- **Booking Management:**
  - Online booking submissions with packages, event dates, and locations.
  - Administrative approval/rejection workflows, photographer assignments, and status updates.
  - Advance payment slip upload with strict access control.
- **Portfolio & Gallery Management:**
  - Multi-category event galleries (Weddings, Pre-shoots, Birthday, Commercial).
  - Cloudinary integration with automated local fallback.
  - Safe asset downloads protected against Server-Side Request Forgery (SSRF).
- **Service Management:**
  - Customizable photography packages with pricing, hours, and features.
  - Admin management for creating, editing, and deleting packages.
- **Staff & Client Administration:**
  - Photographer profile directory, specialization tracking, and event assignment.
  - Client relationship management with booking histories.
- **Invoicing & Reports:**
  - PDF invoice generation via `pdfkit` (protected against IDOR; accessible only by booking owners and admins).
  - Excel (`xlsx`) and PDF monthly operational reports for bookings, staff, and feedback.
- **Security Hardened:**
  - Startup environment validation ensuring critical secrets (`MONGO_URI`, `JWT_SECRET`) are configured.
  - `helmet` HTTP security headers and `express-rate-limit` request rate limiting.
  - Path traversal neutralization (`path.basename` and boundary checks) on all local file downloads.
  - Zero sensitive customer uploads or credentials committed to Git.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, React Router v7, Create React App, Vanilla CSS, Axios |
| **Backend** | Node.js (v18+), Express v5, Mongoose v8, JWT, Bcryptjs |
| **Security** | Helmet, Express-Rate-Limit, Crypto, Path traversal sanitization |
| **Database** | MongoDB (v6+) |
| **Cloud Storage** | Cloudinary (with local disk storage fallback) |
| **Reporting & Docs** | PDFKit, SheetJS (XLSX), jsPDF |
| **Notifications** | Nodemailer (with simulation mode when unconfigured) |

---

## 📁 Project Directory Structure

```text
GlobalImage/
├── client/                      # React Frontend Application
│   ├── public/                  # Public static assets & index.html
│   ├── src/
│   │   ├── components/          # Reusable components (Navbar, Footer, Modals)
│   │   ├── pages/               # Client and Admin Views (Bookings, Staff, Portfolio, etc.)
│   │   ├── App.js               # Application routing and layout
│   │   ├── index.js             # Client bootstrap
│   │   └── setupTests.js        # Jest configuration & polyfills
│   └── package.json             # Frontend dependencies & scripts
│
├── server/                      # Express Backend API
│   ├── admin/                   # Legacy admin route handlers & middleware
│   ├── middleware/              # Authentication & RBAC middleware (auth.js)
│   ├── models/                  # Mongoose Schemas (User, Booking, Gallery, Service, Staff, etc.)
│   ├── routes/                  # API Endpoint definitions (auth, bookings, gallery, files, invoice, etc.)
│   ├── scripts/                 # Bootstrap scripts (seedAdmin.js)
│   ├── tests/                   # Automated security & unit test suites (security.test.js)
│   ├── uploads/                 # Local media upload folder (.gitkeep preserved; customer files ignored)
│   ├── utils/                   # Helpers (validateEnv.js, cloudinary.js, pdfUtils.js)
│   ├── index.js                 # Express server bootstrap & middleware pipeline
│   ├── .env.example             # Safe environment variable template
│   └── package.json             # Backend dependencies & scripts
│
├── .gitignore                   # Multi-tier Git exclusion rules
├── AUDIT_REPORT.md              # Codebase security audit and remediation log
└── package.json                 # Root convenience scripts
```

---

## 📋 Prerequisites

Before installing the application, ensure you have:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on port `27017` or a MongoDB Atlas connection URI

---

## ⚙️ Environment Setup

1. Navigate to the backend directory:
   ```bash
   cd GlobalImage/server
   ```

2. Copy the template configuration file:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` in an editor and set your configuration:

   ```ini
   # Server Port
   PORT=5050

   # MongoDB Connection String (Required)
   MONGO_URI=mongodb://localhost:27017/global_image

   # JWT Signing Key (Required - minimum 32 random characters)
   JWT_SECRET=your_super_secret_random_64_character_hex_string_here

   # Client URL for CORS
   CLIENT_URL=http://localhost:3000

   # Cloudinary Media Storage (Optional: if omitted, uploads store locally in server/uploads/)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email Service (Optional: if omitted, email notifications run in simulation mode)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

---

## 🚀 Installation & Getting Started

### 1. Install Backend Dependencies
```bash
cd GlobalImage/server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 3. Bootstrap the Administrator Account
Run the secure administrator seed script to initialize an admin user in your database:
```bash
cd ../server
npm run seed:admin
```
> **Custom Administrator Credentials:**
> You can pass custom credentials via environment variables:
> ```bash
> ADMIN_EMAIL="studio.admin@example.com" ADMIN_PASS="SecureP@ssw0rd2026!" npm run seed:admin
> ```

### 4. Start the Application

You can start the backend and frontend in separate terminal windows:

- **Terminal 1 (Backend API - Port 5050):**
  ```bash
  cd GlobalImage/server
  npm start
  # Or for development with automatic restart:
  npm run dev
  ```

- **Terminal 2 (Frontend Client - Port 3000):**
  ```bash
  cd GlobalImage/client
  npm start
  ```

The client will automatically open at `http://localhost:3000`.

---

## 🧪 Testing & Production Build

### Backend Security Test Suite
The backend includes an automated security test suite that verifies environment validation, bcrypt hashing, JWT verification, RBAC middleware, path traversal protections, and SSRF mitigations:
```bash
cd GlobalImage/server
npm test
```
*Result: 6 test suites, 19 assertions, 100% pass rate.*

### Frontend Production Build
To validate client compilation and produce an optimized production bundle:
```bash
cd GlobalImage/client
npm run build
```
*Output is generated in `client/build/`.*

### Frontend Unit Tests
```bash
cd GlobalImage/client
npm test -- --watchAll=false
```

---

## 🛡️ Security Implementation Details

1. **Zero Hardcoded Secrets:**
   All credentials have been moved to environment variables. Missing or default placeholder keys immediately halt server startup with clear error messages.
2. **Access Control (RBAC):**
   All administrative routes (`/api/bookings/*`, `/api/staff/*`, `/api/services/*`, `/api/gallery/*`, `/api/feedback/*`, `/api/admin/*`) require valid JWT bearer tokens with authorized roles.
3. **Private Customer Files:**
   Payment slips and invoice PDFs cannot be accessed statically or without authorization. Invoices and slips require administrative privileges or proof of booking ownership.
4. **SSRF Hardening:**
   The gallery proxy downloader strictly restricts destination hostnames to `res.cloudinary.com`, blocking access to internal cloud metadata IP addresses (`169.254.169.254`) and local loopback services.
5. **Path Traversal Defense:**
   File-serving routes sanitize filenames using `path.basename()` and enforce resolved path prefix checks against the target upload directory.

---

## 🔧 Troubleshooting

- **Server exits with "Fatal Configuration Errors":**
  Ensure you have created `server/.env` and filled in `MONGO_URI` and a valid `JWT_SECRET` (minimum 16 characters).
- **CORS Error in Browser:**
  Ensure `CLIENT_URL` in `server/.env` matches your frontend origin (default: `http://localhost:3000`).
- **File Upload Issues:**
  If Cloudinary credentials are not supplied, the server automatically writes uploads to `server/uploads/`. Ensure that the `server/uploads/` directory has write permissions.

---

## 📄 License
This project is proprietary and intended for GlobalImage photography business operations.
