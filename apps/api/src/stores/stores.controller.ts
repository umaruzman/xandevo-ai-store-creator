import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type User } from '@prisma/client';
import { type StoreListResponse, type StoreResponse } from '@xandevo/shared';

import { CurrentUser } from '../auth/current-user.decorator';
import { CreateStoreDto } from './dto/create-store.dto';
import { ListStoresQuery } from './dto/list-stores.query';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreOwnerGuard } from './guards/store-owner.guard';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateStoreDto, @CurrentUser() user: User): Promise<StoreResponse> {
    return this.stores.create(user.id, dto);
  }

  @Get()
  list(@Query() query: ListStoresQuery, @CurrentUser() user: User): Promise<StoreListResponse> {
    return this.stores.list(user.id, query.limit ?? 20, query.cursor);
  }

  @UseGuards(StoreOwnerGuard)
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<StoreResponse> {
    return this.stores.get(user.id, id);
  }

  @UseGuards(StoreOwnerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: User,
  ): Promise<StoreResponse> {
    return this.stores.update(user.id, id, dto);
  }

  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<void> {
    return this.stores.remove(user.id, id);
  }
}
