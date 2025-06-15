import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "684b7d39efd6147ccbbb7c53", 
  requiresAuth: true // Ensure authentication is required for all operations
});