import React from "react";
import { PieChart } from "react-minimal-pie-chart";

function percentage(partialValue: number, totalValue: number) {
  return (100 * partialValue) / totalValue;
}
export default function Pie({ data }: any) {
  let sum = data
    .map((x: any) => x.value)
    ?.reduce((a: number, b: number) => a + b, 0);
  return (
    <>
      <div className={" mb-6  mt-4"}>
        {data
          .sort(function (a: any, b: any) {
            return b.value - a.value;
          })
          .map((x: any) => (
            <div className={"flex items-center gap-4"}>
              <div
                style={{ background: x.color }}
                className={"w-[24px] h-[7px]"}
              />
              {x.label} - ${x.value.toFixed(2)} -{" "}
              {percentage(x.value, sum).toFixed(2)}%
            </div>
          ))}
      </div>
      <div className={"w-[70%] m-auto"}>
        <PieChart
          data={data}
          label={({ dataEntry }) =>
            (dataEntry.percentage as number) > 10
              ? `${dataEntry.percentage.toFixed(2)}%`
              : ""
          }
          labelStyle={{ fontSize: "8px" }}
          labelPosition={60}
          // data={[
          //     { title: 'One', value: 10, color: '#E38627' },
          //     { title: 'Two', value: 15, color: '#C13C37' },
          //     { title: 'Three', value: 20, color: '#6A2135' },
          // ]}
        />
      </div>
    </>
  );
}
