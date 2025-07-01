# GexChat

A modern real-time chat application built with React, Next.js, Tailwind CSS, and Firebase.

## Features

- **Real-time messaging** - Messages appear instantly without page refresh
- **User authentication** - Secure login and user management
- **Friend system** - Add contacts and start conversations
- **Modern UI** - Clean, responsive design
- **Chat management** - Organized chat list with recent activity

## Tech Stack

- **Frontend**: React, Next.js 15, TypeScript
- **Styling**: Tailwind CSS, Material-UI
- **Backend**: Firebase (Firestore, Auth)
- **Real-time**: Firestore listeners

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

## Development

The project follows Next.js 15 App Router conventions:

- `/src/app` - Pages and layouts
- `/src/components` - React components
- `/src/hooks` - Custom hooks
- `/src/lib` - Firebase configuration
- `/src/types` - TypeScript definitions

## Firebase Setup

Create a `.env.local` file with your Firebase project credentials.
