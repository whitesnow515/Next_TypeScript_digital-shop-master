import React from "react";

import { Crisp } from "crisp-sdk-web";
import { useSession } from "next-auth/react";

import { DisplayBehavior } from "@src/types";
import { getSettingClient } from "@util/ClientUtils";
import { error } from "@util/log";

interface Props {
  forceShow?: boolean;
  openChat?: boolean;
  showUpdate?: (show: boolean) => void;
}

const CrispComponent = (props: Props) => {
  const session = useSession();
  const [show, setShow] = React.useState(false);
  const [behavior, setBehavior] =
    React.useState<DisplayBehavior>("show-purchased");
  const [crispId, setCrispId] = React.useState<string>("" as any);
  React.useEffect(() => {
    getSettingClient("showCrisp", "show-purchased").then(
      (showCrisp: DisplayBehavior) => {
        setBehavior(showCrisp);
      }
    );
    getSettingClient("crispId", "").then((id) => {
      setCrispId(id);
    });
  }, []);
  React.useEffect(() => {
    if (props.forceShow || behavior === "show-all") {
      setShow(true);
      return;
    }
    if (behavior === "never") {
      setShow(false);
      return;
    }
    const loggedIn = session.status === "authenticated";
    const purchased = (session.data as any)?.showSupportButton;
    if (behavior === "show-purchased") {
      if (purchased) {
        setShow(true);
      } else {
        setShow(false);
      }
    } else if (behavior === "show-logged-in") {
      setShow(loggedIn);
    }
  }, [session]);
  React.useEffect(() => {
    window.showCrisp = show;
    if (props.showUpdate) {
      props.showUpdate(show);
    }
    try {
      if (show) {
        Crisp.configure(crispId);
        // @ts-ignore
        window.$crisp.push(["do", "chat:show"]);
        if (props.openChat) {
          // @ts-ignore
          window.$crisp.push(["do", "chat:open"]);
        }
        // @ts-ignore
      } else if (window.$crisp) {
        // @ts-ignore
        window.$crisp.push(["do", "chat:hide"]);
      }
    } catch (e) {
      error(e);
    }
  }, [show]);
  React.useEffect(() => {
    if (props.openChat) {
      try {
        // @ts-ignore
        window.$crisp.push(["do", "chat:open"]);
      } catch (e) {
        error(e);
      }
    }
  }, [props.openChat]);
  return null;
};

export default CrispComponent;
