import { MouseEventHandler } from "react";

import Image from "next/image";

import MuiAvatar from "@components/mui/MuiAvatar";
import profile from "@src/../public/assets/images/profile.png";

interface AvatarProps {
  src: string | undefined;
  onClick?: MouseEventHandler<HTMLImageElement>;

  className?: string;
  style?: React.CSSProperties;
  useVanillaImage?: boolean;
  useMuiAvatar?: boolean;
  id?: string;

  width?: number;
  height?: number;

  otherProps?: any;
  onHoverEnter?: (e: MouseEventHandler<HTMLImageElement>) => void;
  onHoverLeave?: (e: MouseEventHandler<HTMLImageElement>) => void;
}

const Avatar = (props: AvatarProps) => {
  function getSrc() {
    if (!props.src) return profile;
    if (props.src.startsWith("http") || props.src.indexOf("/") !== -1) {
      return props.src;
    }
    return `/api/assets/img/${props.src}/`;
  }

  function getImg() {
    if (props.useVanillaImage) {
      return (
        <img
          src={getSrc()}
          className={`rounded-full hover-circle p-2 ${props.className}`}
          onClick={props.onClick}
          style={props.style}
          alt={"Avatar"}
          width={props.width || 40}
          height={props.height || 40}
          id={props.id}
          onMouseEnter={props.onHoverEnter}
          onMouseLeave={props.onHoverLeave}
          {...props.otherProps}
        />
      );
    }
    if (props.useMuiAvatar) {
      return (
        <div className={"hover-circle"}>
          <MuiAvatar
            className={`rounded-full cursor-pointer hover-circle ${props.className}`}
            onClick={props.onClick}
            style={props.style}
            onMouseEnter={props.onHoverEnter}
            onMouseLeave={props.onHoverLeave}
            alt={"Avatar"}
            id={props.id}
            src={getSrc()}
            {...props.otherProps}
          />
        </div>
      );
    }
    return (
      <div>
        <Image
          src={getSrc()}
          width={props.width || 40}
          height={props.width || 40}
          className={`rounded-full cursor-pointer hover-circle ${props.className}`}
          onClick={props.onClick}
          style={props.style}
          onMouseEnter={props.onHoverEnter}
          onMouseLeave={props.onHoverLeave}
          alt={"Avatar"}
          {...props.otherProps}
        />
      </div>
    );
  }

  return getImg();
};

export default Avatar;
