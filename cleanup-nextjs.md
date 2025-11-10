# Next.js to Vite Cleanup

After confirming that the Vite application works correctly, you can remove the following Next.js specific files and directories:

## Directories to Remove

```bash
# App Router directory
rm -rf app/

# Next.js build output
rm -rf .next/
```

## Files to Remove

```bash
# Next.js configuration
rm next.config.mjs
rm middleware.ts
rm next-env.d.ts

# Next.js specific files
rm -rf .vercel/
```

## Files to Keep

- Keep all files in `src/` directory - these are your converted Vite files
- Keep all files in `components/` directory - these have been updated to work with React Router
- Keep all files in `lib/` directory - these have been updated for Vite environment variables
- Keep all files in `public/` directory - these are your static assets
- Keep `styles/` directory - these are your CSS files

## Environment Variables

Remember to update your environment variables:
- Create a `.env` file based on the `env.example` template
- Replace `NEXT_PUBLIC_` prefixes with `VITE_` prefixes

## Package Installation

After cleanup, run:

```bash
pnpm install
```

## Starting the Development Server

```bash
pnpm dev
```

This will start the Vite development server at http://localhost:3000
