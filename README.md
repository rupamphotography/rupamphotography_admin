# 📌 Studio Admin Portal

**Photography Web Admin** is the secure administrative control panel designed to manage portfolio assets. It provides an intuitive interface for authenticating studio managers, uploading new media directly to Cloudinary, and managing gallery collections.

## 🚀 Quickstart Guide

To get this project running locally on your machine, follow these steps:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd photographywebadmin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and copy the necessary keys (refer to the section below).

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

## 🔐 Environment Variables

This project uses local JWT for authentication and Cloudinary for media storage. You need to configure the following keys in your `.env.local`:

**Authentication Configuration:**
- `ADMIN_USERNAME` - The admin username used for login.
- `ADMIN_PASSWORD_HASH` - The bcrypt hash of the admin password.
- `JWT_SECRET` - Secret key used for signing authentication tokens.

**Cloudinary Configuration:**
- `VITE_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name.
- `CLOUDINARY_API_KEY` - Cloudinary API key (used securely in backend/serverless functions).
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (used securely in serverless functions).

## 🛠 Tech Stack

- **Framework:** React 19 & Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 & PostCSS
- **Authentication:** Local JWT & bcryptjs
- **Media Management:** Cloudinary SDK
- **Backend:** Serverless API routes (`/api` mapped via Vite plugin natively for Vercel)
- **Icons:** Lucide React

## 🤝 Collaborator Guidelines

- **Branching:** Ensure you create feature branches (`feature/your-feature`) and open Pull Requests against `main`.
- **Component Design:** Keep components functional, reusable, and maintainable. Use hooks for business logic separation.
- **Styling:** Utilize Tailwind CSS strictly; avoid inline styles. For custom configurations, refer to `tailwind.config.js`.
- **Security:** Do NOT expose `CLOUDINARY_API_SECRET` to the frontend. All secure operations (deletions, uploads signing) must be routed through the `/api` layer.
