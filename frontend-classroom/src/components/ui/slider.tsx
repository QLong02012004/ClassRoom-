import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col group",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted/50 data-horizontal:h-2 data-horizontal:w-full data-vertical:h-full data-vertical:w-2 shadow-inner transition-colors group-hover:bg-muted/80"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-gradient-to-r from-[#FE6747] to-[#ff8e75] data-horizontal:h-full data-vertical:w-full transition-all duration-300 ease-out"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="relative block size-5 shrink-0 rounded-full border-2 border-white bg-gradient-to-br from-[#FE6747] to-[#ff8e75] shadow-[0_0_10px_rgba(254,103,71,0.5)] ring-primary/50 transition-all select-none after:absolute after:-inset-2 hover:scale-125 hover:shadow-[0_0_15px_rgba(254,103,71,0.8)] focus-visible:ring-4 focus-visible:outline-hidden active:scale-90 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
