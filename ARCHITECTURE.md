# 🏛 System Architecture

This document provides an in-depth breakdown of the **Studio Admin Portal's** structure, component responsibilities, and data flow to help new collaborators seamlessly onboard to the codebase.

## 📂 File & Folder Structure Map

```text
photographywebadmin/
├── /api                    # Serverless API endpoints for Cloudinary operations
│   ├── delete-image.js     # Deletes assets securely
│   ├── get-counts.js       # Fetches stats/counts of media
│   ├── get-images.js       # Retrieves gallery images list
│   └── sign-upload.js      # Generates secure upload signatures
├── /src                    # React Frontend Code
│   ├── /assets             # Static resources (images, fonts, etc.)
│   ├── /components         # Reusable UI modules & Feature components
│   │   ├── MediaManager.jsx    # Displays and manages media assets
│   │   ├── SmartUploader.jsx   # Cloudinary integrated uploader logic
│   │   └── ProtectedRoute.jsx  # Wrapper to restrict unauthenticated access
│   ├── /config             # Configuration wrappers
│   │   └── firebase.js         # Firebase initialization and exports
│   ├── /context            # Global React Contexts
│   │   └── AuthContext.jsx     # Provides Firebase auth state globally
│   ├── /hooks              # Custom React hooks
│   │   └── useAuth.js          # Consumes AuthContext seamlessly
│   ├── /pages              # Full Page Views
│   │   ├── Dashboard.jsx       # Admin portal main interface
│   │   └── Login.jsx           # Firebase Authentication entry point
│   ├── App.jsx             # Main Router configuration and Layout wrappers
│   ├── index.css           # Global stylesheets & Tailwind imports
│   └── main.jsx            # React root mount point
├── package.json            # Project dependencies and script configurations
├── tailwind.config.js      # Tailwind CSS configuration rules
├── vite.config.js          # Vite config (Includes custom Vercel API emulator plugin)
└── .env.local              # Environment variables (Ignored in Git)
```

## 🧱 Component & Page Layer Breakdown

### 1. Page Wrappers
- **`/src/pages/Login.jsx`**: The entry point for unauthenticated users. It leverages Firebase to authenticate the admin.
- **`/src/pages/Dashboard.jsx`**: The core admin interface. It is protected by `ProtectedRoute.jsx` and orchestrates the rendering of the media manager and uploader widgets.

### 2. Shared UI / Presentation Layer
- **`MediaManager.jsx`**: A complex UI component that lists, previews, and deletes existing gallery assets via the API layer.
- **`SmartUploader.jsx`**: A specialized interface for handling file uploads, maintaining upload states, and seamlessly communicating with Cloudinary.
- **`ProtectedRoute.jsx`**: A High-Order Component (HOC) that intercepts unauthenticated routes and redirects to `/login`.

### 3. Custom Hooks & Logic Layer
- **`AuthContext.jsx` & `useAuth.js`**: Initializes a Firebase listener on mount. Exposes the `currentUser` object and a `loading` state to all descendant components, avoiding prop-drilling across the app.
- **`firebase.js`**: Standardizes the initialization pattern of the Firebase application, ensuring the Auth module is exported cleanly.

### 4. Serverless / API Handlers
Housed in the `/api` directory, these serverless functions interact directly with the Cloudinary SDK using secure backend credentials (`CLOUDINARY_API_SECRET`). During local development, they are intercepted and executed via a custom Vite plugin defined in `vite.config.js`.
- **`get-images.js`**: Fetches paginated lists of media across defined categories.
- **`get-counts.js`**: Retrieves statistical counts of media assets for the dashboard.
- **`delete-image.js`**: A secure endpoint to completely remove assets from Cloudinary storage.
- **`sign-upload.js`**: Creates a signed token necessary for direct-to-Cloudinary frontend uploads.

## 🔄 Data Flow & State Management

### Authentication Flow
1. User navigates to `/dashboard`.
2. `ProtectedRoute` mounts. `useAuth()` hook checks the `currentUser` state from `AuthContext`.
3. If no user is present, the app navigates to `/login`.
4. User logs in -> Firebase validates -> `AuthContext` state updates -> App redirects back to `/dashboard`.

### Media Upload Flow (Cloudinary)
1. User selects an image in `SmartUploader.jsx`.
2. Component fetches a secure signature from `/api/sign-upload`.
3. With the signature, the file is POSTed directly from the browser to Cloudinary's upload API (bypassing the custom server backend to save bandwidth).
4. On success, `SmartUploader` updates the UI and prompts a refresh in `MediaManager.jsx`.

### Media Fetch & Render Flow
1. `MediaManager.jsx` mounts and issues a request to the `/api/get-images` endpoint.
2. The serverless function queries Cloudinary using the secure secret and returns a JSON payload consisting of URLs and public IDs.
3. The component hydrates its local state with the JSON data.
4. Assets are rendered using Tailwind CSS grids, integrating skeleton loaders for a smooth visual experience.

## 🎨 Design Tokens & Styling Conventions

- **Tailwind CSS Integration:** This project uses Tailwind v4 capabilities via `@tailwindcss/postcss`. We avoid creating separate `.css` files unless absolutely necessary for global resets in `index.css`.
- **Responsive Breakpoints:** Utilize Tailwind's default breakpoints (`sm`, `md`, `lg`, `xl`) to orchestrate flexible grids for media masonry layouts and complex dashboard panels.
- **Lucide Icons:** Used consistently across the UI (e.g., trash icons, upload clouds) for a modern, lightweight vector graphical footprint without bloating the bundle.
- **Premium Aesthetics:** Designed with sleek, intuitive administrative dashboards in mind. Focus on clear typography, intentional spacing, and subtle hover states managed exclusively through Tailwind utility classes.
