import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? 'sinhalanews';

if (!uri) {
  throw new Error('Missing MONGODB_URI. Add it to your environment variables.');
}

let dbPromise: Promise<Db>;
let client: MongoClient | null = null;

export const getDb = (): Promise<Db> => {
  if (!dbPromise) {
    // Add SSL/TLS options to handle connection issues
    const clientOptions = {
      // Ensure SSL is enabled for mongodb+srv connections
      tls: true,
      tlsAllowInvalidCertificates: false,
      // Connection timeout
      serverSelectionTimeoutMS: 10000,
      // Retry options
      retryWrites: true,
    };
    
    client = new MongoClient(uri, clientOptions);
    dbPromise = client.connect()
      .then((connectedClient) => {
        console.log('[db] Successfully connected to MongoDB');
        return connectedClient.db(dbName);
      })
      .catch((error) => {
        console.error('[db] MongoDB connection error:', error);
        // Reset promise on error so it can retry
        dbPromise = undefined as any;
        client = null;
        throw error;
      });
  }
  return dbPromise;
};

