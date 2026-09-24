import { EmployeeDocumentEntity } from './employee-document.entity';
import { EmployeeDocumentStatus, EmployeeDocumentType } from '../../../common/enums';

describe('EmployeeDocumentEntity', () => {
  it('should instantiate EmployeeDocumentEntity with document details', () => {
    const doc = new EmployeeDocumentEntity();
    doc.id = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    doc.tenantCode = 'DEFAULT';
    doc.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    doc.documentType = EmployeeDocumentType.PASSPORT;
    doc.documentNumber = 'B1234567';
    doc.fileId = 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    doc.status = EmployeeDocumentStatus.VERIFIED;
    doc.issuedAt = new Date('2024-01-01');
    doc.expiredAt = new Date('2034-01-01');

    expect(doc.documentType).toBe(EmployeeDocumentType.PASSPORT);
    expect(doc.documentNumber).toBe('B1234567');
    expect(doc.status).toBe(EmployeeDocumentStatus.VERIFIED);
  });
});
