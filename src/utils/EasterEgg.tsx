import { useEffect, useState } from "react";

import { useRerenderHelper } from "@util/ReRenderHelper";

const ENABLE_EASTER_EGGS = true;

export function isCCPDay() {
  if (!ENABLE_EASTER_EGGS) return false;
  // sept 30
  const date = new Date();
  const ccp = date.getMonth() === 8 && date.getDate() === 30;
  return ccp && Math.random() < 0.2; // 20% chance of being ccp day
}

let ccpDay = isCCPDay();

export function barrelRoll({ rerender }: { rerender: () => void }) {
  if (!ENABLE_EASTER_EGGS) return;
  ccpDay = true;
  rerender();
  const a = "-webkit-"; // vendor prefix for Chrome, Safari
  const b = "transform:rotate(1turn);"; // the CSS for rotating 360deg
  const c = "transition:4s;"; // the CSS for making the rotation last 4 seco
  const d = "overflow: hidden;";

  document.head.innerHTML += `<style id="barrel-roll">body{${a}${b}${a}${c}${b}${c}${d}`; // adding a style tag to the <head> // the combined CSS in the style tag
  /*
  This actually generates a string that looks like:
  "<style>body{-webkit-transform:rotate(1turn);-webkit-transition:4s;transform:rotate(1turn);transition(4s);"
  Which obviously is lacking a closing tag and a closing bracket, but luckily browsers are smart enough to figure this out.
  It also only has vendor prefixes for WebKit. That's because it turns out Firefox and Opera work just fine without the prefixes here.
  */
  setTimeout(() => {
    // remove the style tag after 4 seconds
    document.getElementById("barrel-roll")?.remove();
  }, 4000);
}

export function bootstrap({ rerender }: { rerender: () => void }) {
  // listen for konami code, then run barrelRoll()
  const keyList = Array(10); // konami code
  document.addEventListener("keydown", (event) => {
    // Push the key to the list
    keyList.push(event.key);
    // Remove the first key from the list
    keyList.shift();
    // Check if the key list matches the konami code
    if (
      keyList.join("") ===
      "ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba"
    ) {
      if (typeof window !== "undefined") barrelRoll({ rerender });
    }
  });
}

export function EasterEgg() {
  const rerender = useRerenderHelper();
  useEffect(() => {
    bootstrap({ rerender });
  }, [rerender]);
  return <></>;
}

export function getPriceStr(price: any) {
  if (ccpDay) return `${price} Social Credits`;
  return `$${price}`;
}

export function Price({ price }: { price: any }) {
  const [ourPrice, setPrice] = useState(price);
  useEffect(() => {
    setPrice(getPriceStr(price));
  }, [price]);
  // if we are rerendering and ccpday is true, rerender the price
  if (ccpDay) return <>{getPriceStr(price)}</>;
  return <>{ourPrice}</>;
}

export function getPrice(price: any) {
  return <Price price={price} />;
}
