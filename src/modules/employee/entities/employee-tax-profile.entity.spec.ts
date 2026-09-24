import { EmployeeTaxProfileEntity } from './employee-tax-profile.entity';
import { TaxProfileStatus } from '../../../common/enums';

describe('EmployeeTaxProfileEntity', () => {
  it('should instantiate EmployeeTaxProfileEntity with tax metadata', () => {
    const tax = new EmployeeTaxProfileEntity();
    tax.id = 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    tax.tenantCode = 'DEFAULT';
    tax.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    tax.countryCode = 'VN';
    tax.taxNumber = '8001234567';
    tax.status = TaxProfileStatus.ACTIVE;
    tax.metadata = {
      taxAuthority: 'General Department of Taxation',
      withholdingPercentage: 10,
    };

    expect(tax.countryCode).toBe('VN');
    expect(tax.taxNumber).toBe('8001234567');
    expect(tax.metadata?.taxAuthority).toBe('General Department of Taxation');
  });
});
