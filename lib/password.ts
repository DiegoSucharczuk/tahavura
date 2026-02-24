// Simple password hashing using SubtleCrypto (browser API)
// Sufficient for local garage management

/**
 * Simple hash function for passwords
 * Uses SHA-256 + random salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Encode password
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}$${hashHex}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, originalHash] = hash.split('$');
    
    // Hash the provided password with the stored salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === originalHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
