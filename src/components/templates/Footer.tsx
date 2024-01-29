import React, { useEffect, useRef, useState } from "react";

import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import CrispComponent from "@components/CrispComponent";
import { AppConfig } from "@util/AppConfig";

import { Section } from "../layout/Section";
import Link from "next/link";

type FooterProps = {
  openCrispChat?: boolean;
  disableCrisp?: boolean;
  supportLink?: string;
  crispShowUpdate?: (show: boolean) => void;
};
const Footer = (props: FooterProps) => {
  const session = useSession();
  const [creditData, setCreditData] = useState<any>(null);
  const divRef = useRef(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    function swalHtml(html: any) {
      Swal.fire({
        html,
      });
    }

    // @ts-ignore
    window.swalHtml = swalHtml;

    const url =
      "https://pub-8059abf74ace4abba0cb358c6b9b2db2.r2.dev/projects/karma/footer";
    const data = fetch(url)
      .then((res) => res.text())
      .catch(() => {
        // silent fail
      });
    data.then((res) => {
      setCreditData(res);
    });
  }, []);
  useEffect(() => {
    if (!isFirstRender.current || !creditData) {
      return;
    }
    isFirstRender.current = false;

    const slotHtml = document
      .createRange()
      .createContextualFragment(creditData); // Create a 'tiny' document and parse the html string
    // @ts-ignore
    divRef.current.innerHTML = ""; // Clear the container
    // @ts-ignore
    divRef.current.appendChild(slotHtml); // Append the new content
  }, [creditData, divRef]);
  return (
      <div className={'text-center text-white absolute lg:bottom-[40px] lg:left-[50%] lg:bottom-[2%] max-lg:pb-6 max-lg:relative'}>
        <div className={'font-semibold text-lg'}>WHOISWHO</div>
        <div className={'flex items-center justify-center mt-2 gap-3'}>
          <Link href={'/tos'}>
            <div>TOS</div>
          </Link>
          <Link href={'/'}>
            <div>Products</div>
          </Link>
          <Link href={'/login'}>
            <div>Sign in</div>
          </Link>
          <Link href={'/login'}>
            <div>Sign up</div>
          </Link>
        </div>
        <div className={'text-gray-400 text-center mt-2 text-sm'}>Copyright 2023 WHOISWHO</div>
      </div>
  );
};

export { Footer };
