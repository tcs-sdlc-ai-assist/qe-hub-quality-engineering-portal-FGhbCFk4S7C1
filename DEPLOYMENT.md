# Deployment Guide

This document covers deploying the QE Hub Portal to Vercel, configuring environment variables, setting up CI/CD with GitHub Actions, and integrating production SSO authentication.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Configuration](#build-configuration)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
  - [Initial Setup](#initial-setup)
  - [SPA Routing](#spa-routing)
  - [Build Settings](#build-settings)
  - [Environment Variable Configuration](#environment-variable-configuration)
  - [Custom Domain](#custom-domain)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
  - [Automated Deployment Workflow](#automated-deployment-workflow)
  - [Pull Request Preview Deployments](#pull-request-preview-deployments)
  - [Lint and Build Checks](#lint-and-build-checks)
- [Alternative Hosting Providers](#alternative-hosting-providers)
  - [Netlify](#netlify)
  - [AWS S3 + CloudFront](#aws-s3--cloudfront)
- [Production SSO Integration](#production-sso-integration)
  - [OIDC Provider Configuration](#oidc-provider-configuration)
  - [Auth Context Migration](#auth-context-migration)
  - [Token Management](#token-management)
  - [Protected API Calls](#protected-api-calls)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- A [Vercel](https://vercel.com) account (free tier is sufficient for most use cases)
- A GitHub, GitLab, or Bitbucket repository containing the project source code
- (Optional) A custom domain with DNS access for production deployments
- (Optional) An SSO/OIDC identity provider for production authentication

---

## Build Configuration

The project uses **Vite 5** as the build tool. The build configuration is defined in `vite.config.js`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### Build Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks across all `.js` and `.jsx` files |

### Build Output

Running `npm run build` produces a static site in the `dist/` directory:

```
dist/
├── assets/
│   ├── index-[hash].js       # Application JavaScript bundle
│   ├── index-[hash].css      # Compiled Tailwind CSS
│   └── vendor-[hash].js      # Third-party library chunk (Recharts, PapaParse, xlsx)
├── vite.svg                   # Favicon
└── index.html                 # Entry HTML with script/style references
```

The `dist/` directory is the deployment artifact. Upload this directory to any static hosting provider.

---

## Environment Variables

All environment variables are prefixed with `VITE_` to be exposed to the client-side bundle by Vite. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_APP_TITLE` | No | Application title displayed in the browser tab | `QE Hub Portal` |
| `VITE_JIRA_BASE_URL` | No | Jira instance base URL for embedded dashboards and roadmap | `https://your-org.atlassian.net` |
| `VITE_QTEST_BASE_URL` | No | qTest instance base URL | `https://your-org.qtestnet.com` |
| `VITE_ELASTIC_DASHBOARD_URL` | No | Elastic observability dashboard URL for the embedded iframe | `https://your-org.elastic.co` |
| `VITE_CONFLUENCE_BASE_URL` | No | Confluence wiki base URL for resource page links | `https://your-org.atlassian.net/wiki` |
| `VITE_SSO_CLIENT_ID` | No | SSO/OIDC client ID for production authentication | `your-sso-client-id` |
| `VITE_SSO_AUTHORITY` | No | SSO/OIDC authority URL (issuer) for production authentication | `https://your-org.auth-provider.com` |

> **Important:** All environment variables are optional. The portal runs fully with mock data and mock authentication when no external URLs are configured. Embedded dashboard pages (Roadmap, Elastic, Jira) display a fallback message when their respective URLs are not set. Confluence resource links are rendered without clickable URLs when `VITE_CONFLUENCE_BASE_URL` is not configured.

> **Security Note:** Since all `VITE_` prefixed variables are embedded into the client-side JavaScript bundle at build time, do **not** store secrets (API keys, tokens, passwords) in these variables. They are visible to anyone inspecting the built JavaScript.

---

## Vercel Deployment

### Initial Setup

1. **Import your repository** into Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Choose the `qe-hub-portal` repository
   - Vercel auto-detects the Vite framework

2. **Confirm the detected settings** (Vercel should auto-detect these):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

3. **Click Deploy** — Vercel builds and deploys the application

### SPA Routing

The QE Hub Portal uses React Router v6 with client-side routing. All routes (e.g., `/execution/release-readiness`, `/trends/defect-trends`) must resolve to `index.html` so React Router can handle them.

The project includes a `vercel.json` configuration file that handles this automatically:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrite rule ensures that:
- Direct URL access to any route (e.g., `https://your-app.vercel.app/execution/domain-dsr`) serves `index.html`
- Page refreshes on any route work correctly
- The 404 page is handled by React Router's catch-all route (`*` → `/404`)

> **Note:** The `vercel.json` file is already included in the repository root. No additional configuration is needed for SPA routing on Vercel.

### Build Settings

If you need to override the auto-detected settings in the Vercel dashboard:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `./` (repository root) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or 20.x |

### Environment Variable Configuration

Configure environment variables in the Vercel dashboard:

1. Navigate to your project in the Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add each variable with the appropriate scope:

| Variable | Production | Preview | Development |
|---|---|---|---|
| `VITE_APP_TITLE` | ✅ | ✅ | ✅ |
| `VITE_JIRA_BASE_URL` | ✅ | ✅ | ✅ |
| `VITE_QTEST_BASE_URL` | ✅ | ✅ | ✅ |
| `VITE_ELASTIC_DASHBOARD_URL` | ✅ | ✅ | ✅ |
| `VITE_CONFLUENCE_BASE_URL` | ✅ | ✅ | ✅ |
| `VITE_SSO_CLIENT_ID` | ✅ | ✅ | ❌ |
| `VITE_SSO_AUTHORITY` | ✅ | ✅ | ❌ |

> **Tip:** Use different values for Production and Preview environments. For example, point Preview deployments to a staging Jira instance and Production deployments to the live Jira instance.

After adding or updating environment variables, trigger a redeployment for the changes to take effect:

```bash
# Via Vercel CLI
vercel --prod

# Or redeploy from the Vercel dashboard
```

### Custom Domain

1. Navigate to your project in the Vercel dashboard
2. Go to **Settings** → **Domains**
3. Add your custom domain (e.g., `qe-hub.your-org.com`)
4. Configure DNS records as instructed by Vercel:
   - **CNAME** record pointing to `cname.vercel-dns.com` for subdomains
   - **A** record pointing to `76.76.21.21` for apex domains
5. Vercel automatically provisions and renews SSL/TLS certificates via Let's Encrypt

---

## CI/CD with GitHub Actions

### Automated Deployment Workflow

Create `.github/workflows/deploy.yml` for automated deployments on push to `main`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build with Vercel
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Required GitHub Secrets:**

| Secret | Description | How to Obtain |
|---|---|---|
| `VERCEL_TOKEN` | Vercel personal access token | [Vercel Tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Vercel organization/team ID | Run `vercel link` locally → check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Run `vercel link` locally → check `.vercel/project.json` |

### Pull Request Preview Deployments

Vercel automatically creates preview deployments for every pull request when the repository is connected via the Vercel GitHub integration. No additional workflow is needed.

If you prefer GitHub Actions for preview deployments, create `.github/workflows/preview.yml`:

```yaml
name: Preview Deployment

on:
  pull_request:
    branches:
      - main

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build with Vercel
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy preview
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "preview_url=$url" >> $GITHUB_OUTPUT

      - name: Comment preview URL on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment ready: ${{ steps.deploy.outputs.preview_url }}`
            })
```

### Lint and Build Checks

Create `.github/workflows/ci.yml` for pull request validation without deployment:

```yaml
name: CI

on:
  pull_request:
    branches:
      - main
      - develop

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Build
        run: npm run build
```

---

## Alternative Hosting Providers

### Netlify

1. Create a `netlify.toml` in the repository root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Connect your repository to Netlify and configure environment variables in the Netlify dashboard under **Site settings** → **Environment variables**.

### AWS S3 + CloudFront

1. Build the project:

```bash
npm run build
```

2. Upload the `dist/` directory to an S3 bucket configured for static website hosting.

3. Create a CloudFront distribution pointing to the S3 bucket.

4. Configure a custom error response in CloudFront to handle SPA routing:
   - **HTTP Error Code:** 403 and 404
   - **Response Page Path:** `/index.html`
   - **HTTP Response Code:** 200

5. Set environment variables at build time in your CI/CD pipeline:

```bash
VITE_JIRA_BASE_URL=https://your-org.atlassian.net \
VITE_ELASTIC_DASHBOARD_URL=https://your-org.elastic.co \
VITE_CONFLUENCE_BASE_URL=https://your-org.atlassian.net/wiki \
npm run build
```

---

## Production SSO Integration

The QE Hub Portal ships with a mock authentication system (`src/contexts/AuthContext.jsx`) that uses email-based user selection for demonstration purposes. For production deployments, replace the mock authentication with your organization's SSO/OIDC provider.

### OIDC Provider Configuration

1. Register the QE Hub Portal as a client application with your identity provider (e.g., Okta, Azure AD, Auth0, Ping Identity).

2. Configure the following settings in your identity provider:

| Setting | Value |
|---|---|
| **Application Type** | Single Page Application (SPA) |
| **Grant Type** | Authorization Code with PKCE |
| **Redirect URI** | `https://your-domain.com/callback` |
| **Post-Logout Redirect URI** | `https://your-domain.com/login` |
| **Allowed Origins** | `https://your-domain.com` |
| **Scopes** | `openid`, `profile`, `email` |

3. Set the environment variables:

```bash
VITE_SSO_CLIENT_ID=your-registered-client-id
VITE_SSO_AUTHORITY=https://your-org.auth-provider.com
```

### Auth Context Migration

Replace the mock `AuthContext` with an OIDC-based implementation. Install an OIDC client library:

```bash
npm install oidc-client-ts react-oidc-context
```

Update `src/contexts/AuthContext.jsx` to use the OIDC provider:

```jsx
// Example production AuthContext structure (replace mock implementation)
import { createContext, useContext, useCallback, useMemo } from 'react'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import { PERMISSIONS } from '../constants/roles.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const oidc = useOidcAuth()

  const currentUser = useMemo(() => {
    if (!oidc.user) return null
    return {
      id: oidc.user.profile.sub,
      name: oidc.user.profile.name,
      email: oidc.user.profile.email,
      role: oidc.user.profile['custom:role'] || 'VIEW_ONLY',
      avatar: oidc.user.profile.name?.charAt(0) || '?',
    }
  }, [oidc.user])

  const role = currentUser ? currentUser.role : null

  const hasPermission = useCallback(
    (action) => {
      if (!role) return false
      const rolePermissions = PERMISSIONS[role]
      if (!rolePermissions) return false
      return rolePermissions[action] === true
    },
    [role]
  )

  const login = useCallback(() => {
    oidc.signinRedirect()
  }, [oidc])

  const logout = useCallback(() => {
    oidc.signoutRedirect()
  }, [oidc])

  const value = {
    currentUser,
    role,
    isAuthenticated: oidc.isAuthenticated,
    isLoading: oidc.isLoading,
    login,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
```

Wrap the application with the OIDC provider in `src/App.jsx`:

```jsx
import { AuthProvider as OidcProvider } from 'react-oidc-context'

const oidcConfig = {
  authority: import.meta.env.VITE_SSO_AUTHORITY,
  client_id: import.meta.env.VITE_SSO_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  scope: 'openid profile email',
  response_type: 'code',
}

export default function App() {
  // ...existing initialization logic

  return (
    <OidcProvider {...oidcConfig}>
      <AuthProvider>
        <FilterProvider>
          <RouterProvider router={router} />
        </FilterProvider>
      </AuthProvider>
    </OidcProvider>
  )
}
```

### Token Management

When using OIDC authentication:

- **Access tokens** are managed automatically by `oidc-client-ts` and stored in session storage by default.
- **Token refresh** is handled automatically via silent renew when the access token approaches expiration.
- **Session persistence** across page refreshes is handled by the OIDC library's `automaticSilentRenew` feature.

Configure token settings in the OIDC config:

```js
const oidcConfig = {
  // ...base config
  automaticSilentRenew: true,
  silentRequestTimeoutInSeconds: 30,
  accessTokenExpiringNotificationTimeInSeconds: 60,
  monitorSession: true,
}
```

### Protected API Calls

If the portal is extended to call backend APIs (replacing localStorage with real API endpoints), attach the access token to outgoing requests:

```js
async function fetchWithAuth(url, options = {}) {
  const user = oidcUserManager.getUser()
  if (!user || !user.access_token) {
    throw new Error('User is not authenticated')
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${user.access_token}`,
    'Content-Type': 'application/json',
  }

  return fetch(url, { ...options, headers })
}
```

### Role Mapping

Map your identity provider's role claims to the portal's role constants defined in `src/constants/roles.js`:

| IdP Claim Value | Portal Role | Permissions |
|---|---|---|
| `qe-admin` | `ADMIN` | Full access including admin settings, uploads, and dashboard management |
| `qe-test-lead` | `TEST_LEAD` | Edit RAG status, confidence index, comments, DSR fields, and upload data |
| `qe-viewer` | `VIEW_ONLY` | View-only access to all dashboards and reports |

Configure the claim mapping in your `AuthContext`:

```js
function mapIdpRoleToPortalRole(idpRole) {
  const roleMap = {
    'qe-admin': 'ADMIN',
    'qe-test-lead': 'TEST_LEAD',
    'qe-viewer': 'VIEW_ONLY',
  }
  return roleMap[idpRole] || 'VIEW_ONLY'
}
```

---

## Troubleshooting

### Common Issues

**Build fails with "process is not defined"**

Vite does not inject `process.env` like webpack. All environment variables must use `import.meta.env.VITE_*` syntax. Check that no code references `process.env`.

**Routes return 404 on page refresh**

Ensure the `vercel.json` rewrite rule is present in the repository root. For other hosting providers, configure equivalent SPA fallback routing (see [Alternative Hosting Providers](#alternative-hosting-providers)).

**Environment variables are undefined in the build**

- Verify variables are prefixed with `VITE_`
- Verify variables are set in the Vercel dashboard for the correct environment scope (Production, Preview, Development)
- Redeploy after adding or changing environment variables — Vite embeds them at build time

**Embedded iframes show "Refused to display" errors**

The target application (Jira, Elastic, Confluence) must allow iframe embedding from your domain. Configure the `X-Frame-Options` or `Content-Security-Policy` headers on the target application to permit your deployment domain.

**Large bundle size warnings**

The Recharts and xlsx libraries contribute to bundle size. Vite automatically code-splits vendor chunks. If bundle size is a concern:

- Verify that tree-shaking is working (Vite handles this by default in production builds)
- Consider lazy-loading trend analytics pages using `React.lazy()` and `Suspense`

**localStorage quota exceeded**

The portal stores all data in localStorage which has a ~5MB limit in most browsers. If users upload large datasets, they may hit this limit. Monitor storage usage and consider implementing data pagination or compression for large datasets.

### Vercel CLI Commands

```bash
# Install Vercel CLI globally
npm install -g vercel

# Link local project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables locally
vercel env pull .env.local

# View deployment logs
vercel logs <deployment-url>

# List all deployments
vercel ls
```

### Useful Links

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [React Router v6 Deployment](https://reactrouter.com/en/main/guides/deploying)
- [oidc-client-ts Documentation](https://github.com/authts/oidc-client-ts)
- [react-oidc-context Documentation](https://github.com/authts/react-oidc-context)