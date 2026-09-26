import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionGuard, RequirePermission } from '@new-hros/libs-apis';

import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { EmployeeService } from '../services/employee.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(PermissionGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('employee.create')
  @ApiOperation({ summary: 'Create a new employee profile and primary assignment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Employee created successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or organizational assignment',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Referenced setting entity or manager not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate employee code or projection not ready',
  })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    return this.employeeService.createEmployee(dto);
  }
}
