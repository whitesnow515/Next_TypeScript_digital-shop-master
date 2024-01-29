import React from "react";

import "react-markdown-editor-lite/lib/index.css";

import { evaluate } from "@mdx-js/mdx";
import { MDXProvider, useMDXComponents } from "@mdx-js/react";
import dynamic from "next/dynamic";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";

import mdxComponents from "@components/markdown/renderer";

const MdEditor = dynamic(() => import("react-markdown-editor-lite"), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor = (props: MarkdownEditorProps) => {
  return (
    <div>
      {/* @ts-ignore */}
      <MdEditor
        value={props.value}
        style={{ height: "500px" }}
        renderHTML={async (text) => {
          const Markdown = (
            await evaluate(
              text || "",
              /* @ts-ignore */
              {
                ...runtime,
                useMDXComponents,
                rehypePlugins: [remarkGfm],
                useDynamicImport: true,
              }
            )
          ).default;
          return (
            <MDXProvider components={mdxComponents}>
              {/* @ts-ignore */}
              <Markdown />
            </MDXProvider>
          );
        }}
        onChange={(html) => {
          props.onChange(html?.text || "");
        }}
      />
    </div>
  );
};

export default MarkdownEditor;
