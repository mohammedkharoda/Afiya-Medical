"use client";

import Lottie from "lottie-react";
import animationData from "@/public/image/site-internal-images/404.json";

export function NotFoundAnimation() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        className="h-auto w-full"
      />
    </div>
  );
}
