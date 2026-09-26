import { Company, Department, Grade, JobTitle, Location } from '@new-hros/libs-sql';

export interface CompanyPayload extends Company {}
export interface DepartmentPayload extends Department {}
export interface LocationPayload extends Location {}
export interface GradePayload extends Grade {}
export interface JobTitlePayload extends JobTitle {}
