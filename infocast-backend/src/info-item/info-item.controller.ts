import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { InfoItemService } from './info-item.service';
import { CreateInfoItemDto } from './dto/create-info-item.dto';
import { UpdateInfoItemDto } from './dto/update-info-item.dto';
import { QueryInfoItemDto } from './dto/query-info-item.dto';

@Controller('info-items')
@UseGuards(JwtAuthGuard)
export class InfoItemController {
  constructor(private readonly service: InfoItemService) {}

  // ── 조회 (인증 사용자) ───────────────────────────────
  @Get()
  findAll(@Query() query: QueryInfoItemDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ── 인입·관리 (관리자) ───────────────────────────────
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateInfoItemDto) {
    return this.service.create(dto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInfoItemDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.setStatus(id, ItemStatus.APPROVED);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.service.setStatus(id, ItemStatus.ARCHIVED);
  }
}
