declare module 'jwks-client' {
  export interface JwksClient {
    getSigningKey(kid: string, callback: (err: any, key: any) => void): void;
  }
  
  export interface ClientOptions {
    jwksUri: string;
    cache?: boolean;
    cacheMaxEntries?: number;
    cacheMaxAge?: number;
  }
  
  export default function jwksClient(options: ClientOptions): JwksClient;
}