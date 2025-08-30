# NestFest Authentication System

A comprehensive, production-ready authentication system built for the NestFest competition platform. This system provides secure user authentication, role-based access control (RBAC), multi-factor authentication (MFA), and extensive security features.

## Features

### Core Authentication
- ✅ **JWT-based Authentication** with access and refresh tokens
- ✅ **Email/Password Authentication** with secure password hashing (bcrypt)
- ✅ **Social Login** (Google, GitHub, Microsoft OAuth2)
- ✅ **Multi-Factor Authentication** (TOTP with backup codes)
- ✅ **Email Verification** and password reset functionality
- ✅ **Session Management** with device tracking and concurrent session limits

### Security Features
- ✅ **Rate Limiting** with configurable rules per endpoint
- ✅ **Brute Force Protection** with progressive lockouts
- ✅ **Comprehensive Audit Logging** for compliance and security monitoring
- ✅ **Token Blacklisting** for secure logout and token revocation
- ✅ **Device Fingerprinting** for suspicious activity detection
- ✅ **Password Strength Validation** with entropy analysis
- ✅ **Input Validation** and sanitization
- ✅ **CSRF and XSS Protection**

### Role-Based Access Control
- ✅ **Five User Roles**: Student, Reviewer, Judge, Admin, Super Admin
- ✅ **Granular Permissions** system with resource-based access control
- ✅ **Competition-Scoped Access** for judges and reviewers
- ✅ **Team Management** with captain and member roles
- ✅ **Permission Middleware** for API route protection

### User Experience
- ✅ **React Context and Hooks** for easy state management
- ✅ **Protected Route Components** with role-based rendering
- ✅ **Responsive Login/Registration Forms** with validation
- ✅ **Loading States and Error Handling** throughout the UI
- ✅ **Toast Notifications** for user feedback

## Architecture

### Backend Components

```
src/lib/auth/
├── jwt-manager.ts          # JWT token generation and validation
├── password-manager.ts     # Password hashing, validation, and strength checking
├── mfa-manager.ts          # Multi-factor authentication with TOTP
├── oauth-manager.ts        # Social login integration
├── session-manager.ts      # Session tracking and device management
├── middleware.ts           # API route protection middleware
├── rate-limiter.ts         # Rate limiting and brute force protection
├── audit-logger.ts         # Comprehensive audit trail logging
├── permissions.ts          # Role-based access control system
└── auth-context.tsx        # React context for authentication state
```

### Frontend Components

```
src/components/auth/
├── LoginForm.tsx          # Comprehensive login form with OAuth
├── ProtectedRoute.tsx     # Route protection with role-based access
└── hooks.ts              # Authentication hooks for React components
```

### API Routes

```
src/app/api/auth/
├── login/route.ts         # User login with security features
├── register/route.ts      # User registration with validation
├── logout/route.ts        # Secure logout with session cleanup
├── refresh/route.ts       # Token refresh with rotation
├── oauth/              # OAuth provider integrations
└── mfa/               # Multi-factor authentication endpoints
```

## Setup and Installation

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

```env
# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET="your-256-bit-secret-here"
JWT_REFRESH_SECRET="your-256-bit-secret-here"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_KEY="your-service-key"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
```

### 2. Database Setup

Run the authentication schema migration:

```bash
# Execute the SQL file in your Supabase dashboard or via psql
psql -h your-db-host -U your-user -d your-db -f src/lib/database/auth-schema.sql
```

### 3. Install Dependencies

```bash
npm install
# Dependencies are already added to package.json
```

### 4. Configure OAuth Providers

#### Google OAuth2
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth2 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/oauth/google/callback`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/oauth/github/callback`

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com)
2. Register new application in Azure AD
3. Add redirect URI: `http://localhost:3000/api/auth/oauth/microsoft/callback`

## Usage

### Frontend Authentication

```tsx
import { AuthProvider } from '@/lib/auth/auth-context';
import { useAuth } from '@/lib/auth/hooks';

// Wrap your app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}

// Use authentication in components
function MyComponent() {
  const { state, login, logout, hasPermission } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {state.isAuthenticated ? (
        <div>
          <p>Welcome, {state.user?.name}!</p>
          <button onClick={() => logout()}>Logout</button>
          
          {hasPermission('competitions', 'write') && (
            <button>Create Competition</button>
          )}
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Protected Routes

```tsx
import ProtectedRoute, { AdminRoute, JudgeRoute } from '@/components/auth/ProtectedRoute';

// Basic authentication required
<ProtectedRoute>
  <DashboardComponent />
</ProtectedRoute>

// Admin-only access
<AdminRoute>
  <AdminPanelComponent />
</AdminRoute>

// Judge-only access
<JudgeRoute>
  <JudgingComponent />
</JudgeRoute>

// Custom permissions
<ProtectedRoute
  requiredRoles={['judge', 'reviewer']}
  requiredPermissions={[
    { resource: 'submissions', action: 'read' }
  ]}
