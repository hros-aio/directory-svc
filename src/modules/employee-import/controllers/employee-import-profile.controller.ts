import {
  Body,
  Controller,
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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionGuard, RequirePermission } from '@new-hros/libs-apis';

import { CreateImportProfileDto, ImportProfileResponseDto, UpdateImportProfileDto } from '../dto';
import { EmployeeImportProfileService } from '../services/employee-import-profile.service';

@ApiTags('Employee Import Profiles')
@ApiBearerAuth()
@Controller('employee-import-profiles')
@UseGuards(PermissionGuard)
export class EmployeeImportProfileController {
  constructor(private readonly profileService: EmployeeImportProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('import_profile.create')
  @ApiOperation({ summary: 'Create a new reusable employee import profile' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Profile created successfully',
    type: ImportProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid configuration schema' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Duplicate profile name for tenant' })
  async create(@Body() dto: CreateImportProfileDto): Promise<ImportProfileResponseDto> {
    return this.profileService.create(dto);
  }

  @Get()
  @RequirePermission('import_profile.read')
  @ApiOperation({ summary: 'List import profiles accessible to the authenticated tenant' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of accessible profiles',
    type: [ImportProfileResponseDto],
  })
  async list(
    @Query('isActive') isActive?: string,
    @Query('companyId') companyId?: string,
  ): Promise<ImportProfileResponseDto[]> {
    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
    return this.profileService.list(activeFilter, companyId);
  }

  @Get(':id')
  @RequirePermission('import_profile.read')
  @ApiOperation({ summary: 'Retrieve an import profile by UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile details',
    type: ImportProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ImportProfileResponseDto> {
    return this.profileService.getById(id);
  }

  @Patch(':id')
  @RequirePermission('import_profile.update')
  @ApiOperation({ summary: 'Update profile metadata and/or configuration with optimistic locking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: ImportProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or quota exceeded',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'System profiles cannot be modified' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Version conflict occurred' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImportProfileDto,
  ): Promise<ImportProfileResponseDto> {
    return this.profileService.update(id, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('import_profile.update')
  @ApiOperation({ summary: 'Activate an import profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile activated',
    type: ImportProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'System profiles cannot be modified' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<ImportProfileResponseDto> {
    return this.profileService.activate(id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('import_profile.update')
  @ApiOperation({ summary: 'Deactivate an import profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile deactivated',
    type: ImportProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'System profiles cannot be modified' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<ImportProfileResponseDto> {
    return this.profileService.deactivate(id);
  }
}
