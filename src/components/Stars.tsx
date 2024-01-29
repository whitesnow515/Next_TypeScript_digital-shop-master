import React, { useEffect, useRef, useState } from "react";

import { PointMaterial, Points } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as random from "maath/random/dist/maath-random.cjs";

const Stars = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnabled(localStorage.getItem("stars") === "true");
    }

    const handleStorageEvent = (e: Event) => {
      setEnabled(localStorage.getItem("stars") === "true" ?? true);
    };
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [enabled]);

  if (!enabled) return <></>;

  const StarsObject = (props: any) => {
    const [globalCoords, setGlobalCoords] = useState({ x: 0.1, y: 0.1 });

    useEffect(() => {
      const handleWindowMouseMove = (e: MouseEvent) => {
        setGlobalCoords({
          x:
            // eslint-disable-next-line no-nested-ternary
            window.innerWidth >= 768
              ? e.screenX / window.innerWidth >= 0.5
                ? e.screenX / window.innerWidth - 0.5
                : -(0.5 - e.screenX / window.innerWidth)
              : 0.1,
          y:
            // eslint-disable-next-line no-nested-ternary
            window.innerWidth >= 768
              ? (window.innerHeight - e.screenY + 100) / window.innerHeight >=
                0.5
                ? (window.innerHeight - e.screenY + 100) / window.innerHeight -
                  0.5
                : -(
                    0.5 -
                    (window.innerHeight - e.screenY + 100) / window.innerHeight
                  )
              : 0.1,
        });
      };
      window.addEventListener("mousemove", handleWindowMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleWindowMouseMove);
      };
    }, []);

    const ref = useRef(null as any);
    const [sphere] = useState(() =>
      random.inSphere(new Float32Array(5000), { radius: 1.5 })
    );
    useFrame((_state, delta) => {
      ref.current!.rotation.x += (delta * globalCoords.x) / 2;
      ref.current!.rotation.y += (delta * globalCoords.y) / 2;
    });

    return (
      <group rotation={[0, 0, Math.PI / 2]}>
        <Points
          ref={ref}
          positions={sphere}
          stride={3}
          frustumCulled={false}
          {...props}
        >
          <PointMaterial
            transparent
            color="#f88a05"
            size={0.003}
            sizeAttenuation={true}
            depthWrite={false}
          />
        </Points>
      </group>
    );
  };

  return (
    <Canvas
      id="stars"
      style={{
        position: "fixed",
        height: "100%",
        width: "100%",
        zIndex: "-1",
      }}
      camera={{ position: [0, 0, 1] }}
    >
      <StarsObject />
    </Canvas>
  );
};

export default Stars;
