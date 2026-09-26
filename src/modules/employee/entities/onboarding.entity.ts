import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index, JoinColumn, OneToMany, OneToOne, Unique } from 'typeorm';

import { EmployeeEntity } from './employee.entity';
import { OnboardingRequirementEntity } from './onboarding-requirement.entity';
import { OnboardingStatus, TableName } from '../../../common/enums';

@Entity(TableName.Onboarding)
@Unique('uq_onboardings_tenant_id', ['tenantCode', 'id'])
@Unique('uq_onboardings_employee', ['tenantCode', 'employeeId'])
@Index('idx_onboardings_status', ['tenantCode', 'status'])
export class OnboardingEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', nullable: false })
  employeeId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OnboardingStatus,
    enumName: 'onboarding_status',
    nullable: false,
    default: OnboardingStatus.DRAFT,
  })
  status: OnboardingStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @OneToOne(() => EmployeeEntity, (employee) => employee.onboarding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;

  @OneToMany(() => OnboardingRequirementEntity, (req) => req.onboarding, {
    cascade: true,
  })
  requirements?: OnboardingRequirementEntity[];
}
