import { Types } from "mongoose";

import { Ban } from "@app-types/models/ban";

export interface UserInterface {
  _id: Types.ObjectId;
  __v: string;
  username: string | null;
  lowercaseUsername: string | null;
  email: string | null;
  password: string | null;
  emailVerified: Date | null;
  image: string | null; // image id
  roles: string[] | [];
  showSupportButton: boolean;
  banned: Ban | null;
  note: string | null;
  balance: number;
  verified: boolean;
}

export function toJwtObject(user: any) {
  const id: string = user._id.toString();
  // remove the password from the object
  return {
    id,
    username: user.username,
    name: user.username,
    email: user.email,
    roles: user.roles,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
    image: user.image ?? "/assets/images/profile.png",
    showSupportButton: user.showSupportButton,
    banned: user.banned,
  };
}

export type UserSession = {
  id: string;
  username: string;
  name: string;
  email: string;
  picture: string;
  sub: string;
  roles: string[];
  emailVerified: string;
  image: string;
  iat: number;
  exp: number;
  jti: string;
};
