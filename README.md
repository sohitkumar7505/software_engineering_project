# SE Project - Travel Auth + AI Planner

This project includes:
- React signup/login pages
- Protected travel planner page after login
- Node/Express backend with MongoDB auth
- ChatGPT-based trip planning endpoint

## Project Structure
- `client/` React app (Vite)
- `server/` Express API with MongoDB

## Backend Setup
1. Go to backend:
```bash
cd server
npm install
```

2. Create `.env` from `.env.example`:
```env
PORT=5002
MONGODB_URL=<your_mongodb_connection_string>
JWT_SECRET=<your_secret>
OPENAI_API_KEY=<your_openai_api_key>
OPENAI_MODEL=gpt-4.1-mini
```

3. Start server:
```bash
npm run dev
```

## Frontend Setup
1. Go to frontend:
```bash
cd client
npm install
```

2. Create `client/.env`:
```env
VITE_API_URL=http://localhost:5002
```

3. Start frontend:
```bash
npm run dev
```

## Main Flow
1. Signup user
2. Login user
3. User is redirected to `/trip-planner`
4. Enter source, destination, date
5. Backend calls ChatGPT and returns structured travel planning

## APIs
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/profile` (protected)
- `POST /api/v1/planner/generate` (protected)
