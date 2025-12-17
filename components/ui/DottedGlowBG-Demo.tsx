"use client";
import { DottedGlowBackground } from "./dotted-glow-background";
import Image from "next/image";

export function DottedGlowBackgroundDemo() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex size-100 sm:size-120 lg:size-200 items-end justify-end rounded-3xl">
      {/* Animated glow dots */}
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-70% mask-radial-at-center"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar="--color-cyan-400"
        glowColorLightVar="--color-blue-500"
        colorDarkVar="--color-cyan-300"
        glowColorDarkVar="--color-blue-600"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.2}
        speedScale={1}
      />
    </div>
  );
}
