import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current user's access token for authenticated edge function calls
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make an authenticated fetch call to a Supabase edge function
 */
export async function authenticatedFetch(
  functionName: string,
  body: Record<string, unknown>,
  options?: { stream?: boolean }
): Promise<Response> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error('Authentication required');
  }
  
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}
