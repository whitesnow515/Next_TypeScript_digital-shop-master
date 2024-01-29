import React, { useEffect } from "react";

import { useSession } from "next-auth/react";

import { Navbar } from "@components/templates/Navbar";
import { DisplayBehavior } from "@src/types";
import { getSettingClient } from "@util/ClientUtils";
import { debug } from "@util/log";
import Contacts from "./home/Contacts";
import Footer from "./footer";
import Header from "./header";

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = (props: AppWrapperProps) => {
  const session = useSession();
  const [showSupport, setShowSupport] = React.useState(false);
  const [supportLink, setSupportLink] = React.useState("");
  const [behavior, setBehavior] = React.useState<DisplayBehavior>();

  useEffect(() => {
    getSettingClient("showSupport", "show-purchased").then(
      (display: DisplayBehavior) => {
        debug("showSupport", behavior);
        if (display === "never") {
          setBehavior("never");
          return;
        }
        if (display === "show-all") {
          setBehavior("show-all");
          setShowSupport(true);
          return;
        } else {
          setBehavior(display);
        }
      }
    );
  }, []);
  const getSupportLink = (): Promise<string> => {
    return getSettingClient("supportLink", "/support");
  };
  useEffect(() => {
    const loggedIn = session.status === "authenticated";
    const purchased = (session.data as any)?.showSupportButton;
    if (
      (behavior && behavior === "show-purchased" && purchased) ||
      (behavior && behavior === "show-logged-in" && loggedIn)
    ) {
      setShowSupport(true);
    }
  }, [behavior, session]);
  useEffect(() => {
    if (showSupport) {
      getSupportLink().then((link) => {
        localStorage.setItem("supportLink", link);
        setSupportLink(link);
      });
    } else {
      setSupportLink("");
    }
  }, [showSupport]);
  return (
    <div
      className={"min-h-screen mx-auto bg-[#141716]"}
      style={{ maxWidth: "1600px" }}
    >
      <Navbar
        supportLink={supportLink}
        showSupport={true} // legacy support
      />
      {props.children}
      <div className="flex flex-col px-10 lg:px-12 xl:px-[100px] w-full">
        <Contacts />
        <Footer />
      </div>
    </div>
  );
};

export default AppWrapper;
