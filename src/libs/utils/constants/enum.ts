// Enum definitions
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ResponseData {
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum UserRole {
  ADMIN = 'admin',
  SECURITY = 'security',
  CUSTOMER = 'customer',
}

export enum TicketStatus {
  VALID = 'valid',
  USED = 'used',
  INVALID = 'invalid',
}

export enum IncidentType {
  DUPLICATE = 'duplicate',
  SUSPICIOUS = 'suspicious',
  INVALID = 'invalid',
  OTHER = 'other',
}

export enum IncidentStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
}

export enum ScanResult {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum EventCategory {
  CONCERT = 'Concert',
  EXPO = 'Expo',
  CONFERENCE = 'Conference',
  FESTIVAL = 'Festival',
}

export enum ZoneName {
  VIP = 'VIP',
  PREMIUM = 'Premium',
  GENERAL = 'General',
  STANDARD = 'Standard',
}
