# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` - Start development server on port 3001
- `bun run build` - Build production bundle
- `bun run preview` - Preview production build
- `bun run typecheck` - Run TypeScript type checking

### Code Quality
- `bun run format` - Format code with Biome (includes auto-fixing)
- After making changes, always run `bun run typecheck` to ensure code correctness

### Git Hooks
- `./setup-githooks.sh` - Set up git hooks for the project

## Architecture Overview

### Tech Stack
- **Framework**: React 19 with Vite for development, RSBuild config present but using Vite
- **Routing**: TanStack Router with file-based routing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, Zustand for client state
- **Authentication**: Clerk with organization support
- **Code Quality**: Biome for formatting and linting

### Key Architectural Patterns

#### Multi-Tenant Organization System
The app supports both personal workspaces (`/user/{username}`) and organization workspaces (`/org/{org-slug}`). Routes are dynamically prefixed based on the current organization context. The routing system in `main.tsx` handles automatic redirects and organization switching.

#### Custom Query System
Uses a resource-based query key pattern instead of URL-based keys:
```typescript
// ✅ Correct pattern
useQuery({ queryKey: ["machine", machineId, "check-custom-nodes"] })

// ❌ Avoid this
useQuery({ queryKey: [`${API_URL}/machine/${machineId}/check-custom-nodes`] })
```

The `queryFn` is automatically handled by the global override in `providers.tsx`, which uses the `api()` utility.

#### API Layer
- Central `api()` function in `lib/api.ts` handles authentication, error handling, and date conversion
- Automatically attaches Clerk auth tokens
- Converts date strings to Date objects in responses
- Supports upload progress tracking

#### Component Architecture
- **UI Components**: Located in `src/components/ui/` (shadcn/ui based)
- **Feature Components**: Organized by domain (workspace, machines, workflows, etc.)
- **Custom Components**: Extended shadcn components in `src/components/custom/`
- **Magic UI**: Animation components in `src/components/magicui/`

#### Route Structure
- File-based routing with TanStack Router
- Routes auto-generated in `routeTree.gen.ts`
- Organization-aware routing with dynamic prefixes
- Shared layouts in `__root.tsx`

### Key Configuration Files
- `vite.config.ts` - Main build configuration
- `rsbuild.config.ts` - Alternative build system (not currently used)
- `biome.json` - Linting and formatting rules
- `tailwind.config.ts` - Tailwind configuration
- `tsr.config.json` - TanStack Router configuration

### Environment Variables
Required:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Optional (with defaults):
- `NEXT_PUBLIC_CD_API_URL` (defaults to `http://localhost:3011`)
- `NEXT_PUBLIC_POSTHOG_KEY`
- `COMFYUI_FRONTEND_URL`

### Development Guidelines

#### Query Pattern
Follow resource-based query keys and use the global `queryFn`. For mutations, always invalidate relevant queries:

```typescript
const mutation = useMutation({
  mutationFn: async () => api({ 
    url: `machine/${id}/update`, 
    init: { method: "POST", body: JSON.stringify(data) }
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["machine", id] });
  }
});
```

#### Dialog Components
Use URL state for dialog visibility when appropriate and include proper TypeScript types:

```typescript
function CustomDialog({ 
  machine, 
  open, 
  onOpenChange 
}: {
  machine: Machine;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) { /* ... */ }
```

#### CSS Classes
- Sort Tailwind classes alphabetically
- Use `cn()` utility for conditional classes
- Prefer Tailwind utilities over custom CSS

#### Error Handling
- Use toast notifications for user feedback
- Handle loading states with proper UI feedback
- Avoid `any` types - use proper TypeScript interfaces