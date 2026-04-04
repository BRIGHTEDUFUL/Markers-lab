# Maker’s Lab - Project Management PWA

Where ideas merge with execution.

## Features

- **User Dashboard**: Submit and track projects with real-time status updates.
- **Admin Console**: Manage all projects, update statuses, add internal notes, and feature projects.
- **Real-time Messaging**: Direct chat between users and admins.
- **Public Gallery**: Showcase featured projects and approved testimonials.
- **PWA Support**: Installable on mobile and desktop with offline support.
- **Secure Auth**: JWT-based authentication with HTTP-only cookies.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Socket.IO.
- **Database**: SQLite with Prisma ORM.
- **Real-time**: Socket.IO for instant updates.

## Getting Started

### Local Development Setup

Follow these steps to get the application running on your local machine:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/BRIGHTEDUFUL/Marker-Lab-.git
    cd Marker-Lab-
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and copy the contents from `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Then, update the `.env` file with your specific configuration (e.g., `GEMINI_API_KEY`, `JWT_SECRET`).

4.  **Initialize the Database**:
    This project uses Prisma with SQLite for easy local setup. Run the following command to create the database and generate the Prisma client:
    ```bash
    npx prisma db push
    ```

5.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Default Credentials

- **Admin Account**: `admin@makerslab.com` / `admin123`
- **Demo User Account**: `user@makerslab.com` / `password123`
- **New Users**: You can register a new account directly from the login page.

## Deployment

### Production Build

1. **Build the Frontend**:
   ```bash
   npm run build
   ```

2. **Start the Server**:
   ```bash
   NODE_ENV=production npm start
   ```

### Database Migration (Production)

For production environments, it is recommended to use a more robust database like PostgreSQL. To switch:
1. Update the `provider` and `url` in `prisma/schema.prisma`.
2. Provide a valid `DATABASE_URL` in your production environment variables.
3. Run `npx prisma migrate deploy` to apply migrations.

## File Storage

By default, uploaded files are stored in the local `uploads/` directory. For production deployments, it is highly recommended to use a cloud storage provider (like AWS S3, Google Cloud Storage, or Cloudinary) by modifying the `multer` configuration in `server.ts`.
