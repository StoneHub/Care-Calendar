# Development Guidelines for Care-Calendar

## Build/Run/Test Commands
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Lint code: `npm run lint`
- Type check: `npm run typecheck`
- Run tests: `npm test`
- Run single test file: `npm test -- -t "test name pattern"`

## Code Style Guidelines

### Formatting & Structure
- Use TypeScript for type safety
- Format with Prettier
- Use functional React components with hooks
- Follow consistent indentation (2 spaces)

### Naming & Import Conventions
- PascalCase for components (e.g., `CareScheduler`)
- camelCase for variables, functions, and instances
- Group imports: React, external libraries, internal modules
- Use absolute imports from src root where possible

### State Management
- Use React hooks (useState, useEffect) for component state
- Prefer local state when possible
- Follow immutability patterns when updating state objects

### Error Handling
- Use try/catch blocks for async operations
- Add appropriate fallbacks for missing data
- Display user-friendly error messages

### Component Structure
- Keep components focused on a single responsibility
- Extract reusable UI elements into separate components
- Use React.memo for performance optimization when appropriate