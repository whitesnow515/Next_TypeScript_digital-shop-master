import React, { useEffect } from "react";

import { signOut } from "next-auth/react";

const Signout = () => {
  useEffect(() => {
    signOut().then(() => {
      window.location.href = "/";
    });
  });
  return (
    <div>
      <span className={"text-white"}>Signing out...</span>
    </div>
  );
};

export default Signout;
