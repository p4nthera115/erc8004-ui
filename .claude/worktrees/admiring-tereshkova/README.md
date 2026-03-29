# Showcase3D

Premium 3D product visualization for Shopify stores. Transform static product images into stunning interactive 3D experiences.

![Showcase3D](https://via.placeholder.com/800x400/09090a/d4a24a?text=Showcase3D)

## Features

- **60fps Performance** - Optimized rendering pipeline for silky-smooth interactions on any device
- **Studio Lighting** - Professional HDRI environments and customizable lighting presets
- **Theme App Extension** - Seamless integration using native Shopify App Blocks
- **Mobile Ready** - Fully responsive, touch-optimized experience
- **Analytics** - Track viewer engagement and model interactions

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **3D Engine:** React Three Fiber + Three.js
- **Database:** Prisma + PostgreSQL
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Auth:** Shopify OAuth (offline tokens)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Shopify Partner account
- ngrok (for local development)

### Installation

1. **Clone and install dependencies:**

```bash
cd showcase3d
npm install
```

2. **Set up environment variables:**

Create a `.env` file based on the example:

```env
# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes

# App URLs
NEXT_PUBLIC_APP_URL=https://your-app.ngrok.io
SHOPIFY_APP_URL=https://your-app.ngrok.io

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/showcase3d?schema=public"

# Session Secret
SESSION_SECRET=your-super-secret-session-key

# Environment
NODE_ENV=development
```

3. **Set up the database:**

```bash
npx prisma generate
npx prisma db push
```

4. **Configure Shopify App:**

Update `shopify.app.toml` with your app credentials:

```toml
client_id = "your-client-id"
application_url = "https://your-app.ngrok.io"
```

5. **Start development server:**

```bash
npm run dev
```

Or use Shopify CLI for integrated development:

```bash
shopify app dev
```

## Project Structure

```
showcase3d/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # OAuth endpoints
│   │   │   ├── models/        # Model CRUD
│   │   │   └── proxy/         # Storefront proxy
│   │   ├── app/               # Dashboard (embedded app)
│   │   ├── auth/              # Install page
│   │   ├── demo/              # Public demo page
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── viewer/            # 3D viewer components
│   └── lib/                   # Utilities & configurations
├── extensions/
│   └── showcase3d-block/      # Theme App Extension
│       ├── blocks/            # Liquid blocks
│       └── assets/            # JS/CSS for storefront
├── prisma/
│   └── schema.prisma          # Database schema
└── shopify.app.toml           # Shopify app config
```

## Development

### Database Changes

After modifying `prisma/schema.prisma`:

```bash
npx prisma generate
npx prisma db push
```

### Theme App Extension

The 3D viewer is added to storefronts via Theme App Extension. Merchants can add the "3D Product Viewer" block to any section in the theme editor.

### Testing Locally

1. Start ngrok: `ngrok http 3000`
2. Update URLs in `.env` and `shopify.app.toml`
3. Run `shopify app dev`

## API Endpoints

| Endpoint             | Method | Description           |
| -------------------- | ------ | --------------------- |
| `/api/auth`          | GET    | Begin OAuth flow      |
| `/api/auth/callback` | GET    | OAuth callback        |
| `/api/models`        | GET    | List models for store |
| `/api/models`        | POST   | Create new model      |
| `/api/models/[id]`   | GET    | Get model details     |
| `/api/models/[id]`   | PATCH  | Update model          |
| `/api/models/[id]`   | DELETE | Delete model          |
| `/api/proxy/viewer`  | GET    | Public viewer data    |

## Environment Presets

Available lighting environments for the 3D viewer:

- `studio` - Clean studio lighting (default)
- `city` - Urban environment
- `sunset` - Warm sunset tones
- `night` - Dark dramatic lighting
- `warehouse` - Industrial setting
- `forest` - Natural outdoor lighting

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database

Use any PostgreSQL provider:

- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [PlanetScale](https://planetscale.com) (MySQL alternative)

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ for premium Shopify stores.
