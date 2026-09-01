import { Injectable, NotFoundException } from '@nestjs/common';
import { type StoreResponse, type StoreSummary, validateStoreDefinition } from '@xandevo/shared';

import { StoresRepository, type StoreRecord } from './stores.repository';

@Injectable()
export class StoresService {
  constructor(private readonly repo: StoresRepository) {}

  async create(
    userId: string,
    input: { name: string; prompt: string; promptVersion: string; definition: unknown },
  ): Promise<StoreResponse> {
    const definition = validateStoreDefinition(input.definition);
    const record = await this.repo.create(userId, {
      promptText: input.prompt,
      promptVersion: input.promptVersion,
      definition: { ...definition, meta: { ...definition.meta, name: input.name } },
    });
    return toResponse(record);
  }

  async list(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: StoreSummary[]; nextCursor: string | null }> {
    const { items, nextCursor } = await this.repo.listSummaries(userId, limit, cursor);
    return {
      items: items.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        updatedAt: s.updatedAt.toISOString(),
      })),
      nextCursor,
    };
  }

  async get(userId: string, id: string): Promise<StoreResponse> {
    const record = await this.repo.findRecord(userId, id);
    if (!record) throw notFound();
    return toResponse(record);
  }

  async update(
    userId: string,
    id: string,
    patch: { name?: string; status?: 'draft' | 'saved'; definition?: unknown },
  ): Promise<StoreResponse> {
    let record: StoreRecord | null = null;

    if (patch.definition !== undefined) {
      const definition = validateStoreDefinition(patch.definition);
      record = await this.repo.replaceAggregate(
        userId,
        id,
        patch.name ? { ...definition, meta: { ...definition.meta, name: patch.name } } : definition,
      );
    }

    if (patch.name !== undefined || patch.status !== undefined) {
      record = await this.repo.updateMetadata(userId, id, {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
      });
    }

    if (!record) record = await this.repo.findRecord(userId, id);
    if (!record) throw notFound();
    return toResponse(record);
  }

  async remove(userId: string, id: string): Promise<void> {
    const ok = await this.repo.delete(userId, id);
    if (!ok) throw notFound();
  }
}

function toResponse(record: StoreRecord): StoreResponse {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    status: record.status,
    promptVersion: record.promptVersion,
    schemaVersion: record.schemaVersion,
    definition: record.definition,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const notFound = () =>
  new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
