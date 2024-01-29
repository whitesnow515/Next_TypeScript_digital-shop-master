import { ReactNode } from "react";

type SectionPropsInterface = {
  title?: string;
  description?: string;
  yPadding?: string;
  style?: string;
  children: ReactNode;
  maxW: string;
};

const Section = (props: SectionPropsInterface) => (
  <div
    className={`max-w-screen-${props.maxW} ${
      props.style ? props.style : ""
    } mx-auto`}
  >
    {(props.title || props.description) && (
      <div className="mb-12 text-center">
        {props.title && (
          <h2 className="text-4xl text-gray-900 font-bold">{props.title}</h2>
        )}
        {props.description && (
          <div className="mt-4 text-xl md:px-20">{props.description}</div>
        )}
      </div>
    )}

    {props.children}
  </div>
);

export { Section };
