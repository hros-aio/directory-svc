import { EmploymentContractEntity } from './employment-contract.entity';
import { EmploymentContractStatus, EmploymentContractType } from '../../../common/enums';

describe('EmploymentContractEntity', () => {
  it('should instantiate EmploymentContractEntity with contract details', () => {
    const contract = new EmploymentContractEntity();
    contract.id = 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    contract.tenantCode = 'DEFAULT';
    contract.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    contract.contractType = EmploymentContractType.PERMANENT;
    contract.contractNumber = 'CTR-2026-001';
    contract.startDate = new Date('2026-01-01');
    contract.endDate = null;
    contract.status = EmploymentContractStatus.ACTIVE;

    expect(contract.contractNumber).toBe('CTR-2026-001');
    expect(contract.contractType).toBe(EmploymentContractType.PERMANENT);
    expect(contract.status).toBe(EmploymentContractStatus.ACTIVE);
  });
});
