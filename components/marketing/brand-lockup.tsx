import Image from "next/image";
import { MARKETING_LOGO_URL } from "@/components/marketing/brand";
import { cn } from "@/lib/utils";

export function BrandLockup({
  className,
  size = "default",
  showTagline = false,
}: {
  className?: string;
  size?: "compact" | "default";
  showTagline?: boolean;
}) {
  const compact = size === "compact";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.15rem] bg-white",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
      >
        <Image
          src={MARKETING_LOGO_URL}
          alt="Afiya logo"
          fill
          sizes={compact ? "48px" : "64px"}
          className="object-cover object-top scale-[1.06]"
          priority
        />
      </div>

      <div className="min-w-0 leading-none">
        <p
          className={cn(
            "font-semibold lowercase tracking-[-0.06em] text-foreground",
            compact ? "text-[2.05rem]" : "text-[2.45rem]",
          )}
        >
          afiya
        </p>
        {showTagline ? (
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Warm digital care
          </p>
        ) : null}
      </div>
    </div>
  );
}
