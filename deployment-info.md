# Key Deployment Info

## Backend API
- **Production URL**: https://c2bkpmkrug.execute-api.us-east-1.amazonaws.com/prod
- **Local Development**: http://localhost:8000

## AWS Amplify Configuration

### amplify.yml Build Settings

**Important**: Next.js builds to `.next` directory, not `dist`

```yaml
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next  # ✅ Correct for Next.js
    files:
      - '**/*'
```

### Common Issue
- ❌ `baseDirectory: dist` - Wrong for Next.js
- ✅ `baseDirectory: .next` - Correct for Next.js

Last updated: 2025-11-09
