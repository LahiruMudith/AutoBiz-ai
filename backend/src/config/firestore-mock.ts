import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(__dirname, '../../mock-db.json');

interface MockDoc {
  id: string;
  [key: string]: any;
}

class MockDocumentReference {
  constructor(private pathStr: string) {}

  get id() {
    const parts = this.pathStr.split('/');
    return parts[parts.length - 1];
  }

  get path() {
    return this.pathStr;
  }

  private loadData(): Record<string, MockDoc> {
    if (!fs.existsSync(DB_FILE)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }

  private saveData(data: Record<string, MockDoc>) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  async get() {
    const data = this.loadData();
    const docData = data[this.pathStr];
    return {
      exists: !!docData,
      id: this.id,
      data: () => docData ? { ...docData } : undefined
    };
  }

  async set(value: any, options?: { merge?: boolean }) {
    const data = this.loadData();
    const existing = data[this.pathStr] || {};
    data[this.pathStr] = options?.merge ? { ...existing, ...value, id: this.id } : { ...value, id: this.id };
    this.saveData(data);
    return this;
  }

  async update(value: any) {
    const data = this.loadData();
    const existing = data[this.pathStr] || {};
    data[this.pathStr] = { ...existing, ...value, id: this.id };
    this.saveData(data);
    return this;
  }

  async delete() {
    const data = this.loadData();
    delete data[this.pathStr];
    this.saveData(data);
    return this;
  }

  collection(subCollectionName: string) {
    return new MockCollectionReference(`${this.pathStr}/${subCollectionName}`);
  }
}

class MockCollectionReference {
  constructor(private pathStr: string) {}

  get id() {
    const parts = this.pathStr.split('/');
    return parts[parts.length - 1];
  }

  doc(id?: string) {
    const actualId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocumentReference(`${this.pathStr}/${actualId}`);
  }

  private loadAll(): MockDoc[] {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Record<string, MockDoc>;
      // Filter keys that match this collection structure
      // E.g., /businesses/123/products/abc
      // Our pathStr is "businesses/123/products"
      // Key should look like "businesses/123/products/someId" (exactly one level deeper)
      const prefix = this.pathStr + '/';
      return Object.keys(data)
        .filter(key => key.startsWith(prefix) && key.replace(prefix, '').split('/').length === 1)
        .map(key => ({ ...data[key], id: key.split('/').pop()! }));
    } catch {
      return [];
    }
  }

  async add(value: any) {
    const id = Math.random().toString(36).substring(2, 15);
    const docRef = new MockDocumentReference(`${this.pathStr}/${id}`);
    await docRef.set(value);
    return docRef;
  }

  async get() {
    const docs = this.loadAll();
    return {
      empty: docs.length === 0,
      docs: docs.map(doc => ({
        id: doc.id,
        exists: true,
        data: () => doc
      }))
    };
  }

  where(field: string, op: string, val: any) {
    return new MockQuery(this.loadAll(), this.pathStr).where(field, op, val);
  }

  limit(n: number) {
    return new MockQuery(this.loadAll(), this.pathStr).limit(n);
  }

  orderBy(field: string, direction?: 'asc' | 'desc') {
    return new MockQuery(this.loadAll(), this.pathStr).orderBy(field, direction);
  }
}

class MockQuery {
  constructor(private items: MockDoc[], private pathStr: string) {}

  where(field: string, op: string, val: any) {
    const filtered = this.items.filter(item => {
      const fieldVal = item[field];
      if (op === '==') return fieldVal === val;
      if (op === 'array-contains') return Array.isArray(fieldVal) && fieldVal.includes(val);
      if (op === '>') return fieldVal > val;
      if (op === '<') return fieldVal < val;
      if (op === '>=') return fieldVal >= val;
      if (op === '<=') return fieldVal <= val;
      if (op === '!=') return fieldVal !== val;
      return false;
    });
    return new MockQuery(filtered, this.pathStr);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    const sorted = [...this.items].sort((a, b) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return new MockQuery(sorted, this.pathStr);
  }

  limit(n: number) {
    return new MockQuery(this.items.slice(0, n), this.pathStr);
  }

  async get() {
    return {
      empty: this.items.length === 0,
      docs: this.items.map(doc => ({
        id: doc.id,
        exists: true,
        data: () => doc
      }))
    };
  }
}

export const mockDb = {
  collection: (collectionName: string) => new MockCollectionReference(collectionName),
  doc: (pathStr: string) => new MockDocumentReference(pathStr)
};
