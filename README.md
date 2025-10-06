Private baby photo journal built with Next.js App Router, TypeScript, Tailwind CSS, NextAuth.js with Microsoft OAuth, and Microsoft Graph API. Each subfolder in your OneDrive under `/Apps/BabyJournal` becomes an Instagram-like carousel post with an optional `description.txt` or `.md` caption.

## Getting Started

1) Copy environment variables:

Create `.env.local` from `.env.example` and set values:

```
AUTH_SECRET=replace-with-random-string
AUTH_URL=http://localhost:3000
AUTH_MICROSOFT_ID=your-client-id
AUTH_MICROSOFT_SECRET=your-client-secret
```

2) Azure app registration (Microsoft OAuth):

- Redirect URI (web): `http://localhost:3000/api/auth/callback/microsoft`
- Permissions: `openid`, `profile`, `email`, `offline_access`, `Files.ReadWrite`

3) Install and run the development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Visit `/` to sign in. Then go to `/feed` to see your posts. Place albums in OneDrive at `/Apps/BabyJournal/<AlbumName>` with images and an optional `description.txt`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Notes

- Images are fetched via a signed-in proxy route (`/api/image?id=<driveItemId>`) to keep media private.
- Results are cached in-memory per user for 5 minutes to reduce Graph calls.
- This app uses App Router and server components with a small client Carousel component.

## Deploy on Vercel

Set these environment variables in your Vercel project:

- AUTH_SECRET
- AUTH_URL (e.g., your production domain)
- AUTH_MICROSOFT_ID
- AUTH_MICROSOFT_SECRET

Set Redirect URI in Azure to `https://<your-domain>/api/auth/callback/microsoft` and ensure the same Graph scopes are granted.
