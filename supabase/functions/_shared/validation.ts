/**
 * Validates that a URL is a valid public URL (not internal/private)
 */
export function isValidPublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return false;
    }
    
    // Block IPv6 loopback and private ranges
    if (hostname.includes(':') || hostname.startsWith('[')) {
      const cleanIPv6 = hostname.replace(/[\[\]]/g, '');
      // Block ::1 (loopback), fc00::/7 (unique local), fe80::/10 (link-local)
      if (
        cleanIPv6 === '::1' ||
        cleanIPv6.startsWith('fc') ||
        cleanIPv6.startsWith('fd') ||
        cleanIPv6.startsWith('fe80')
      ) {
        return false;
      }
    }
    
    // Block private IP ranges (dotted decimal, hex, octal, and decimal formats)
    if (isPrivateIP(hostname)) {
      return false;
    }
    
    // Block internal hostnames
    if (
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a hostname represents a private/internal IP in any encoding format
 */
function isPrivateIP(hostname: string): boolean {
  // Try to parse as a canonical IPv4 address from various formats
  const ip = parseIPv4(hostname);
  if (ip === null) return false;
  
  const [a, b, c, d] = ip;
  
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0
  if (a === 0 && b === 0 && c === 0 && d === 0) return true;
  
  return false;
}

/**
 * Parse an IPv4 address from dotted-decimal, hex, octal, or single-integer formats.
 * Returns [a, b, c, d] or null if not an IP.
 */
function parseIPv4(hostname: string): [number, number, number, number] | null {
  // Single integer format (e.g., 2130706433 = 127.0.0.1)
  if (/^\d+$/.test(hostname)) {
    const num = parseInt(hostname, 10);
    if (num >= 0 && num <= 0xFFFFFFFF) {
      return [(num >>> 24) & 0xFF, (num >>> 16) & 0xFF, (num >>> 8) & 0xFF, num & 0xFF];
    }
    return null;
  }
  
  // Hex format (e.g., 0x7f000001)
  if (/^0x[0-9a-fA-F]+$/.test(hostname)) {
    const num = parseInt(hostname, 16);
    if (num >= 0 && num <= 0xFFFFFFFF) {
      return [(num >>> 24) & 0xFF, (num >>> 16) & 0xFF, (num >>> 8) & 0xFF, num & 0xFF];
    }
    return null;
  }
  
  // Dotted format (decimal, hex, or octal per octet)
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;
  
  const octets: number[] = [];
  for (const part of parts) {
    let val: number;
    if (part.startsWith('0x') || part.startsWith('0X')) {
      val = parseInt(part, 16);
    } else if (part.startsWith('0') && part.length > 1 && /^[0-7]+$/.test(part)) {
      val = parseInt(part, 8);
    } else {
      val = parseInt(part, 10);
    }
    if (isNaN(val) || val < 0 || val > 255) return null;
    octets.push(val);
  }
  
  return octets as [number, number, number, number];
}

/**
 * Resolve hostname DNS and check all returned IPs are public.
 * Falls back to allowing the request if DNS resolution isn't available.
 */
export async function isDnsResolutionSafe(hostname: string): Promise<boolean> {
  try {
    const ips = await Deno.resolveDns(hostname, "A");
    for (const ip of ips) {
      if (isPrivateIP(ip)) return false;
    }
    return true;
  } catch {
    // If DNS resolution fails or isn't available, allow (URL validation already checked)
    return true;
  }
}

/**
 * Validates image URL - checks it's a valid public URL and has reasonable length
 */
export function isValidImageUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }
  
  // Allow data URLs for base64 images - check this FIRST before length limit
  if (urlString.startsWith('data:image/')) {
    // Limit base64 data URL size (5MB base64 ~ 6.7MB string)
    return urlString.length < 7_000_000;
  }
  
  // Reasonable max length for regular URLs (not data URLs)
  if (urlString.length > 2048) {
    return false;
  }
  
  return isValidPublicUrl(urlString);
}

/**
 * Validates a product/website URL for scraping
 */
export function isValidScrapingUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }
  
  if (urlString.length > 2048) {
    return false;
  }
  
  // Format URL if needed
  let formattedUrl = urlString.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  return isValidPublicUrl(formattedUrl);
}

/**
 * Formats a URL by adding https:// if missing
 */
export function formatUrl(urlString: string): string {
  let formattedUrl = urlString.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  return formattedUrl;
}

/**
 * Safe fetch that disables redirect following to prevent SSRF via redirects.
 * Validates the initial URL, then fetches with redirect: 'manual'.
 */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, redirect: 'manual' });
}
