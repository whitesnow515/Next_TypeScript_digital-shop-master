import React, { useMemo } from "react";

import { useSession } from "next-auth/react";

import { debug } from "@util/log";
import { adminRoles, allRoles, Role, sessionHasRoles } from "@util/Roles";

interface RequireRolePropsInterface {
  roles?: Role | Role[];
  minWeight?: number;
  requireAll?: boolean;
  admin?: boolean;
  children: React.ReactNode;
  noPermission?: React.ReactNode;
}

const RequireRole = ({
  requireAll = false,
  ...props
}: RequireRolePropsInterface) => {
  const session = useSession();
  const hasPerm = useMemo(() => {
    if (props.admin) return sessionHasRoles(session, adminRoles, false);
    const roles: typeof props.roles = props.roles || [];
    if (
      props.minWeight &&
      props.minWeight > 0 &&
      (!roles || (roles as []).length === 0)
    ) {
      // if minWeight is set, and roles is not set, then we need to add all roles with a weight >= minWeight
      allRoles.forEach((role) => {
        if (role.priority >= (props.minWeight || 0))
          (roles as any[]).push(role);
      });
    }
    const c = sessionHasRoles(session, roles, requireAll);
    debug({ c, session, props, requireAll });
    return c;
  }, [session, props, requireAll]);
  return (
    <>
      {hasPerm ? (
        <>{props.children}</>
      ) : (
        <>{props.noPermission ? props.noPermission : null}</>
      )}
    </>
  );
};

export default RequireRole;
