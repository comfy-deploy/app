# Clerk Redirect Fix - COM-1575

## Issue
Users were being redirected to `comfydeploy.com` instead of `app.comfydeploy.com` after signing up with Clerk. Additionally, the staging environment (`staging.app.comfydeploy.com`) needed proper redirect handling.

## Root Cause
The Clerk configuration in the frontend application was missing explicit redirect URLs for after sign-up and sign-in actions. Without these configured, Clerk was using default behavior which redirected to the base domain instead of the app subdomain.

## Solution Implemented

### 1. Dynamic Environment-Based Redirects
Modified `src/main.tsx` to dynamically determine redirect URLs based on the current hostname:

```typescript
// Dynamically determine the base URL for redirects based on current hostname
const getRedirectBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // For staging environment
    if (hostname === 'staging.app.comfydeploy.com') {
      return `${protocol}//staging.app.comfydeploy.com`;
    }
    
    // For production environment
    if (hostname === 'app.comfydeploy.com') {
      return `${protocol}//app.comfydeploy.com`;
    }
    
    // For local development, use relative paths
    return '';
  }
  return '';
};

const baseUrl = getRedirectBaseUrl();
const defaultRedirectPath = '/workflows';

// Build redirect URLs - use environment variables if provided, otherwise use dynamic URLs
const afterSignUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL || 
  (baseUrl ? `${baseUrl}${defaultRedirectPath}` : defaultRedirectPath);

const afterSignInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || 
  (baseUrl ? `${baseUrl}${defaultRedirectPath}` : defaultRedirectPath);
```

### 2. Updated ClerkProvider Configuration
The ClerkProvider now uses the dynamically determined URLs:

```typescript
<ClerkProvider
  // ... other props
  afterSignUpUrl={afterSignUpUrl}
  afterSignInUrl={afterSignInUrl}
  signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
  signInFallbackRedirectUrl={signInFallbackRedirectUrl}
>
```

### 3. Environment Variables (Optional Override)
The system still supports environment variable overrides for specific deployments:

```env
# Clerk redirect URLs - these will override the dynamic detection if set
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=https://app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=https://app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://app.comfydeploy.com/workflows
```

## Supported Environments

### Production (`app.comfydeploy.com`)
- Automatically redirects to: `https://app.comfydeploy.com/workflows`
- No additional configuration required

### Staging (`staging.app.comfydeploy.com`)
- Automatically redirects to: `https://staging.app.comfydeploy.com/workflows`
- No additional configuration required

### Local Development
- Uses relative paths: `/workflows`
- Works with any local development setup

### Custom Environments
- Can be overridden using environment variables
- Useful for custom deployments or testing environments

## Deployment Steps Required

### 1. Verify Clerk Dashboard Settings
In the Clerk dashboard (https://dashboard.clerk.com), ensure that **Allowed redirect URLs** include:

**For Production:**
- `https://app.comfydeploy.com/workflows`
- `https://app.comfydeploy.com/*` (if you want to allow any path)

**For Staging:**
- `https://staging.app.comfydeploy.com/workflows`
- `https://staging.app.comfydeploy.com/*` (if you want to allow any path)

### 2. Deploy and Test
1. Deploy the updated code
2. Test the sign-up flow on both staging and production to ensure users are redirected correctly
3. Test the sign-in flow to ensure the same behavior

### 3. Optional: Set Environment Variables (Override)
Only set these if you need to override the automatic detection:

```bash
# Production override (usually not needed)
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=https://app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=https://app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://app.comfydeploy.com/workflows

# Staging override (usually not needed)
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=https://staging.app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://staging.app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=https://staging.app.comfydeploy.com/workflows
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://staging.app.comfydeploy.com/workflows
```

## How It Works

1. **Dynamic Detection**: The system automatically detects the current hostname and builds appropriate redirect URLs
2. **Environment Variable Override**: If environment variables are set, they take precedence over dynamic detection
3. **Fallback Behavior**: For local development or unknown hostnames, relative paths are used
4. **Protocol Awareness**: The system preserves the current protocol (http/https)

## Testing

### Production Testing
1. Visit `https://app.comfydeploy.com`
2. Go through the sign-up flow
3. Verify you're redirected to `https://app.comfydeploy.com/workflows`

### Staging Testing
1. Visit `https://staging.app.comfydeploy.com`
2. Go through the sign-up flow
3. Verify you're redirected to `https://staging.app.comfydeploy.com/workflows`

### Local Testing
1. Start the development server
2. Go through the sign-up flow
3. Verify you're redirected to `/workflows` (relative path)

## Notes

- **No Configuration Required**: The system automatically handles production and staging environments
- **Backward Compatible**: Existing environment variable configurations continue to work
- **Flexible**: Can be extended to support additional environments by modifying the `getRedirectBaseUrl` function
- **Protocol Agnostic**: Works with both HTTP and HTTPS