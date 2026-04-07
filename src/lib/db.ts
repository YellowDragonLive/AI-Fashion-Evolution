import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FashionDB extends DBSchema {
  images: {
    key: string;
    value: {
      id: string;
      data: Blob;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<FashionDB>> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FashionDB>('fashion-tryon-db', 1, {
      upgrade(db) {
        db.createObjectStore('images', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export const ImageStorage = {
  async save(id: string, blob: Blob): Promise<string> {
    const db = await getDB();
    await db.put('images', { id, data: blob, timestamp: Date.now() });
    return id;
  },
  async getUrl(id: string): Promise<string | null> {
    const db = await getDB();
    const record = await db.get('images', id);
    if (!record) return null;
    return URL.createObjectURL(record.data);
  },
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('images', id);
  }
};

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}
