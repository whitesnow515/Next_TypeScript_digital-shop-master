"use client";

import React, { useEffect, useRef } from "react";

const Cursor = () => {
  const delay = 3;
  const cursorVisible = useRef(true);
  const cursorEnlarged = useRef(false);

  const endX = useRef(0);
  const endY = useRef(0);
  const x = useRef(0);
  const y = useRef(0);

  const requestRef = useRef(null as any);

  const dot = useRef(null as any);
  const dotOutline = useRef(null as any);

  const toggleCursorVisibility = () => {
    if (!dot.current || !dot.current.style) return;
    if (cursorVisible.current) {
      dot.current.style.opacity = 1;
      dotOutline.current.style.opacity = 1;
    } else {
      dot.current.style.opacity = 0;
      dotOutline.current.style.opacity = 0;
    }
  };

  const toggleCursorSize = () => {
    if (!dotOutline.current || !dot.current.style) return;
    if (cursorEnlarged.current) {
      dot.current.style.transform = "translate(-50%, -50%) scale(0.75)";
      dotOutline.current.style.transform = "translate(-50%, -50%) scale(1.25)";
    } else {
      dot.current.style.transform = "translate(-50%, -50%) scale(1)";
      dotOutline.current.style.transform = "translate(-50%, -50%) scale(1)";
    }
  };

  const mouseOverEvent = () => {
    cursorEnlarged.current = true;
    toggleCursorSize();
  };

  const mouseOutEvent = () => {
    cursorEnlarged.current = false;
    toggleCursorSize();
  };

  const mouseEnterEvent = () => {
    cursorVisible.current = true;
    toggleCursorVisibility();
  };

  const mouseExitEvent = () => {
    cursorVisible.current = false;
    toggleCursorVisibility();
  };

  const mouseMoveEvent = (e: MouseEvent) => {
    if (!dotOutline.current || !dot.current.style) return;
    cursorVisible.current = true;
    toggleCursorVisibility();

    endX.current = e.clientX;
    endY.current = e.clientY;

    const hoveredElement = e.target as HTMLElement;
    const hasHoverCircleClass =
      hoveredElement.classList.contains("hover-circle");

    if (
      hasHoverCircleClass ||
      hoveredElement.tagName === "A" ||
      ["LI", "BUTTON", "H1", "svg", "path"].includes(hoveredElement.tagName) ||
      // @ts-ignore - exists
      hoveredElement.alt === "Avatar"
    ) {
      dot.current.style.backgroundColor = "transparent";

      dotOutline.current.style.width = "35px";
      dotOutline.current.style.height = "35px";
      dotOutline.current.style.borderColor = "#ffffff";
      dotOutline.current.style.backgroundColor = "transparent";
    } else {
      dot.current.style.width = "13px";
      dot.current.style.height = "13px";
      dot.current.style.backgroundColor = "#ffffff";
      dot.current.style.borderColor = "transparent";
      dot.current.style.borderRadius = "50%";

      dotOutline.current.style.width = "40px";
      dotOutline.current.style.height = "40px";
      dotOutline.current.style.borderColor = "transparent";
      dotOutline.current.style.backgroundColor = "transparent";
    }
  };

  const animateDotOutline = () => {
    if (!dotOutline.current || !dot.current.style) return;
    x.current += (endX.current - x.current) / delay;
    y.current += (endY.current - y.current) / delay;

    dot.current.style.left = `${x.current}px`;
    dot.current.style.top = `${y.current}px`;

    dotOutline.current.style.left = `${x.current}px`;
    dotOutline.current.style.top = `${y.current}px`;

    requestRef.current = requestAnimationFrame(animateDotOutline);
  };

  useEffect(() => {
    document.addEventListener("mousedown", mouseOverEvent);
    document.addEventListener("mouseup", mouseOutEvent);
    document.addEventListener("mousemove", mouseMoveEvent);
    document.addEventListener("mouseenter", mouseEnterEvent);
    document.addEventListener("leave", mouseExitEvent);

    animateDotOutline();

    return () => {
      document.removeEventListener("mousedown", mouseOverEvent);
      document.removeEventListener("mouseup", mouseOutEvent);
      document.removeEventListener("mousemove", mouseMoveEvent);
      document.removeEventListener("mouseenter", mouseEnterEvent);
      document.removeEventListener("leave", mouseExitEvent);

      cancelAnimationFrame(requestRef.current);
    };
  });

  return (
    <div
      id="cursor-container"
      className="hidden md:block relative top-0 z-[999]"
    >
      <div ref={dotOutline} className="cursor-dot-outline"></div>
      <div ref={dot} className="cursor-dot"></div>
    </div>
  );
};

export default Cursor;
