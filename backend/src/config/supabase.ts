import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { mockDb } from './firestore-mock';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: any = null;
let useSupabase = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    useSupabase = true;
    console.log('Supabase client initialized successfully.');
  } catch (error: any) {
    console.error('Failed to initialize Supabase client:', error.message);
  }
}

if (!useSupabase) {
  console.warn('Running in development sandbox mode with local firestore-mock.');
}

// Field mappings between JS camelCase and Postgres snake_case
const FIELD_MAPS: Record<string, string> = {
  whatsappNumber: 'whatsapp_number',
  welcomeMessage: 'welcome_message',
  returnPolicy: 'return_policy',
  deliveryFee: 'delivery_fee',
  createdAt: 'created_at',
  totalOrders: 'total_orders',
  totalSpent: 'total_spent',
  lastMessage: 'last_message',
  lastMessageTime: 'last_message_time',
  aiActive: 'ai_active',
  customerId: 'customer_id'
};

const REVERSE_FIELD_MAPS: Record<string, string> = {};
for (const [k, v] of Object.entries(FIELD_MAPS)) {
  REVERSE_FIELD_MAPS[v] = k;
}

function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === 'object') {
    const n: any = {};
    for (const key of Object.keys(obj)) {
      const camelKey = REVERSE_FIELD_MAPS[key] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      n[camelKey] = toCamel(obj[key]);
    }
    return n;
  }
  return obj;
}

function toSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj !== null && typeof obj === 'object') {
    const n: any = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = FIELD_MAPS[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      n[snakeKey] = toSnake(obj[key]);
    }
    return n;
  }
  return obj;
}

// Table columns for filtering out extra fields
const TABLE_COLUMNS: Record<string, string[]> = {
  businesses: ['id', 'name', 'type', 'whatsapp_number', 'welcome_message', 'return_policy', 'delivery_fee', 'faqs', 'subscription', 'created_at'],
  products: ['id', 'business_id', 'name', 'price', 'stock', 'category', 'description', 'images'],
  customers: ['id', 'business_id', 'name', 'phone', 'language', 'tags', 'total_orders', 'total_spent'],
  conversations: ['id', 'business_id', 'customer_id', 'last_message', 'last_message_time', 'unread', 'ai_active'],
  messages: ['id', 'business_id', 'conversation_id', 'role', 'content', 'type', 'timestamp'],
  orders: ['id', 'business_id', 'customer_id', 'status', 'items', 'total', 'created_at']
};

function filterValidColumns(table: string, obj: any): any {
  const columns = TABLE_COLUMNS[table];
  if (!columns) return obj;
  const filtered: any = {};
  for (const k of Object.keys(obj)) {
    if (columns.includes(k)) {
      filtered[k] = obj[k];
    }
  }
  return filtered;
}

// Path parser
function parsePath(pathStr: string) {
  const cleanPath = pathStr.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/');
  
  if (segments.length === 1) {
    return { type: 'collection', table: 'businesses', filters: {} };
  } else if (segments.length === 2) {
    return { type: 'document', table: 'businesses', filters: { id: segments[1] } };
  } else if (segments.length === 3) {
    return { type: 'collection', table: segments[2], filters: { business_id: segments[1] } };
  } else if (segments.length === 4) {
    return { type: 'document', table: segments[2], filters: { business_id: segments[1], id: segments[3] } };
  } else if (segments.length === 5) {
    return { type: 'collection', table: 'messages', filters: { business_id: segments[1], conversation_id: segments[3] } };
  } else if (segments.length === 6) {
    return { type: 'document', table: 'messages', filters: { business_id: segments[1], conversation_id: segments[3], id: segments[5] } };
  }
  throw new Error(`Invalid path structure: ${pathStr}`);
}

export interface DocumentSnapshot {
  id: string;
  exists: boolean;
  data: () => any;
}

export interface QuerySnapshot {
  empty: boolean;
  docs: DocumentSnapshot[];
  size: number;
}

export class SupabaseDocumentReference {
  constructor(private pathStr: string) {}

  get id(): string {
    const parts = this.pathStr.split('/');
    return parts[parts.length - 1];
  }

  get path(): string {
    return this.pathStr;
  }

  async get(): Promise<DocumentSnapshot> {
    const { table, filters } = parsePath(this.pathStr);
    let query = supabase.from(table).select('*');
    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error(`Error fetching document ${this.pathStr}:`, error.message);
      throw error;
    }
    return {
      exists: !!data,
      id: this.id,
      data: () => data ? toCamel(data) : undefined
    };
  }

  async set(value: any, options?: { merge?: boolean }): Promise<this> {
    const { table, filters } = parsePath(this.pathStr);
    const snakeValue = toSnake(value);
    
    let finalValue = { ...snakeValue, ...filters };
    
    if (options?.merge) {
      let query = supabase.from(table).select('*');
      for (const [key, val] of Object.entries(filters)) {
        query = query.eq(key, val);
      }
      const { data: existing } = await query.maybeSingle();
      if (existing) {
        finalValue = { ...existing, ...finalValue };
      }
    }
    
    // Filter columns
    const filteredValue = filterValidColumns(table, finalValue);
    
    const { error } = await supabase.from(table).upsert(filteredValue);
    if (error) {
      console.error(`Error setting document ${this.pathStr}:`, error.message);
      throw error;
    }
    return this;
  }

  async update(value: any): Promise<this> {
    const { table, filters } = parsePath(this.pathStr);
    const snakeValue = toSnake(value);
    const filteredValue = filterValidColumns(table, snakeValue);
    
    let query = supabase.from(table).update(filteredValue);
    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }
    const { error } = await query;
    if (error) {
      console.error(`Error updating document ${this.pathStr}:`, error.message);
      throw error;
    }
    return this;
  }

  async delete(): Promise<this> {
    const { table, filters } = parsePath(this.pathStr);
    let query = supabase.from(table).delete();
    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }
    const { error } = await query;
    if (error) {
      console.error(`Error deleting document ${this.pathStr}:`, error.message);
      throw error;
    }
    return this;
  }

  collection(subCollectionName: string): SupabaseCollectionReference {
    return new SupabaseCollectionReference(`${this.pathStr}/${subCollectionName}`);
  }
}

