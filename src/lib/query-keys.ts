export const queryKeys = {
  projects: (userId: string) => ["projects", userId] as const,
  projectTasks: (userId: string, projectId: string) =>
    ["tasks", userId, projectId] as const,
  tasks: (
    userId: string,
    projectId: string,
    filters: { search: string; department: string; page: number },
  ) => [...queryKeys.projectTasks(userId, projectId), "list", filters] as const,
  dependencyOptions: (userId: string, projectId: string) =>
    [
      ...queryKeys.projectTasks(userId, projectId),
      "dependency-options",
    ] as const,
  members: (userId: string, projectId: string) =>
    ["members", userId, projectId] as const,
  audit: (userId: string, taskId: string) => ["audit", userId, taskId] as const,
};
