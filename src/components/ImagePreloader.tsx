import { useEffect } from "react";

import axios from "axios";

import { debug } from "@util/log";

const ImagePreloader = () => {
  useEffect(() => {
    axios.get("/api/assets/img/preload/").then((res) => {
      const { data } = res;
      const { images } = data;
      debug({ images });
      images.forEach((image: string) => {
        if (image.length === 0) {
          return;
        }
        const img = new Image();
        if (image.includes("http")) {
          img.src = image;
        } else {
          img.src = `/api/assets/img/${image}/`;
        }
      });
    });
  }, []);
  return null;
};

export default ImagePreloader;
