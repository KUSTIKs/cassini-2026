import type { Alert } from "../../../domain/alert.js";

export interface AlertRepository {
  findActive(municipalityId: string): Promise<Alert | null>;
  get(id: string): Promise<Alert | null>;
  listByMunicipality(municipalityId: string): Promise<Alert[]>;
  save(alert: Alert): Promise<void>;
}
