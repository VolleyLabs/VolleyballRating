# VolleyballRating
A Next.js application with ELO rating system for volleyball players. This Telegram Mini App helps players vote, join games, and track their ratings.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **ELO Rating System**: Track player performance and skill progression
- **Telegram Integration**: Built as a Telegram Mini App for seamless user experience
- **Game Voting**: Players can vote to join upcoming volleyball games
- **Leaderboard**: Display player rankings based on their performance
- **Game History**: Track past games and player participation

## Getting Started

First, run the development server:

```bash
npm run dev
```

This command runs the Next.js development server with Turbopack and initializes the Telegram bot longpolling.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Available Commands

```bash
# Development
npm run dev       # Run dev server with hot reload and longpolling
npm run lint      # Run ESLint to check code issues
npm run tunnel    # Create a public tunnel for webhook development

# Production
npm run build     # Build the production application
npm run start     # Start the production server

# API Client
npm run update-client  # Update the Supabase API client
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a custom font family for Vercel.

## Project Structure

- `/src/app` - Main application code
  - `/components` - React components for UI features
  - `/context` - React contexts for state management
  - `/lib` - Supabase queries and database interactions
  - `/telegram` - Telegram bot implementation and handlers
  - `/utils` - Utility functions and helpers
  - `/api` - API routes for webhook, longpolling, and cron jobs

## Code Style

- **TypeScript**: Strong typing with explicit type definitions
- **React**: Functional components with TypeScript
- **Tailwind CSS**: Utility-first styling approach
- **Error Handling**: Try/catch blocks for async operations
- **Telegram SDK**: Integration with Telegram Mini App platform
- **Supabase**: Backend database and authentication

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps) - Documentation for Telegram Mini Apps
- [Supabase](https://supabase.io/docs) - Open source Firebase alternative

## Deployment

This application is configured for deployment on Vercel:

```bash
vercel
```

For detailed deployment instructions, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
