import { type StoreDefinition } from '../store-definition/store-definition.js';

/**
 * Transport DTO shapes for the REST API (docs/api/api-contract.md).
 * Phase 3: types only. Runtime DTO validation lives in `apps/api` (class-validator).
 */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: { path: string; message: string }[];
  };
}

export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface GenerateStoreRequest {
  prompt: string;
}
export interface GenerateStoreResponse {
  definition: StoreDefinition;
  promptVersion: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface CreateStoreRequest {
  name: string;
  prompt: string;
  promptVersion: string;
  definition: StoreDefinition;
}
export interface UpdateStoreRequest {
  name?: string;
  status?: 'draft' | 'saved';
  definition?: StoreDefinition;
}

export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'saved';
  updatedAt: string;
}
export interface StoreResponse {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'saved';
  promptVersion: string;
  schemaVersion: number;
  definition: StoreDefinition;
  createdAt: string;
  updatedAt: string;
}
export interface StoreListResponse {
  items: StoreSummary[];
  nextCursor: string | null;
}
