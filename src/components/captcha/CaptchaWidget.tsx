import React, { useEffect } from "react";

import { error, log } from "@util/log";

interface CaptchaWidgetProps {
  captchaKey: string;

  id?: string;
  autoRender?: boolean;
  onVerify?: (token: string) => void;

  className?: string;
  flexCenter?: boolean;

  dummy?: any; // dummy prop to force re-render
}

const CaptchaWidget = ({
  captchaKey,
  id,
  autoRender = true,
  className,
  flexCenter = false,
  onVerify,
  dummy,
}: CaptchaWidgetProps) => {
  function getId() {
    return id || "captcha";
  }

  useEffect(() => {
    // run on client side
    function render() {
      if (!autoRender) return;
      log(
        "Initializing captcha... Note that logs about only one captcha being rendered are normal."
      );
      try {
        window.turnstile.render(document.getElementById(getId()), {
          sitekey: captchaKey,
          callback: (token: string) => {
            // set the token globally
            window.captchaToken = token;
            if (onVerify) onVerify(token);
          },
        });
      } catch (e) {
        error("Error rendering captcha", e);
        setTimeout(() => {
          log("Retrying captcha...");
          render();
        }, 1000);
      }
    }

    render();
  }, [dummy]);
  // if (process.env.USE_CAPTCHA === "false") return null;
  return (
    <>
      <div
        // className={autoRender ? "cf-turnstile" : ""}
        id={getId()}
        data-sitekey={captchaKey}
        data-theme={"dark"}
        className={className + (flexCenter ? " flex justify-center" : "")}
      >
        {" "}
      </div>
    </>
  );
};

export default CaptchaWidget;
