export type EmployeeStatus = 'active' | 'pending' | 'pending_offboarding' | 'offboarded' | 'on_pip' | 'suspended';

export type OffboardingReason =
  | 'resignation'
  | 'termination'
  | 'retirement'
  | 'internship_end'
  | 'contract_end'
  | 'layoff'
  | 'other';

export const offboardingReasonLabels: Record<OffboardingReason, string> = {
  resignation: 'Resignation',
  termination: 'Termination',
  retirement: 'Retirement',
  internship_end: 'Internship Ended',
  contract_end: 'Contract Ended',
  layoff: 'Layoff',
  other: 'Other',
};

export interface EmployeeAccess {
  applicationId: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  departmentId?: string;
  role: string;
  jobTitleId?: string;
  roleIds: string[]; 
  status: EmployeeStatus;
  startDate: Date;
  endDate?: Date;
  archivedAt?: Date;
  manager?: string;
  managerId?: string;
  access: EmployeeAccess[];
  offboardingReason?: OffboardingReason;
  activationPin?: string;
  pinExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LifecycleTaskType = 'onboarding' | 'offboarding';

export interface LifecycleTask {
  id: string;
  label: string;
  description?: string;
  type: LifecycleTaskType;
  employeeId: string;
  assigneeId?: string; 
  assigneeName?: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  isEmployeeTask: boolean;
  icon: string;
  createdAt: Date;
}
