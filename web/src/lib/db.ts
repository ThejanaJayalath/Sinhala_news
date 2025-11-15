import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? 'sinhalanews';

if (!uri) {
  throw new Error('Missing MONGODB_URI. Add it to your environment variables.');
}

let dbPromise: Promise<Db>;

export const getDb = (): Promise<Db> => {
  if (!dbPromise) {
    const client = new MongoClient(uri);
    dbPromise = client.connect().then((connectedClient) => connectedClient.db(dbName));
  }
  return dbPromise;
};

