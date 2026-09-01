# Secure File Sharing System

A full-stack, secure web application that enables users to register, log in, and securely upload and download documents. The application employs strict industry-standard cybersecurity best practices, including input validation, password hashing, JSON Web Token (JWT) authorization, secure HTTP response headers, and **AES-256 file encryption**.

---

## 🔒 Security Architectures

1. **User Authentication & Authorization**:
   - Passwords are encrypted before database insertion using `bcrypt` (10 salt rounds).
   - Once authenticated, the server issues a stateless JSON Web Token (JWT) signed with a server-side secret.
   - Protected API routes are gated by a middleware that decodes and verifies the JWT.

2. **On-the-Fly AES-256 File Encryption**:
   - Files are never stored in plaintext on the server.
   - Upon upload, the server reads the file into memory and generates a unique, cryptographically strong 16-byte **Initialization Vector (IV)**.
   - The file is encrypted using `aes-256-cbc` with a 32-byte master key stored in environment variables.
   - The encrypted buffer is written to the `/backend/uploads/encrypted/` folder with a unique UUID filename.
   - The original filename, MIME type, owner reference, and the file-specific IV are stored in MongoDB.

3. **Decryption on Download**:
   - When a download request is received, the server checks the database.
   - **Authorization Check**: The server verifies that the authenticated user requesting the file is the database-registered owner. If they are not, access is denied (403 Forbidden).
   - If authorized, the server reads the encrypted file, decrypts it on the fly using the file's IV, and streams the original decrypted file to the user.

4. **Security Audit Logging**:
   - Real-time logging of critical events:
     - `User Registration`
     - `User Login` (Successful logins write to the audit trail)
     - `Failed Login Attempt` (Logs failed login attempts along with the attempted identity and request IP address)
     - `User Logout`
     - `File Upload`
     - `File Download`
     - `File Deletion`
   - Audit logs are rendered in a dedicated panel on the user's dashboard.

5. **Defense in Depth**:
   - **Helmet.js** middleware sets secure HTTP headers (e.g., XSS Protection, Content Security Policy, HSTS) to protect against common web vulnerabilities.
   - **CORS** restricts backend access to authorized frontend origins.
   - **File Validation** checks both file extension and MIME type at the Multer layer.
   - **Error Handling**: A global error handler catches backend failures and returns generic error messages to clients, preventing internal database structure or stack traces from being exposed.

---

## 💻 Tech Stack

### Backend
- **Node.js** & **Express.js** (Web Server)
- **MongoDB Atlas** & **Mongoose** (Database & ODM)
- **Node Crypto Module** (Symmetric encryption)
- **Multer** (File upload processing)
- **jsonwebtoken** & **bcrypt** (Session security)
- **Helmet** & **CORS** (API hardening)

### Frontend
- **React.js** (Vite-powered single-page application)
- **React Router** (Routing)
- **Axios** (API requests & JWT auto-interceptors)
- **Lucide React** (Standard clean iconography)
- **CSS3** (Plain, clean, light-mode design layout)

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local instance running on `localhost:27017` OR a MongoDB Atlas cluster)

### Step 1: Database Setup
Make sure your local MongoDB service is running, or prepare your MongoDB Atlas connection string.

### Step 2: Backend Configuration
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Copy the sample environment file:
   ```bash
   copy .env.example .env
   ```
4. Configure your `.env` variables:
   - Generate a strong, random 32-byte encryption key for `FILE_ENCRYPTION_KEY`. You can generate one by running:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Update `MONGO_URI` if using MongoDB Atlas.
   - Set a strong `JWT_SECRET` string.

5. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   The backend should start on `http://localhost:5000`.

### Step 3: Frontend Configuration
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend should spin up on `http://localhost:5173`.

---

## 📂 Project Structure

```text
/
├── backend/
│   ├── config/          # MongoDB connection configs
│   ├── controllers/     # Route controller logic
│   ├── middleware/      # Protected routes & upload filters
│   ├── models/          # Mongoose Schemas (User, File, Log)
│   ├── routes/          # RESTful routing endpoints
│   ├── uploads/         # Server storage (temp & encrypted subfolders)
│   ├── utils/           # AES-256 Crypto utilities
│   ├── .env             # Environment configuration (gitignored)
│   └── server.js        # Main server entrypoint
│
└── frontend/
    ├── public/          # Static public assets
    └── src/
        ├── components/  # Navbar, ProtectedRoute
        ├── context/     # AuthState Provider
        ├── pages/       # Login, Register, Dashboard UI
        ├── services/    # Axios API client interceptor
        ├── App.jsx      # Navigation router
        ├── index.css    # Plain, clean styling styles
        └── main.jsx     # App mounting entrypoint
```

---

## 🧪 Verification & Security Walkthrough
To verify the cybersecurity properties of this application:
1. **Physical File Check**: Upload a file (e.g. `test.pdf`) through the dashboard. Navigate to `backend/uploads/encrypted/` and locate the newly created `.enc` file. Try opening it with a PDF viewer or text editor. You will see high-entropy encrypted binary data, proving it cannot be read without the key.
2. **Access Control Check**: Log in as User A, upload a document, and note down its File ID. Log in as User B and attempt to execute a curl request to `http://localhost:5000/api/files/download/<File-ID>`. The server will block the request and return a `403 Forbidden` response.
3. **Audit Trail check**: Register a new user, log in, perform upload and download operations, and trigger a failed login attempt (entering a wrong password). Check the `Security Activity Audit Logs` tab on your dashboard. You will see every event registered with timestamp and IP address.
