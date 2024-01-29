import React, { useEffect } from "react";

import Link from "next/link";

import { UploadProgress, UploadState } from "@util/UploadProgress";
import { useRouter } from "next/router";

export interface FormButtonProps {
  children?: React.ReactNode;
  id?: string;
  type?: "submit" | "button" | "reset" | undefined;
  loading?: boolean | undefined;
  loadingText?: string | "Loading...";
  uploadProgress?: UploadProgress;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onClickLoading?: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => Promise<any>;
  loadingStateChange?: (loading: boolean) => void;
  style?: string;
  className?: string;
  href?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  fullHeight?: boolean;
  nextLink?: boolean;
  color?:
    | "primary"
    | "secondary"
    | "red"
    | "green"
    | "yellow"
    | "blue"
    | "gray"
    | string;
  disabled?: boolean;
  modal?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  popover?: string; // popover id
  toggle?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  blankHref?: boolean;
}

const FormButton = ({ fullWidth = true, ...props }: FormButtonProps) => {
  const [loading, setLoading] = React.useState<boolean>(props.loading ?? false);
  const router = useRouter();
  useEffect(() => {
    setLoading(props.loading ?? false);
  }, [props.loading]); // override loading state if props change
  useEffect(() => {
    if (props.loadingStateChange) {
      props.loadingStateChange(loading);
    }
  }, [loading]);

  function onMouseEnter(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (props.onMouseEnter) {
      props.onMouseEnter(e);
    }
    if (props.popover) {
      const popover = document.getElementById(props.popover);
      if (popover) {
        popover.classList.remove("opacity-0", "invisible");
        popover.classList.add("opacity-100", "visible");
      }
    }
  }

  function onMouseLeave(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (props.onMouseLeave) {
      props.onMouseLeave(e);
    }
    if (props.popover) {
      const popover = document.getElementById(props.popover);
      if (popover) {
        popover.classList.remove("opacity-10", "visible");
        popover.classList.add("opacity-0", "invisible");
      }
    }
  }

  function getLoadingText() {
    if (props.loadingText) {
      return props.loadingText;
    }
    if (props.uploadProgress?.state) {
      switch (props.uploadProgress.state) {
        case UploadState.ERROR:
          return "Error!";
        case UploadState.UPLOADING:
          return `Uploading... (${props.uploadProgress.progress}%)`;
        case UploadState.PROCESSING:
          return "Processing...";
        default:
          return "Uploading...";
      }
    }
    return "Loading...";
  }

  function getColor() {
    if (props.disabled) {
      return "gray";
    }
    return props.color || "primary";
  }

  if (loading) {
    const color = getColor();
    return (
      <button
        type={"button"}
        id={props.id}
        disabled
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`${fullWidth ? "w-full" : ""} ${
          props.fullHeight ? "h-full" : ""
        } text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-[#31323D] focus:ring-white duration-300 ${
          props.style || ""
        } ${props.className || ""}`}
      >
        <svg
          aria-hidden="true"
          role="status"
          className="inline w-4 h-4 text-white animate-spin"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="#E5E7EB"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentColor"
          />
        </svg>
        {getLoadingText()}
      </button>
    );
  }

  function getIconStuff() {
    if (props.icon) {
      return (
        <div className="flex items-center justify-center">
          <span className="text-2xl">{props.icon}</span>
          {props.children && <span className="ml-2">{props.children}</span>}
        </div>
      );
    }
    return null;
  }

  function getButton() {
    const color = getColor();
    return (
      <>
        <button
          disabled={props.disabled}
          id={props.id}
          type={props.type}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`${fullWidth ? "" : ""} ${
            props.fullHeight ? "h-full" : ""
          }  outline-none ${
            router.pathname.startsWith("/admin") &&
            "bg-[#FF1F40] text-sm text-center py-[7px] hover:bg-[#BE0924] font-bold rounded-full text-white w-full hover:opacity-[0.8]"
          } font-medium rounded-lg whitespace-nowrap w-[80%] text-sm px-2 py-2 shrink-0 text-center focus:ring-[white] duration-300 ${
            props.style || ""
          } ${props.className || ""} ${
            props.disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={(e) => {
            if (props.onClickLoading) {
              setLoading(true);
              const promise = props.onClickLoading(e);
              if (promise) {
                promise.finally(() => {
                  setLoading(false);
                });
              }
            } else if (props.onClick) {
              props.onClick(e);
            } else if (props.modal) {
              document.getElementById(props.modal)?.classList?.toggle("hidden");
            } else if (props.toggle) {
              props.toggle[1](!props.toggle[0]);
            }
          }}
        >
          {getIconStuff() || props.children}
        </button>
      </>
    );
  }

  if (props.href && props.nextLink) {
    return (
      <>
        <Link href={props.href}>{getButton()}</Link>
      </>
    );
  }
  if (props.href) {
    const otherProps: any = {};
    if (props.blankHref) {
      otherProps.target = "_blank";
    }
    return (
      <>
        <Link href={props.href} {...otherProps}>
          {getButton()}
        </Link>
      </>
    );
  }
  return getButton();
};

export default FormButton;
