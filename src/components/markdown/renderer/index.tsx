import React from "react";

import { MergeComponents } from "@mdx-js/react/lib";
import { MDXComponents } from "mdx/types";

const mdxComponents: MDXComponents | MergeComponents = {
  h1: (props) => <h1 className={"text-2xl mt-2.5 font-bold"} {...props} />,
  h2: (props) => <h2 className={"text-xl font-bold"} {...props} />,
  h3: (props) => <h3 className={"text-lg font-bold"} {...props} />,
  h4: (props) => <h4 className={"text-base font-bold"} {...props} />,
  h5: (props) => <h5 className={"text-sm font-bold"} {...props} />,
  h6: (props) => <h6 className={"text-xs font-bold"} {...props} />,
  ol: (props) => {
    return (
      <ol
        className={"list-decimal list-inside"}
        style={{ paddingLeft: "1.5rem" }}
        {...props}
      />
    );
  },
  ul: (props) => {
    return (
      <ul
        className={"list-disc list-inside"}
        style={{ paddingLeft: "1.5rem" }}
        {...props}
      />
    );
  },
  code: (props) => {
    // if it's multiline, use a code block
    try {
      // @ts-ignore
      if (props.children && props.children.includes("\n")) {
        return (
          <>
            {/* @ts-ignore */}
            <pre
              className={"bg-[#141716] p-1 rounded"}
              style={{ fontFamily: "monospace" }}
              {...props}
            />
          </>
        );
      }
    } catch (ignored) {
      /* empty */
    }
    return (
      <code
        className={"bg-[#141716] p-1 rounded"}
        style={{ fontFamily: "monospace" }}
        {...props}
      />
    );
  },
  table: (props) => {
    return (
      <table
        className={"table-auto border-collapse border border-gray-300"}
        {...props}
      />
    );
  },
  thead: (props) => {
    return <thead className={"border border-gray-300"} {...props} />;
  },
  tbody: (props) => {
    return <tbody className={"border border-gray-300"} {...props} />;
  },
  tr: (props) => {
    return <tr className={"border border-gray-300"} {...props} />;
  },
  th: (props) => {
    return <th className={"border border-gray-300 p-2"} {...props} />;
  },
  td: (props) => {
    return <td className={"border border-gray-300 p-2"} {...props} />;
  },
};

export default mdxComponents;
