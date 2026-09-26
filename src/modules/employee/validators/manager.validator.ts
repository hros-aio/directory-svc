import { Injectable } from '@nestjs/common';
import { BusinessException } from '@new-hros/libs-core';

import { EmployeeStatus, EmploymentStatus } from '../../../common/enums';
import { ResolvedManagerDto } from '../dto/employee-response.dto';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeRepository } from '../repositories/employee.repository';

@Injectable()
export class ManagerValidator {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async validateManager(
    managerId: string,
    tenantCode: string,
  ): Promise<{ manager: EmployeeEntity; resolved: ResolvedManagerDto }> {
    const manager = await this.employeeRepository.findByIdAndTenant(managerId, tenantCode);
    if (!manager) {
      throw new BusinessException(
        `Manager with ID '${managerId}' not found in current tenant`,
        'MANAGER_NOT_FOUND',
        404,
      );
    }

    if (
      manager.status === EmployeeStatus.TERMINATED ||
      manager.status === EmployeeStatus.INACTIVE ||
      manager.employmentStatus === EmploymentStatus.ENDED ||
      manager.employmentStatus === EmploymentStatus.SUSPENDED
    ) {
      throw new BusinessException(
        `Manager with ID '${managerId}' is inactive or ineligible`,
        'INVALID_MANAGER',
        400,
      );
    }

    const fullName = manager.profile
      ? [manager.profile.firstName, manager.profile.middleName, manager.profile.lastName]
          .filter(Boolean)
          .join(' ')
      : manager.employeeCode;

    return {
      manager,
      resolved: {
        id: manager.id,
        employeeCode: manager.employeeCode,
        fullName,
      },
    };
  }
}
