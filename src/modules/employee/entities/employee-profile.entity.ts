import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { EmployeeEntity } from './employee.entity';
import type { Address } from '../../../common/interfaces';

import { TableName } from '@/common';

@Entity(TableName.EmployeeProfile)
@Index('idx_employee_profiles_tenant_name', ['tenantCode', 'lastName', 'firstName'])
export class EmployeeProfileEntity extends BaseEntity {
  @PrimaryColumn('uuid', { name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: false })
  firstName: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: false })
  lastName: string;

  @Column({ name: 'preferred_name', type: 'varchar', length: 100, nullable: true })
  preferredName: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'gender', type: 'varchar', length: 32, nullable: true })
  gender: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'personal_email', type: 'varchar', length: 320, nullable: true })
  personalEmail: string | null;

  @Column({ name: 'personal_phone', type: 'varchar', length: 64, nullable: true })
  personalPhone: string | null;

  @Column({ name: 'address', type: 'jsonb', nullable: true })
  address: Address | null;

  @OneToOne(() => EmployeeEntity, (employee) => employee.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;
}