>
  <ReviewSubmissionsComponent />
</ProtectedRoute>
```

### API Route Protection

```tsx
// pages/api/admin/users.ts
import { requireRole } from '@/lib/auth/middleware';

export default requireRole('admin')(async (req, res) => {
  // Admin-only API logic here
  const users = await getUsers();
  res.json(users);
});

// Custom middleware usage
import { validateAPIRequest } from '@/lib/auth/middleware';

export default async function handler(req, res) {
  const authResult = await validateAPIRequest(req, {
    requireAuth: true,
    roles: ['judge'],
    resource: 'submissions',
    action: 'read'
  });

  if ('error' in authResult) {
    return res.status(authResult.code).json({ error: authResult.error });
  }

  // Authenticated and authorized logic here
}
```

## Security Considerations

### Password Security
- Minimum 8 characters with strength validation using zxcvbn
- bcrypt hashing with salt rounds of 12
- Password history to prevent reuse
- Secure password reset with time-limited tokens

### Session Security
- JWT tokens with short expiration (15 minutes)
- Refresh token rotation for enhanced security
- Device fingerprinting and suspicious activity detection
- Maximum 5 concurrent sessions per user

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP  
- Password reset: 3 per hour per IP
- API requests: 100 per 15 minutes per user

### Audit Logging
- All authentication events logged
- Security events with risk assessment
- Compliance logging for GDPR requirements
- Comprehensive audit trails for investigations

## Role Permissions

### Student
- Read competitions and public information
- Create and manage own submissions
- Join teams and collaborate
- Participate in public voting

### Reviewer  
- Read all submissions for assigned competitions
- Create and manage reviews
- Access internal scoring rubrics
- Advance submissions to next rounds

### Judge
- Access assigned submissions for judging
- Submit votes and scores
- Declare conflicts of interest
- Access live event features

### Admin
- Full system access and user management
- Competition creation and management
- Judge and reviewer assignments
- System configuration and monitoring

### Super Admin
- Database-level access and emergency procedures
- Admin user management
- System configuration
- Audit log access

## Database Schema

The authentication system includes the following tables:

- `users` - User accounts with authentication data
- `user_sessions` - Active user sessions and device tracking  
- `login_attempts` - Login attempt logging for security
- `rate_limit_attempts` - Rate limiting tracking
- `brute_force_protection` - Brute force protection state
- `blacklisted_tokens` - Revoked JWT tokens
- `audit_log` - Comprehensive audit trail
- `security_events` - Security-specific event logging
- `oauth_providers` - Social login connections
- `user_competition_assignments` - Competition access control

## Monitoring and Maintenance

### Regular Tasks
1. **Token Cleanup**: Run `cleanup_expired_records()` function daily
2. **Security Review**: Monitor `security_events` table for suspicious activity
3. **Audit Compliance**: Generate audit reports for compliance requirements
4. **Session Monitoring**: Review concurrent session limits and unusual patterns

### Health Checks
- Monitor authentication success rates
- Track unusual login patterns or geographic distributions  
- Review rate limiting effectiveness
- Audit permission escalation attempts

## Testing

### Unit Tests
```bash
npm run test:auth
```

### Integration Tests  
```bash
npm run test:integration:auth
```

### Security Tests
```bash
npm run test:security
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "rememberMe": true,
  "deviceInfo": {
    "fingerprint": "device-hash",
    "platform": "Web",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "...", "role": "student" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "sessionId": "uuid",
  "expiresIn": 900000
}
```

#### POST /api/auth/register
Register new user account.

#### POST /api/auth/logout  
Logout and invalidate session.

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### GET /api/auth/oauth/{provider}
Initiate OAuth flow with provider.

### Protected Endpoints
All API routes under `/api/protected/` require valid JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

## Troubleshooting

### Common Issues

1. **JWT Verification Failed**
   - Check JWT secrets are properly set
   - Verify token hasn't expired
   - Ensure token format is correct

2. **OAuth Login Failed**
   - Verify OAuth client credentials
   - Check redirect URIs match exactly
   - Ensure OAuth apps are properly configured

3. **Rate Limiting Triggered**
   - Check rate limit rules in database
   - Clear rate limit attempts if needed
   - Verify IP address extraction is working

4. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database schema is up to date
   - Ensure RLS policies allow access

### Debug Mode
Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG_MODE="true"
LOG_LEVEL="debug"
```

## Contributing

When contributing to the authentication system:

1. **Security First**: All changes must maintain or improve security
2. **Test Coverage**: Add tests for new functionality  
3. **Documentation**: Update this README for any new features
4. **Audit Trail**: Ensure all user actions are properly logged
5. **Performance**: Consider impact on authentication performance

## Support

For issues related to the authentication system:

1. Check this documentation first
2. Review audit logs for error details
3. Check security events for suspicious activity
4. Contact the development team with specific error messages

## License

This authentication system is part of the NestFest platform and follows the same licensing terms.