import { RefObject, useEffect, useMemo, useState } from "react";

import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { error, warn } from "@util/log";
import { adminRolesNames, supportRolesNames } from "@util/Roles";

export const ReactSwal = withReactContent(Swal);

export function isAdmin(data: any) {
  const roles: string[] = data?.roles;
  if (!roles) return false;
  // check if any of the roles are in the Role.adminRolesNames array
  return roles.some((role: string) => adminRolesNames.includes(role));
}

export function isStaff(data: any) {
  const roles: string[] = data?.roles;
  if (!roles) return false;
  return roles.some((role: string) => supportRolesNames.includes(role));
}

export async function getSettingClient(
  key: string,
  ...defaultValue: any
): Promise<any> {
  return new Promise(async (resolve) => {
    axios
      .get(`/api/admin/settings/get/${key}/`)
      .then((res) => {
        if (res.data.success) {
          resolve(res.data.data);
        }
        resolve(defaultValue ?? null);
      })
      .catch((err) => {
        warn(err);
        resolve(defaultValue ?? null);
      });
  });
}

export async function setSettingClient(
  key: string,
  value: any
): Promise<boolean> {
  try {
    const res = await axios.post(`/api/admin/settings/set/`, { key, value });
    const { data } = res;
    return !!data.success;
  } catch (err) {
    error(err);
    throw err;
  }
}
export function getReason(
  onComplete: (reason: string) => Promise<void>,
  optional = false
) {
  return Swal.fire({
    title: "Please enter reason",
    input: "text",
    showCancelButton: true,
    confirmButtonText: "Submit",
    showLoaderOnConfirm: true,
    preConfirm: (reason) => {
      if (!reason && !optional) {
        Swal.showValidationMessage("Reason is required");
        return () => {
          return Promise.resolve();
        };
      }
      return onComplete(reason);
    },
  });
}

export default function useOnScreen(ref: RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState<boolean>(false);

  const observer = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new IntersectionObserver(([entry]) =>
      setIntersecting(entry?.isIntersecting || false)
    );
  }, [ref]);

  useEffect(() => {
    if (ref.current) {
      observer?.observe(ref.current);
      return () => observer?.disconnect();
    }
    return () => {};
  }, [observer, ref]);

  return isIntersecting;
}
