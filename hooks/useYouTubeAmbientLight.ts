import { RefObject, useEffect, useRef, useState } from "react";

const DEFAULT_AMBIENT = "rgba(255, 255, 255, 0.55)";

export default function useYouTubeAmbientLight(
  videoRef: RefObject<HTMLVideoElement>
): string {
  const [ambientColor, setAmbientColor] = useState<string>(DEFAULT_AMBIENT);
  const smoothRef = useRef({ r: 128, g: 128, b: 128 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) return undefined;

    let timer: number | null = null;

    const sampleAmbient = () => {
      if (!video || video.readyState < 2) return;

      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { data, width, height } = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        const addPixel = (x: number, y: number) => {
          const idx = (y * width + x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count += 1;
        };

        const maxX = width - 1;
        const maxY = height - 1;

        for (let x = 0; x <= maxX; x += 1) {
          addPixel(x, 0);
          addPixel(x, maxY);
        }

        for (let y = 1; y < maxY; y += 1) {
          addPixel(0, y);
          addPixel(maxX, y);
        }

        if (count === 0) return;

        const nextR = r / count;
        const nextG = g / count;
        const nextB = b / count;

        const smooth = smoothRef.current;
        const eased = {
          r: smooth.r + (nextR - smooth.r) * 0.15,
          g: smooth.g + (nextG - smooth.g) * 0.15,
          b: smooth.b + (nextB - smooth.b) * 0.15,
        };

        smoothRef.current = eased;

        setAmbientColor(
          `rgba(${Math.round(eased.r)}, ${Math.round(eased.g)}, ${Math.round(
            eased.b
          )}, 0.55)`
        );
      } catch (error) {
        // Ignore canvas errors (e.g., CORS), keep the last ambient color
      }
    };

    const startSampling = () => {
      if (timer !== null) return;
      timer = window.setInterval(sampleAmbient, 100);
    };

    const stopSampling = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    };

    const handlePlay = () => startSampling();
    const handlePause = () => stopSampling();
    const handleEnded = () => stopSampling();

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    if (!video.paused) {
      startSampling();
    }

    return () => {
      stopSampling();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef]);

  return ambientColor;
}
