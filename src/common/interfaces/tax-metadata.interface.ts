export interface TaxMetadata {
  readonly taxAuthority?: string;
  readonly withholdingPercentage?: number;
  readonly exemptions?: Record<string, unknown>;
  readonly customFields?: Record<string, unknown>;
}
