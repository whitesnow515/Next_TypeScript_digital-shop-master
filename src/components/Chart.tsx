import React from "react";

import dynamic from "next/dynamic";
import { Props } from "react-apexcharts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const Chart = (props: Props) => {
  const newProps: Props = {
    ...props,
    options: {
      ...props.options,
      chart: {
        ...props.options?.chart, // this may have issues, have to investigate further later
        foreColor: "white",
      },
      tooltip: {
        ...props.options?.tooltip,
        theme: "dark",
      },
    },
    theme: {
      ...props?.theme,
      mode: "dark",
      palette: "palette1",
    },
  };
  // A util component to render the chart as it is not SSR compatible
  return (
    <div
      style={{
        color: "black",
      }}
    >
      {/* @ts-ignore */}
      <ApexChart {...newProps} />
    </div>
  );
};

export default Chart;
