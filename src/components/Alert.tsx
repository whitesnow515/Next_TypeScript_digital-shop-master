import React, { useEffect } from "react";

export interface AlertProps {
  type: "success" | "error" | "info" | "warning";
  /** override the default dismiss button */
  onDismiss?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  dismissible?: boolean;
  children: React.ReactNode;
  button?: React.ReactNode;
  style?: string;
  modifyQueryOnDismiss?: boolean;
  padding?: boolean;
  className?: string;
}

const Alert = ({
  type,
  onDismiss,
  dismissible,
  children,
  button,
  style,
  modifyQueryOnDismiss = true,
  padding = true,
  className,
}: AlertProps) => {
  const [dismissed, setDismissed] = React.useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get(type);
    if (param) {
      // check if urldecoded param equals children (child should be string only)
      if (decodeURIComponent(param) === children) {
        url.searchParams.delete(type);
        window.history.pushState({}, "", url.toString());
      }
    }
  }, []);
  return (
    <>
      {dismissed ? null : (
        <>
          <div
            className={`px-4 flex justify-between items-center ${className} ${
              padding && "mt-4 mb-4"
            } py-3 rounded relative border-2 text-white ${
              // eslint-disable-next-line no-nested-ternary
              type === "success"
                ? "border-green-500"
                : // eslint-disable-next-line no-nested-ternary
                type === "error"
                ? "border-[#ffffff]"
                : type === "info"
                ? "border-gray-100"
                : "border-orange-500"
            } ${style}`}
            role="alert"
          >
            <strong>{children}</strong>
            {dismissible && !button && (
              <span
                className="absolute top-1/2 transform -translate-y-1/2 right-0 px-4 py-3 hover-circle hover:cursor-pointer"
                onClick={(e) => {
                  if (modifyQueryOnDismiss) {
                    const url = new URL(window.location.href);
                    const param = url.searchParams.get(type);
                    if (param) {
                      // check if urldecoded param equals children (child should be string only)
                      if (decodeURIComponent(param) === children) {
                        url.searchParams.delete(type);
                        window.history.pushState({}, "", url.toString());
                      }
                    }
                  }
                  if (onDismiss) {
                    onDismiss(e);
                    return;
                  }
                  setDismissed(true);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  color={"white"}
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </span>
            )}
            {button && <div className={""}>{button}</div>}
          </div>
        </>
      )}
    </>
  );
};

export default Alert;
