# GexChat

A modern real-time chat application built with React, Next.js, Tailwind CSS, and Firebase.

## Features

- **Real-time messaging** - Messages appear instantly without page refresh
- **Live chat updates** - All chats update in real-time, even when not actively viewing them
- **User authentication** - Secure login/logout with Firebase Auth
- **Modern UI** - Clean, responsive design with Material-UI components
- **Friend system** - Add contacts and start conversations
- **Chat management** - Organized chat list with recent activity sorting

## Tech Stack

- **Frontend**: React, Next.js 15, TypeScript
- **Styling**: Tailwind CSS, Material-UI
- **Backend**: Firebase (Firestore, Auth)
- **State Management**: React Query v5
- **Real-time**: Firestore onSnapshot listeners

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Real-Time Architecture

The app uses an optimized real-time system:

- **Global Chat Listener**: Monitors last messages for ALL user chats efficiently
- **Active Chat Listener**: Provides full message stream for the currently open chat
- **React Query Integration**: Hybrid caching for fast initial loads and real-time updates
- **Smart Network Usage**: Only syncs necessary data to minimize bandwidth

## Development

The project structure follows Next.js 15 App Router conventions with:

- `/src/app` - App router pages and layouts
- `/src/components` - Reusable React components
- `/src/hooks` - Custom hooks for data and state management
- `/src/lib` - Firebase configuration and service functions
- `/src/types` - TypeScript type definitions

## Firebase Setup

You'll need to configure Firebase with your own project credentials. Create a `.env.local` file with your Firebase config.
