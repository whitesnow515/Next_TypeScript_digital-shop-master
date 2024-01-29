import React, { useState } from "react";

import Avatar from "@components/avatar/Avatar";

interface AvatarUploaderProps {
  defaultAvatar: string;

  onChange?: (e: any) => void;

  className?: string;
}

function AvatarUploader({
  defaultAvatar = "/assets/images/profile.png",
  ...props
}: AvatarUploaderProps) {
  const [avatar, setAvatar] = useState<any>(defaultAvatar);

  const handleAvatarUpload = (e: any) => {
    const file = e.target.files[0];
    setAvatar(URL.createObjectURL(file));
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className={props.className}>
      <label htmlFor="avatarUpload">
        <Avatar
          src={avatar}
          className={"hover-circle hover:cursor-pointer"}
          style={{
            width: "42px",
            height: "42px",
          }}
        />
      </label>
      <input
        id="avatarUpload"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          handleAvatarUpload(e);
        }}
      />
    </div>
  );
}

export default AvatarUploader;
