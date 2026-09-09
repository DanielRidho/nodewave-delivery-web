export type Role = "PRODUCT_MANAGER" | "INTERNAL_TEAM" | "CLIENT_GUEST";
export type Department =
  | "PRODUCT"
  | "UI_UX"
  | "FRONTEND"
  | "BACKEND"
  | "CLIENT";
export type TaskStatus = "TODO" | "BLOCKED" | "IN_PROGRESS" | "DONE";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: Department;
  clientProjectId: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  accessCode?: string;
  metrics: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    completionPercentage: number;
  };
};

export type Member = {
  id: string;
  name: string;
  email: string;
  department: Department;
  avatarUrl: string | null;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Exclude<TaskStatus, "BLOCKED">;
  effectiveStatus: TaskStatus;
  clientVisible: boolean;
  dueDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  assignee?: Member | null;
  dependencies: Array<{
    id: string;
    taskId: string;
    title: string;
    status: string;
  }>;
  blockedBy: Array<{ id: string; title: string }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }>;
  comments?: Array<{
    id: string;
    body: string;
    createdAt: string;
    user: Pick<Member, "id" | "name" | "department">;
  }>;
  permissions?: {
    canEditCore: boolean;
    canDelete: boolean;
    canAddDependency: boolean;
    canAttach: boolean;
    canStartWhenReady: boolean;
    canStart: boolean;
    canComplete: boolean;
    blockedReason: string | null;
  };
};

export type PaginationMeta = {
  page: number;
  rows: number;
  total: number;
  totalPages: number;
};

export type ApiEnvelope<T, TMeta = Record<string, unknown>> = {
  success: true;
  data: T;
  meta?: TMeta;
};
