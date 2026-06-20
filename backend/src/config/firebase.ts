// Redirecting Firebase imports to the new Supabase adapter.
// This allows the rest of the backend codebase to continue importing from './config/firebase'
// without needing any query syntax modifications.

export { db, auth, storage } from './supabase';

