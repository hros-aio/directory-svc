import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { OnboardingEntity } from './onboarding.entity';
import { OnboardingRequirementStatus, OnboardingRequirementType } from '../../../common/enums';

@Entity('onboarding_requirements')
@Unique('uq_onboarding_requirements_tenant_id', ['tenantCode', 'id'])
@Index('idx_onboarding_requirements_onboarding', ['tenantCode', 'onboardingId'])
@Index('idx_onboarding_requirements_status', ['tenantCode', 'status'])
export class OnboardingRequirementEntity extends BaseEntity {
  @Column({ name: 'onboarding_id', type: 'uuid', nullable: false })
  onboardingId!: string;

  @Column({
    name: 'requirement_type',
    type: 'enum',
    enum: OnboardingRequirementType,
    enumName: 'onboarding_requirement_type',
    nullable: false,
  })
  requirementType!: OnboardingRequirementType;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ name: 'required', type: 'boolean', nullable: false, default: true })
  required!: boolean;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OnboardingRequirementStatus,
    enumName: 'onboarding_requirement_status',
    nullable: false,
    default: OnboardingRequirementStatus.PENDING,
  })
  status!: OnboardingRequirementStatus;

  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  documentId!: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => OnboardingEntity, (onboarding) => onboarding.requirements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'onboarding_id', referencedColumnName: 'id' })
  onboarding?: OnboardingEntity;
}
