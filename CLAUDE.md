# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Run dev server with hot reload and longpolling initialization
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Code Style
- **Imports**: Group imports by source (internal/external), sort alphabetically
- **TypeScript**: Use explicit types, avoid `any`, prefer `interface` for object types
- **Naming**: camelCase for variables/functions, PascalCase for React components/interfaces
- **Components**: Use functional components with TypeScript. Include 'use client' directive when needed
- **Error Handling**: Use try/catch blocks for async operations, log errors appropriately
- **Tailwind**: Use utility classes, create consistent patterns for repeated styling
- **State Management**: Use React context for global state, useState for component state
- **Formatting**: Use semicolons, single quotes, 2 space indentation
- **File Structure**: Components in appropriate directories, utility functions in `/utils`