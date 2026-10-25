export type ServiceType = 'mobile_update' | 'biometric_update' | 'new_enrollment' | 'correction' | 'other';

export type TokenStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'absent' | 'cancelled';

export type UserRole = 'owner' | 'staff' | 'customer';

export interface TokenRecord {
  id: string;
  uniqueId: string;
  tokenNumber: number;
  tokenDisplay: string;
  name: string;
  mobile: string;
  aadhaar: string; // 12-digit Mandatory Aadhaar
  userId?: string;
  userEmail?: string;
  service: ServiceType | string;
  serviceLabel: string;
  correctionOptions?: string[]; // e.g. ['address_change', 'relation_update']
  slotDate: string; // YYYY-MM-DD
  slotStartTime: string;
  slotEndTime: string;
  slotFullText: string;
  slotMinutesFromMidnight: number;
  status: TokenStatus;
  isEmergency?: boolean;
  emergencyFee?: number; // e.g. 50
  bookingMode?: 'simple' | 'normal' | 'emergency';
  notes?: string;
  counter?: number;
  reminder10MinEnabled?: boolean;
  reminderSent?: boolean;
  smsConfirmationSent?: boolean;
  smsConfirmationTimestamp?: string;
  smsReminder30Sent?: boolean;
  smsReminder30Timestamp?: string;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface EndUserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  aadhaar: string;
  createdAt: string;
}

export interface UserSession {
  user: EndUserProfile;
  token: string;
}

export interface SlotItem {
  slotMinutes: number;
  slotStartTime: string;
  slotEndTime: string;
  slotFullText: string;
  isBooked: boolean;
  isPast: boolean;
  isAvailable: boolean;
  bookedBy?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: 'owner' | 'staff';
  createdAt: string;
}

export interface AuthSession {
  user: StaffUser;
  token: string;
}

export interface DisruptionStatus {
  isPaused: boolean;
  reasonType: 'none' | 'server_error' | 'maintenance' | 'custom';
  message: string;
  pausedAt?: string;
  resumesAt?: string;
}

export interface AppSettings {
  centerName: string;
  centerAddress: string;
  startHour: number; // default 9
  startMinute: number; // default 0
  endHour: number; // default 16 (4 PM)
  endMinute: number; // default 0
  slotIntervalMinutes: number; // default 10
  countersCount: number; // default 2
  autoAnnounceVoice: boolean;
  disruption?: DisruptionStatus;
}

export interface QueueMeta {
  total: number;
  todayTotal: number;
  nowServing: string | null;
  nowServingItem: TokenRecord | null;
  waitingCount: number;
  completedCount: number;
  disruption?: DisruptionStatus;
}

export interface SMSLogEntry {
  id: string;
  tokenId: string;
  tokenDisplay: string;
  mobile: string;
  recipientName: string;
  type: string;
  message: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'failed';
}
