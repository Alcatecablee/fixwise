# Vercel Deployment Guide

## Quick Setup (3 steps)

### 1. Push to GitHub

Your repo is already configured: `https://github.com/Alcatecablee/Neurolint-CLI`

```bash
git add .
git commit -m "Add real 7-Layer CLI integration with SSE backend"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub: `Alcatecablee/Neurolint-CLI`
4. **Important Configuration:**
   - Framework Preset: **Vite**
   - Root Directory: **Leave blank** (uses root)
   - Build Command: `npm run build`
   - Output Directory: `landing/dist`
   - Install Command: `npm install`

### 3. Deploy

Click "Deploy" - Vercel will automatically:
- Install dependencies
- Build the Vite frontend
- Deploy serverless API functions from `/api` directory
- Set up automatic deployments for future commits

## How It Works

### Frontend
- Built with Vite from `landing/` directory
- Outputs to `landing/dist`
- Served as static files

### Backend API
- Serverless functions in `/api` directory
- Automatically deployed as Vercel Functions
- Each `.js` file becomes an endpoint:
  - `api/analyze.js` → `/api/analyze`
  - `api/stream/[jobId].js` → `/api/stream/:jobId`
  - `api/result/[jobId].js` → `/api/result/:jobId`
  - `api/status.js` → `/api/status`

### Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "landing/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

## Environment Variables

None required! The API works out of the box with no configuration.

## Automatic Deployments

After initial setup:
- Every push to `main` branch triggers a production deployment
- Pull requests get preview deployments
- Check deployment status at vercel.com/dashboard

## Testing Deployment

After deployment, test the API:

```bash
# Replace YOUR-APP.vercel.app with your actual domain
curl https://YOUR-APP.vercel.app/api/status

# Test analysis
curl -X POST https://YOUR-APP.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"code":"const x = 1;","options":{"layers":[1,2,3,4,5,6,7]}}'
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `neurolint.dev`)
3. Follow DNS configuration instructions
4. SSL automatically provisioned

## Monitoring

View logs and analytics:
- Dashboard: `vercel.com/dashboard`
- Function logs: Project → Deployments → Click deployment → Functions
- Real-time: `vercel logs YOUR-APP --follow`

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard. Common issues:
- Missing dependencies in `package.json`
- TypeScript errors (add `skipLibCheck: true` in `tsconfig.json`)
- Build command incorrect

### API Errors

- Check function logs in Vercel dashboard
- Ensure `api/` directory structure is correct
- Verify function timeout isn't exceeded (max 60s)

### Frontend Not Loading

- Verify `outputDirectory` is `landing/dist`
- Check build command produces files in correct directory
- Ensure `index.html` exists in output

## Production Optimizations

Consider adding:

1. **Edge Functions** (faster globally)
   ```json
   {
     "functions": {
       "api/status.js": {
         "runtime": "edge"
       }
     }
   }
   ```

2. **Caching Headers**
   ```json
   {
     "headers": [
       {
         "source": "/api/status",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "s-maxage=60, stale-while-revalidate"
           }
         ]
       }
     ]
   }
   ```

3. **Rate Limiting**
   - Already implemented (10 req/min per IP)
   - Consider upgrading to Vercel's built-in rate limiting for enterprise

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Deployment Issues: Check Vercel dashboard logs
- API Issues: Check function logs in dashboard
