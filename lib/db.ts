import { Pool, QueryResult } from 'pg';

// Configure connection pooling for production
const pool = new Pool({
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'zentral_hack',
  // Connection pool configuration
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '2'), // Minimum connections  
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Wait max 2 seconds for a connection
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  // Optional: Log connection events in development
  if (process.env.NODE_ENV === 'development') {
    console.debug('Database connection established');
  }
});

export async function query(text: string, params?: (string | number | boolean | null)[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log slow queries (> 200ms in production, > 500ms in development)
    const slowThreshold = process.env.NODE_ENV === 'production' ? 200 : 500;
    if (duration > slowThreshold) {
      console.warn(`[SLOW QUERY] ${duration}ms:`, text.substring(0, 100));
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function endPool() {
  return pool.end();
}

export default pool;
