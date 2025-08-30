/**
 * OAuth Manager for NestFest Social Authentication
 * 
 * Handles Google, GitHub, and Microsoft OAuth integrations
 * with secure token validation and user profile extraction.
 */

import crypto from 'crypto';

export interface OAuthProvider {
  id: 'google' | 'github' | 'microsoft';
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string[];
  clientId: string;
  clientSecret: string;
}

export interface OAuthUserInfo {
  providerId: string;
  providerUserId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  locale?: string;
}

export interface OAuthState {
  state: string;
  redirectUrl: string;
  provider: string;
  expiresAt: Date;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export class OAuthManager {
  private readonly providers: Record<string, OAuthProvider>;
  private readonly stateExpiry = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.providers = {
      google: {
        id: 'google',
        name: 'Google',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: ['openid', 'email', 'profile'],
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!
      },
      github: {
        id: 'github',
        name: 'GitHub',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scope: ['user:email'],
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!
      },
      microsoft: {
        id: 'microsoft',
        name: 'Microsoft',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: ['openid', 'email', 'profile'],
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!
      }
    };

    // Validate required environment variables
    this.validateConfiguration();
  }

  /**
   * Validate OAuth configuration
   */
  private validateConfiguration(): void {
    const requiredVars = [
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
      'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
      'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      console.warn(`OAuth configuration incomplete. Missing: ${missing.join(', ')}`);
    }
  }

  /**
   * Generate secure OAuth state parameter
   */
  generateOAuthState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Build OAuth authorization URL
   */
  buildAuthUrl(
    providerId: string,
    redirectUri: string,
    state: string,
    additionalParams: Record<string, string> = {}
  ): string {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scope.join(' '),
      state,
      access_type: 'offline', // Request refresh token
      prompt: 'consent',
      ...additionalParams
    });

    // Add provider-specific parameters
    if (providerId === 'microsoft') {
      params.set('response_mode', 'query');
    }

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    providerId: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    // Add PKCE code verifier if provided
    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'NestFest-Platform/1.0'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || provider.scope.join(' ')
    };
  }

  /**
   * Fetch user information from OAuth provider
   */
  async fetchUserInfo(providerId: string, accessToken: string): Promise<OAuthUserInfo> {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }

    const response = await fetch(provider.userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'NestFest-Platform/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user info: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return this.normalizeUserInfo(providerId, data);
  }

  /**
   * Normalize user information across different providers
   */
  private normalizeUserInfo(providerId: string, data: any): OAuthUserInfo {
    switch (providerId) {
      case 'google':
        return {
          providerId: 'google',
          providerUserId: data.id,
          email: data.email,
          name: data.name,
          firstName: data.given_name,
          lastName: data.family_name,
          avatarUrl: data.picture,
          emailVerified: data.verified_email || false,
          locale: data.locale
        };

      case 'github':
        return {
          providerId: 'github',
          providerUserId: data.id.toString(),
          email: data.email,
          name: data.name || data.login,
          firstName: data.name?.split(' ')[0],
          lastName: data.name?.split(' ').slice(1).join(' '),
          avatarUrl: data.avatar_url,
          emailVerified: true, // GitHub emails are considered verified
          locale: data.location
        };

      case 'microsoft':
        return {
          providerId: 'microsoft',
          providerUserId: data.id,
          email: data.mail || data.userPrincipalName,
          name: data.displayName,
          firstName: data.givenName,
          lastName: data.surname,
          avatarUrl: undefined, // Would need separate Graph API call
          emailVerified: true, // Microsoft accounts are considered verified
          locale: data.preferredLanguage
        };

      default:
        throw new Error(`Unknown provider for normalization: ${providerId}`);
    }
  }

  /**
   * Verify OAuth state parameter
   */
  verifyState(receivedState: string, expectedState: string): boolean {
    if (!receivedState || !expectedState) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(receivedState, 'utf8'),
        Buffer.from(expectedState, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Refresh OAuth access token
   */
  async refreshAccessToken(
    providerId: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'NestFest-Platform/1.0'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
      expiresIn: data.expires_in || 3600,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || provider.scope.join(' ')
    };
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(providerId: string, token: string): Promise<void> {
    const revokeUrls: Record<string, string> = {
      google: 'https://oauth2.googleapis.com/revoke',
      github: 'https://api.github.com/applications/{client_id}/token',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout'
    };

    const revokeUrl = revokeUrls[providerId];
    if (!revokeUrl) {
      throw new Error(`Token revocation not supported for provider: ${providerId}`);
    }

    const provider = this.providers[providerId];
    
    if (providerId === 'github') {
      // GitHub requires different approach
      const response = await fetch(revokeUrl.replace('{client_id}', provider.clientId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64')}`,
          'Accept': 'application/json',
          'User-Agent': 'NestFest-Platform/1.0'
        },
        body: JSON.stringify({ access_token: token })
      });

      if (!response.ok) {
        throw new Error(`Token revocation failed: ${response.status}`);
      }
    } else {
      // Google and Microsoft
      const params = new URLSearchParams({ token });
      
      const response = await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NestFest-Platform/1.0'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token revocation failed: ${response.status}`);
      }
    }
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): Array<{ id: string; name: string }> {
    return Object.values(this.providers).map(provider => ({
      id: provider.id,
      name: provider.name
    }));
  }

  /**
   * Validate OAuth configuration for a provider
   */
  isProviderConfigured(providerId: string): boolean {
    const provider = this.providers[providerId];
    return !!(provider && provider.clientId && provider.clientSecret);
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager();