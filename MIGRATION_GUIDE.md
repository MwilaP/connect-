# Next.js to Vite Migration Guide

This project has been converted from Next.js App Router to Vite + React + React Router.

## Key Changes

### 1. **Build System**
- **Before**: Next.js
- **After**: Vite with React plugin

### 2. **Routing**
- **Before**: Next.js App Router (file-based routing)
- **After**: React Router v6 (component-based routing)
- All routes are now defined in `src/App.tsx`

### 3. **Server Components → Client Components**
- All components are now client-side rendered
- No more `async` components or server-side data fetching
- Use `useEffect` and `useState` for data fetching

### 4. **Supabase Client**
- **Before**: Used `@supabase/ssr` with server/client separation
- **After**: Uses `@supabase/supabase-js` client-only
- Removed server-side Supabase client (`lib/supabase/server.ts`)
- Middleware authentication removed (was Next.js specific)

### 5. **Environment Variables**
- **Before**: `NEXT_PUBLIC_*` prefix
- **After**: `VITE_*` prefix
- Update your `.env` file accordingly (see `env.example`)

### 6. **File Structure**
```
Before (Next.js):          After (Vite):
app/                       src/
  layout.tsx                 App.tsx
  page.tsx                   main.tsx
  auth/                      pages/
    login/page.tsx             Home.tsx
    signup/page.tsx            Browse.tsx
                               auth/
                                 Login.tsx
                                 Signup.tsx
```

### 7. **Removed Features**
- Next.js middleware (authentication now handled client-side)
- Server components and server actions
- Next.js Image optimization
- Next.js font optimization (Geist fonts)
- `@vercel/analytics`
- `next-themes` (can be re-added with a different implementation)

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `env.example` to `.env` and fill in your Supabase credentials:
```bash
cp env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
pnpm dev
```

The app will run on `http://localhost:3000`

### 4. Build for Production
```bash
pnpm build
```

### 5. Preview Production Build
```bash
pnpm preview
```

## Important Notes

### Authentication Flow
- Authentication is now handled entirely client-side
- User session is managed in `src/App.tsx` using Supabase's `onAuthStateChange`
- Protected routes should be implemented using React Router guards

### Routing
All routes are defined in `src/App.tsx`. To add new routes:
```tsx
<Route path="/your-path" element={<YourComponent />} />
```

### Data Fetching
Use React hooks for data fetching:
```tsx
useEffect(() => {
  async function fetchData() {
    const supabase = createClient()
    const { data } = await supabase.from('table').select()
    // handle data
  }
  fetchData()
}, [])
```

### Styling
- Tailwind CSS v3 is configured
- Global styles are in `app/globals.css`
- shadcn/ui components remain unchanged

## Migration Checklist

- [ ] Install dependencies (`pnpm install`)
- [ ] Set up environment variables (`.env`)
- [ ] Test authentication flow
- [ ] Verify all routes work correctly
- [ ] Check Supabase database queries
- [ ] Test build process (`pnpm build`)
- [ ] Update deployment configuration (if using Vercel, consider switching to Netlify/Cloudflare Pages)

## Troubleshooting

### Module not found errors
Run `pnpm install` to ensure all dependencies are installed.

### Environment variables not working
Make sure your `.env` file uses `VITE_` prefix and restart the dev server.

### TypeScript errors
Run `pnpm build` to check for type errors. The project uses strict TypeScript.

## Next Steps

Consider implementing:
1. **Route guards** for protected pages
2. **Loading states** for async operations
3. **Error boundaries** for better error handling
4. **Dark mode** using a Vite-compatible theme solution
5. **Code splitting** using React.lazy() for better performance
