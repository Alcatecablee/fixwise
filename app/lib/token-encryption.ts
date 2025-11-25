import crypto from 'crypto';

interface EncryptedToken {
  encrypted: string;
  iv: string;
  algorithm: string;
}

class TokenEncryption {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits

  /**
   * Encrypt a GitHub access token
   */
  encryptToken(token: string): EncryptedToken {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      algorithm: this.algorithm,
    };
  }

  /**
   * Decrypt a GitHub access token
   */
  decryptToken(encryptedToken: EncryptedToken): string {
    const key = this.getEncryptionKey();
    const iv = Buffer.from(encryptedToken.iv, 'hex');
    const encrypted = Buffer.from(encryptedToken.encrypted, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get encryption key from environment
   */
  private getEncryptionKey(): string {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
    }
    
    // Ensure key is the correct length
    if (key.length < this.keyLength) {
      throw new Error(`TOKEN_ENCRYPTION_KEY must be at least ${this.keyLength} characters`);
    }
    
    return key.substring(0, this.keyLength);
  }

  /**
   * Validate token format (basic GitHub token validation)
   */
  validateTokenFormat(token: string): boolean {
    // GitHub personal access tokens are typically 40 characters
    // GitHub OAuth tokens can vary in length
    return token.length >= 20 && token.length <= 100;
  }

  /**
   * Generate a secure encryption key
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const tokenEncryption = new TokenEncryption();
export default tokenEncryption; 