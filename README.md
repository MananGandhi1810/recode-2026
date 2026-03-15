# Recode 2026

A modern full-stack application with a Next.js frontend and Node.js backend, featuring real-time chat, authentication, and scalable architecture.

## Features
- **Next.js Frontend**: Fast, modern UI with reusable components
- **Node.js Backend**: REST API, WebSocket support, authentication
- **Prisma ORM**: Type-safe database access
- **Dockerized**: Easy setup and deployment
- **Real-time Chat**: Channels, rooms, and member management

## Project Structure
```
frontend/   # Next.js app (UI, components, pages)
backend/    # Node.js API, WebSocket, Prisma, routes
```

## Quick Start

### 1. Clone the repository
```sh
git clone <repo-url>
cd recode-2026
```

### 2. Start with Docker Compose
```sh
docker-compose up --build
```

### 3. Access the app


## Scripts
This project is a full-stack application with a clear separation between frontend and backend, designed for scalability and real-time features.

### Backend
- **Node.js/Express**: Handles REST API endpoints and WebSocket connections for real-time chat.
- **Authentication**: Managed via dedicated middleware and utility files, supporting secure user sessions.
- **Prisma ORM**: Provides type-safe access to the database, with schema and migrations managed in `backend/prisma/`.
- **Chat Logic**: Real-time chat is implemented using WebSocket handlers, supporting channels, rooms, and member management.
- **API & Socket Routes**: Organized in `backend/routes/` and `backend/handlers/` for modularity.
- `pnpm install` — Install dependencies (run in both frontend/ and backend/)
### Frontend
- **Next.js**: Modern React-based UI with server-side rendering and routing.
- **Components**: Modular UI components for chat, user management, and layout, located in `frontend/src/components/`.
- **Authentication**: Client-side logic in `frontend/src/lib/auth-client.js` integrates with backend APIs.
- **Chat UI**: Real-time chat interface, channel/room navigation, and member lists.
- `pnpm dev` — Start development server
### Database
- **Prisma**: Database schema defined in `backend/prisma/schema.prisma`.
- **Migrations**: Versioned migrations for evolving the database structure.
- `pnpm build` — Build for production
### Communication
- **REST API**: Frontend communicates with backend for data operations (auth, user, etc.).
- **WebSocket**: Enables real-time chat and updates between users.

### DevOps
- **Docker Compose**: Orchestrates frontend, backend, and database services for easy local development and deployment.
## Tech Stack
---
- Next.js, React, Tailwind CSS
- Node.js, Express, Prisma
- PostgreSQL, Redis
- Docker, pnpm

---

## License
MIT License
