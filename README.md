
# codemeet

codemeet is a collaborative interview-practice app that combines real-time audio/video, a shared code editor, and a built-in text notepad for session notes. The app uses a React frontend, an Express + Socket.IO backend, and MongoDB for authentication data.

## Features

- Real-time audio and video communication with PeerJS
- Collaborative code editing with language switching and shared output state
- Shared text notes for interview planning and solution writing
- User authentication with login, registration, and logout flows
- Socket-based room syncing for messages, code, input, output, language, and notes

## Project Structure

- `frontend/` - Vite + React app
- `backend/` - Express API, auth routes, Socket.IO server, and MongoDB connection
- `docker-compose.yml` - Local container setup for backend and frontend
- `Jenkinsfile`, `azure-pipelines.yml`, `sonar-project.properties` - CI and quality configuration

## Requirements

- Node.js 20 or newer
- npm
- MongoDB instance for the backend

## Environment Variables

### Backend

Create `backend/.env` with:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
PORT=3000
CLIENT_URL=http://localhost:5173
```

### Frontend

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

If you are using the deployed backend, replace those values with the deployed service URL.

## Local Development

### 1. Start the backend

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:3000` by default.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Docker

You can also start the app with Docker Compose:

```bash
docker compose up --build
```

The backend container expects MongoDB to be reachable at `host.docker.internal`.

## Available Scripts

### Backend

- `npm start` - start the Express server

### Frontend

- `npm run dev` - start the Vite dev server
- `npm run build` - build the production frontend bundle
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build

## Backend API

Authentication routes are exposed under `/api`:

- `POST /api/login`
- `POST /api/register`
- `POST /api/logout`

## Realtime Events

The backend Socket.IO server supports room-based collaboration for:

- messages
- code updates
- input/output updates
- language changes
- text note changes

## License

No license has been specified for this repository.// trigger azure pipeline
