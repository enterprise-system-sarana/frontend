export type PermissionItem = {
  id: number;
  code: string;
  name: string;
  description: string;
};

export type GroupedPermissionResponse = {
  groupName: string;
  groupCode: string;
  permissions: PermissionItem[];
};
