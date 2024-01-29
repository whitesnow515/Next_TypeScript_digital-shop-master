import React from "react";

import MarkdownEditor from "@components/admin/MarkdownEditor";

const Test = () => {
  const [value, setValue] = React.useState<string | undefined>("");
  return (
    <div className={"text-white"}>
      <MarkdownEditor value={value || ""} onChange={setValue} />
    </div>
  );
};

export default Test;
