export class Role {
  static USER = new Role("user", "User", 0);

  static TRIAL_SUPPORT = new Role("trial_support", "Trial Support", 1);

  static SUPPORT = new Role("support", "Support", 2);

  static ADMIN = new Role("admin", "Admin", 3);

  static SUPER_ADMIN = new Role("super_admin", "Super Admin", 4);

  constructor(
    public name: string,
    public displayName: string,
    public priority: number
  ) {
    this.name = name;
    this.displayName = displayName;
    this.priority = priority;
  }

  isAdmin() {
    return this.name === "admin" || this.name === "super_admin";
  }
}

export const allRoles: Role[] = [
  Role.USER,
  Role.TRIAL_SUPPORT,
  Role.SUPPORT,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];
export const allRolesNames = allRoles.map((r) => r.name);
export const allRolesDisplayNames = allRoles.map((r) => r.displayName);
export const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN];
export const supportRoles = [
  Role.TRIAL_SUPPORT,
  Role.SUPPORT,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];
export const supportRolesExceptTrial = [
  Role.SUPPORT,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];
export const adminRolesNames = adminRoles.map((r) => r.name);
export const supportRolesNames = supportRoles.map((r) => r.name);

export function hasAuthorityOverRoleObj(oneRoles: Role[], twoRoles: Role[]) {
  const onePriority = Math.max(...oneRoles.map((r) => r.priority));
  const twoPriority = Math.max(...twoRoles.map((r) => r.priority));
  return onePriority > twoPriority;
}

export function hasAuthorityOver(one: string[], two: string[]) {
  const oneRoles: Role[] = allRoles.filter((r) => one.includes(r.name));
  const twoRoles: Role[] = allRoles.filter((r) => two.includes(r.name));
  return hasAuthorityOverRoleObj(oneRoles, twoRoles);
}

export function getRole(role: string) {
  return allRoles.find((r) => r.name === role || r.displayName === role);
}

export function sessionHasRole(session: any, role: string) {
  if (!session || session.status !== "authenticated" || !session?.data?.roles) {
    return false;
  }
  const { roles } = session.data;
  return roles.some((r: string) => r === role);
}

export function isAdminSession(session: any) {
  // debug("isAdminSession", session);
  /*
  if (!session || session.status !== "authenticated" || !session?.data?.roles) {
    return false;
  }
  const { roles } = session.data;
  return roles.some((r: string) => {
    const fullRole = getRole(r);
    return fullRole?.isAdmin();
  });
   */
  return sessionHasRole(session, Role.ADMIN.name);
}

export function sessionHasRoles(
  session: any,
  roles: string[] | string | Role | Role[] | undefined,
  requireAll: boolean // do we require all roles or just one
) {
  if (
    !session ||
    session.status !== "authenticated" ||
    !session?.data?.roles ||
    !roles
  ) {
    return false;
  }
  const { roles: sessionRoles } = session.data;
  if (typeof roles === "string") {

    roles = [roles];
  }
  if (roles instanceof Role) {
    roles = [roles.name];
  }
  if (roles instanceof Array && roles[0] instanceof Role) {
    roles = (roles as Role[]).map((r: Role) => r.name);
  }
  if (requireAll) {
    return (roles as Role[]).every((r: Role) => sessionRoles.includes(r));
  }
  return roles.some((r) => sessionRoles.includes(r));
}

export function hasRoles(
  userRoles: string[] | string | Role | Role[] | undefined,
  requiredRoles: string[] | string | Role | Role[] | undefined,
  requireAll: boolean // do we require all roles or just one
) {
  if (!userRoles || !requiredRoles) {
    return false;
  }
  if (typeof userRoles === "string") {
    userRoles = [userRoles];
  }
  if (typeof requiredRoles === "string") {
    requiredRoles = [requiredRoles];
  }
  if (userRoles instanceof Role) {
    userRoles = [userRoles.name];
  }
  if (requiredRoles instanceof Role) {
    requiredRoles = [requiredRoles.name];
  }
  if (Array.isArray(userRoles) && userRoles[0] instanceof Role) {
    userRoles = (userRoles as Role[]).map((r: Role) => r.name);
  }
  if (Array.isArray(requiredRoles) && requiredRoles[0] instanceof Role) {
    requiredRoles = (requiredRoles as Role[]).map((r: Role) => r.name);
  }
  const userRolesArr = userRoles as string[];
  if (requireAll) {
    return (requiredRoles as string[]).every((r) => {
      return userRolesArr.includes(r);
    });
  }
  return (requiredRoles as string[]).some((r) => {
    return userRolesArr.includes(r);
  });
}

export function getHighestRole(roles: Role[] | string[]): Role {
  // get highest priority role
  if (!roles) {
    return Role.USER;
  }
  let actualRoles: Role[];
  if (typeof roles[0] === "string") {
    actualRoles = (roles as string[]).map((r) => getRole(r)) as Role[];
  } else {
    actualRoles = roles as Role[];
  }
  const highestRole = Math.max(...actualRoles.map((r) => r.priority));
  return allRoles.find((r) => r.priority === highestRole) || Role.USER;
}
