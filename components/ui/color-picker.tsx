import { Input } from "./input"
import { resolveCSSVar } from "@/lib/helpers"
import { cn } from "@/lib/utils"

const COLOR_PRESETS = [
  { label: "Primary", variable: "--primary" },
  { label: "Secondary", variable: "--secondary" },
  { label: "Accent", variable: "--accent" }
]

type ColorPickerPropsType = {
  current: string
  onChange: (color: string) => void
} & (
  | { withPresets: true; onPresetClick: (color: string) => void }
  | { withPresets?: false; onPresetClick?: never }
)

export default function ColorPicker({
  current,
  withPresets = false,
  onChange,
  onPresetClick
}: ColorPickerPropsType) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          id="pkg-color"
          value={current}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="border-input h-9 w-10 cursor-pointer rounded border p-0.5"
        />
        <Input
          value={current}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#530A5D"
        />
      </div>
      {withPresets && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {COLOR_PRESETS.map((preset) => {
            return (
              <button
                key={preset.label}
                type="button"
                onClick={onPresetClick && (() => onPresetClick(resolveCSSVar(preset.variable)))}
                className={cn(
                  "flex h-7 cursor-pointer items-center gap-1.5 rounded border px-2.5 text-xs transition-colors",
                  current === resolveCSSVar(preset.variable)
                    ? "border-foreground bg-background text-foreground"
                    : "border-border bg-muted text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                )}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: resolveCSSVar(preset.variable) }}
                />
                {preset.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
