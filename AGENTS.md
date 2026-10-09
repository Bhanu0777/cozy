# COZY - A little place for two

A free, private online room for exactly two people: real-time chat, synchronized YouTube watching, a "Squeeze" (virtual hug), and shared mood/presence.

## Development Server

Start the development server with `npm run dev` from the root directory. This runs:
- Server on port 3001 (Express + Socket.IO)
- Client on port 5173 (Vite dev server)

```bash
npm run dev
```

The client hot-reloads automatically when source files change.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

### Root
- `package.json` - Workspace configuration with scripts for dev, build, and start
- `.env.example` - Example environment variables (copy to `.env` for Supabase)
- `README.md` - Project documentation

### Client (`client/`)
- `client/src/main.tsx` - React entrypoint; mounts `client/src/App.tsx` into the `#root` element
- `client/src/App.tsx` - Primary application component with routing
- `client/src/index.css` - Global CSS
- `client/vite.config.ts` - Vite configuration
- `client/package.json` - Client dependencies and scripts
- `client/src/pages/` - Page components (Home, CreateRoom, JoinRoom, Room)
- `client/src/components/` - Reusable components (Chat, MoodPicker, Room, Squeeze, UI, YouTubePlayer)
- `client/src/hooks/` - Custom React hooks (useRoomSocket)
- `client/src/services/` - API and session services
- `client/src/types/` - TypeScript type definitions
- `client/src/utils/` - Utility functions (moods, sound, youtube)

### Server (`server/`)
- `server/src/server.ts` - Express server entrypoint
- `server/src/socket/index.ts` - Socket.IO event handlers
- `server/src/routes/rooms.ts` - HTTP API routes
- `server/src/services/store.ts` - Room and session storage (memory or Supabase)
- `server/src/services/utils.ts` - Server utilities
- `server/src/middleware/rateLimit.ts` - Rate limiting middleware
- `server/package.json` - Server dependencies and scripts

### Supabase (`supabase/`)
- `supabase/schema.sql` - Database schema for persistence

## Dependencies

### Client
- Runtime: React, React DOM
- Routing: React Router DOM
- Animations: Framer Motion
- Icons: Lucide React
- Real-time: Socket.IO Client
- Build: Vite, TypeScript

### Server
- Runtime: Node.js
- Framework: Express
- Real-time: Socket.IO
- Database: Supabase (optional)
- Storage: bcrypt (for session tokens)

## Styling

The client uses custom CSS in `client/src/index.css` and component-specific styles. No Tailwind CSS is used.

## Code quality

- Use TypeScript for type safety
- Follow existing code patterns in the repository
- Keep components focused and reusable
- Server validates all client actions (never trust the client)
