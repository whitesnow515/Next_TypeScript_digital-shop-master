import React from "react";
import { UserIcon } from "@components/ui/icon";

const MuiAvatar = (props: any) => {
  return (
    <div
      className="flex hover:scale-110 transition delay-150 duration-300 ease-in-out items-center justify-center"
      {...props}
    >
      <UserIcon />
    </div>
  );
};

export default MuiAvatar;
