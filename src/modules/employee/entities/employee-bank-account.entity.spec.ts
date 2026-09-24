import { EmployeeBankAccountEntity } from './employee-bank-account.entity';
import { BankAccountStatus } from '../../../common/enums';

describe('EmployeeBankAccountEntity', () => {
  it('should instantiate EmployeeBankAccountEntity with bank details', () => {
    const account = new EmployeeBankAccountEntity();
    account.id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    account.tenantCode = 'DEFAULT';
    account.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    account.bankName = 'Vietcombank';
    account.bankCode = 'VCB';
    account.accountNumber = '0011001234567';
    account.accountHolderName = 'JOHN DOE';
    account.currencyCode = 'VND';
    account.status = BankAccountStatus.ACTIVE;
    account.isPrimary = true;

    expect(account.bankName).toBe('Vietcombank');
    expect(account.isPrimary).toBe(true);
    expect(account.currencyCode).toBe('VND');
  });
});