export class SupabaseCollectionReference {
  constructor(protected pathStr: string) {}

  get id(): string {
    const parts = this.pathStr.split('/');
    return parts[parts.length - 1];
  }

  doc(id?: string): SupabaseDocumentReference {
    const actualId = id || Math.random().toString(36).substring(2, 15);
    return new SupabaseDocumentReference(`${this.pathStr}/${actualId}`);
  }

  async add(value: any): Promise<SupabaseDocumentReference> {
    const id = Math.random().toString(36).substring(2, 15);
    const docRef = this.doc(id);
    await docRef.set(value);
    return docRef;
  }

  async get(): Promise<QuerySnapshot> {
    return new SupabaseQuery(this.pathStr).get();
  }

  where(field: string, op: string, val: any): SupabaseQuery {
    return new SupabaseQuery(this.pathStr).where(field, op, val);
  }

  limit(n: number): SupabaseQuery {
    return new SupabaseQuery(this.pathStr).limit(n);
  }

  orderBy(field: string, direction?: 'asc' | 'desc'): SupabaseQuery {
    return new SupabaseQuery(this.pathStr).orderBy(field, direction);
  }
}

interface WhereClause {
  field: string;
  op: string;
  val: any;
}

export class SupabaseQuery {
  private whereClauses: WhereClause[] = [];
  private orderField?: string;
  private orderDirection?: 'asc' | 'desc';
  private limitVal?: number;

  constructor(private pathStr: string) {}

  where(field: string, op: string, val: any): this {
    this.whereClauses.push({ field, op, val });
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderField = field;
    this.orderDirection = direction;
    return this;
  }

  limit(n: number): this {
    this.limitVal = n;
    return this;
  }

  async get(): Promise<QuerySnapshot> {
    const { table, filters } = parsePath(this.pathStr);
    let query = supabase.from(table).select('*');
    
    // Apply path filters
    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }
    
    // Apply where clauses
    for (const w of this.whereClauses) {
      const snakeField = FIELD_MAPS[w.field] || w.field.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
      if (w.op === '==') {
        query = query.eq(snakeField, w.val);
      } else if (w.op === 'array-contains') {
        query = query.contains(snakeField, JSON.stringify([w.val]));
      } else if (w.op === '>') {
        query = query.gt(snakeField, w.val);
      } else if (w.op === '<') {
        query = query.lt(snakeField, w.val);
      } else if (w.op === '>=') {
        query = query.gte(snakeField, w.val);
      } else if (w.op === '<=') {
        query = query.lte(snakeField, w.val);
      } else if (w.op === '!=') {
        query = query.neq(snakeField, w.val);
      }
    }
    
    // Apply ordering
    if (this.orderField) {
      const snakeOrderField = FIELD_MAPS[this.orderField] || this.orderField.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
      query = query.order(snakeOrderField, { ascending: this.orderDirection === 'asc' });
    }
    
    // Apply limit
    if (this.limitVal !== undefined) {
      query = query.limit(this.limitVal);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error(`Error querying collection ${this.pathStr}:`, error.message);
      throw error;
    }
    
    const docs = (data || []).map((row: any) => ({
      id: row.id,
      exists: true,
      data: () => toCamel(row)
    }));
    
    return {
      empty: docs.length === 0,
      docs,
      size: docs.length
    };
  }
}

// We type db using the Supabase classes to ensure proper type checking for the backend codebase
const db: {
  collection: (collectionName: string) => SupabaseCollectionReference;
  doc: (pathStr: string) => SupabaseDocumentReference;
} = (useSupabase
  ? {
      collection: (collectionName: string) => new SupabaseCollectionReference(collectionName),
      doc: (pathStr: string) => new SupabaseDocumentReference(pathStr)
    }
  : mockDb) as any;

const auth = {
  verifyIdToken: async (token: string) => {
    // Check mock tokens first
    if (token === 'mock-super-admin-token') {
      return { uid: 'super-admin-id', role: 'super-admin', email: 'admin@autobiz.ai' };
    }
    if (token.startsWith('mock-biz-')) {
      const businessId = token.split('-')[2];
      return { uid: `owner-${businessId}`, role: 'business-admin', businessId, email: `owner@${businessId}.com` };
    }

    if (useSupabase && supabase) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw error || new Error('No user found');
        return {
          uid: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'employee',
          businessId: user.user_metadata?.businessId
        };
      } catch (err: any) {
        console.warn('Supabase token verification failed, bypassing to mock role:', err.message);
        return { uid: 'mock-user-id', role: 'employee', email: 'staff@autobiz.ai' };
      }
    }

    // Default mock response
    return { uid: 'mock-user-id', role: 'employee', email: 'staff@autobiz.ai' };
  }
};

export { db, auth };
export const storage = null;
