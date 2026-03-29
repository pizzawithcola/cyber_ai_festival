# MENAT AI Festival

## Quick Start

```bash
npm install
```

## Environment Setup

Create environment files from the example:

```bash
# For development (connects to localhost:8848)
cp .env.example .env.development

# For production (connects to AWS)
cp .env.example .env.production
```

Edit each file with the appropriate values:

**.env.development**
```env
VITE_API_URL=http://localhost:8848
VITE_API_KEY=your-api-key-here
```

**.env.production**
```env
VITE_API_URL=http://cyber-ai-festival-alb-xxx.ap-south-1.elb.amazonaws.com
VITE_API_KEY=your-api-key-here
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server, connects to **localhost** backend |
| `npm run dev:prod` | Start dev server, connects to **AWS production** backend |
| `npm run build` | Build for production (uses production env) |
| `npm run build:dev` | Build for development (uses development env) |
| `npm run preview` | Preview production build |

## API Authentication

All API calls require the `X-API-Key` header. The key is configured in the environment files and automatically included in all requests through the `apiFetch` utility in `src/services/api.ts`.