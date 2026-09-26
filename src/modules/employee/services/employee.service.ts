import { Injectable, Logger, Optional } from '@nestjs/common';
import { BusinessException, LoggerService, RequestContextService } from '@new-hros/libs-core';
import { TransactionService } from '@new-hros/libs-sql';

import { EmployeeStatus, EmploymentStatus, OutboxStatus } from '../../../common/enums';
import { EmploymentAssignmentEntity } from '../../employment/entities/employment-assignment.entity';
import { EmploymentAssignmentRepository } from '../../employment/repositories/employment-assignment.repository';
import { OutboxRepository } from '../../outbox/repositories/outbox.repository';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeResponseDto, ResolvedManagerDto } from '../dto/employee-response.dto';
import { EmployeeProfileEntity } from '../entities/employee-profile.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeProfileRepository } from '../repositories/employee-profile.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { EmployeeReferenceValidator } from '../validators/employee-reference.validator';
import { ManagerValidator } from '../validators/manager.validator';

export interface RequestTenantContext {
  readonly tenantCode: string;
  readonly userId: string;
  readonly requestId?: string;
  readonly traceId?: string;
}

@Injectable()
export class EmployeeService {
  private readonly defaultLogger = new Logger(EmployeeService.name);

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly profileRepository: EmployeeProfileRepository,
    private readonly assignmentRepository: EmploymentAssignmentRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly referenceValidator: EmployeeReferenceValidator,
    private readonly managerValidator: ManagerValidator,
    private readonly transactionService: TransactionService,
    @Optional() private readonly loggerService?: LoggerService,
  ) {}

  async createEmployee(dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const actorId = RequestContextService.getUser().userId;
    const normalizedCode = dto.employeeCode.trim();

    // 1. Check duplicate employee code within tenant
    const existingEmployee = await this.employeeRepository.findByCode(tenantCode, normalizedCode);
    if (existingEmployee) {
      throw new BusinessException(
        `Employee with code '${normalizedCode}' already exists in tenant '${tenantCode}'`,
        'DUPLICATE_EMPLOYEE_CODE',
        409,
      );
    }

    // 2. Validate Setting reference projections
    const resolvedReferences = await this.referenceValidator.validateAndResolve(dto, tenantCode);

    // 3. Validate Manager (if supplied)
    let resolvedManager: ResolvedManagerDto | null = null;
    if (dto.managerId) {
      const managerValidationResult = await this.managerValidator.validateManager(
        dto.managerId,
        tenantCode,
      );
      resolvedManager = managerValidationResult.resolved;
    }

    // 4. Execute atomic transaction
    const { employee, profile, assignment } = await this.transactionService.runInTransaction(
      async () => {
        // 4.1 Persist Employee Entity
        const employeeToCreate: Partial<EmployeeEntity> = {
          tenantCode,
          employeeCode: normalizedCode,
          employmentType: dto.employmentType,
          employmentStatus: dto.employmentStatus ?? EmploymentStatus.PENDING,
          status: EmployeeStatus.INVITED,
          joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : null,
          probationEndAt: dto.probationEndAt ? new Date(dto.probationEndAt) : null,
          endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
        };
        const savedEmployee = await this.employeeRepository.createAndSave(employeeToCreate);

        // 4.2 Persist Employee Profile Entity
        const profileToCreate: Partial<EmployeeProfileEntity> = {
          tenantCode,
          employeeId: savedEmployee.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          middleName: dto.middleName ? dto.middleName.trim() : null,
          preferredName: dto.preferredName ? dto.preferredName.trim() : null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender ?? null,
          avatarUrl: dto.avatarUrl ?? null,
          personalEmail: dto.personalEmail ?? null,
          personalPhone: dto.personalPhone ?? null,
          address: dto.address ?? null,
        };
        const savedProfile = await this.profileRepository.createAndSave(profileToCreate);

        // 4.3 Persist Employment Assignment Entity
        const effectiveFromDate = dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : dto.joinedAt
            ? new Date(dto.joinedAt)
            : new Date();

        const assignmentToCreate: Partial<EmploymentAssignmentEntity> = {
          tenantCode,
          employeeId: savedEmployee.id,
          companyId: dto.companyId,
          departmentId: dto.departmentId ?? null,
          locationId: dto.locationId ?? null,
          gradeId: dto.gradeId ?? null,
          jobTitleId: dto.jobTitleId ?? null,
          managerEmployeeId: dto.managerId ?? null,
          effectiveFrom: effectiveFromDate,
          effectiveTo: null,
        };
        const savedAssignment = await this.assignmentRepository.createAndSave(assignmentToCreate);

        // 4.4 Persist Outbox Event
        const eventPayload = {
          employeeId: savedEmployee.id,
          tenantCode,
          employeeCode: savedEmployee.employeeCode,
          status: savedEmployee.status,
          employmentType: savedEmployee.employmentType,
          employmentStatus: savedEmployee.employmentStatus,
          companyId: savedAssignment.companyId,
          locationId: savedAssignment.locationId,
          departmentId: savedAssignment.departmentId,
          gradeId: savedAssignment.gradeId,
          jobTitleId: savedAssignment.jobTitleId,
          managerId: savedAssignment.managerEmployeeId,
          joinedAt: savedEmployee.joinedAt ? savedEmployee.joinedAt.toISOString() : null,
          createdAt: savedEmployee.createdAt
            ? savedEmployee.createdAt.toISOString()
            : new Date().toISOString(),
        };

        await this.outboxRepository.createAndSave({
          tenantCode,
          aggregateType: 'EMPLOYEE',
          aggregateId: savedEmployee.id,
          eventType: 'directory.employee.created',
          eventVersion: 1,
          payload: eventPayload,
          status: OutboxStatus.PENDING,
        });

        return {
          employee: savedEmployee,
          profile: savedProfile,
          assignment: savedAssignment,
        };
      },
    );

    // 5. Emit Audit Log
    if (this.loggerService) {
      this.loggerService.audit('EMPLOYEE_CREATED', actorId, {
        tenantCode,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        traceId: RequestContextService.getTraceId(),
        requestId: RequestContextService.getRequestId(),
      });
    } else {
      this.defaultLogger.log(
        `Audit: EMPLOYEE_CREATED by actor ${actorId} - employeeId: ${employee.id}, tenant: ${tenantCode}`,
      );
    }

    // 6. Build and return EmployeeResponseDto
    return EmployeeResponseDto.mapToResponseDto(
      employee,
      profile,
      assignment,
      resolvedReferences,
      resolvedManager,
    );
  }
}
