# Live Streaming Platform

A Twitch-style platform where users go live from OBS, watch streams in the browser and chat in real time.

## Features

- Live video streaming with low latency, powered by LiveKit
- Real-time chat for every stream, with host moderation controls
- Authentication and user profiles with Clerk, synced to the database through webhooks
- Follow and block system
- Creator dashboard: stream keys, chat settings, community management
- Stream thumbnail uploads
- Light and dark themes

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router, Server Actions), React, TypeScript |
| Streaming | LiveKit (client, server SDK, React components) |
| Data | Prisma, MongoDB |
| Auth | Clerk, Svix webhooks |
| State | Zustand |
| UI | Tailwind CSS, shadcn/ui (Radix UI), TanStack Table |
| Uploads | UploadThing |

## Project structure

- `app/` - routes and layouts
- `actions/` - server actions
- `components/` - UI components
- `hooks/`, `store/` - client hooks and Zustand stores
- `lib/` - services and data access
- `prisma/` - database schema

## Getting started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in the Clerk, LiveKit, UploadThing and database keys
3. Generate the Prisma client: `npx prisma generate`
4. Start the dev server: `npm run dev`

Clerk and LiveKit webhooks need a public URL in development, for example through ngrok.
