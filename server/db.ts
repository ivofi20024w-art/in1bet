import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with retry-friendly settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Retry on connection errors
  allowExitOnIdle: false,
});

// Add error handler to prevent crashes on connection errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

// Helper function to execute queries with retry
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Only retry on connection/DNS errors
      if (
        error.code === 'EAI_AGAIN' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('connect') ||
        error.message?.includes('getaddrinfo')
      ) {
        if (attempt < maxRetries) {
          console.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

export const db = drizzle(pool, { schema });
