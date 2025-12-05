# Payroll HR Management - Backend API

Node.js/Express backend for the Payroll HR Management system.

## Tech Stack

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Cloudinary** for file uploads
- **bcryptjs** for password hashing

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update with your actual values

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for required variables.

## Deployment

This backend is configured for deployment on Render.com (free tier).

See `render.yaml` for deployment configuration.

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user (requires auth)
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- And more...

## License

Private - All rights reserved
