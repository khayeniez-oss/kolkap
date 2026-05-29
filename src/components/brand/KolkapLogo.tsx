type KolkapLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  lightText?: boolean;
};

export default function KolkapLogo({
  size = "md",
  showText = true,
  lightText = false,
}: KolkapLogoProps) {
  const iconSize = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  const brandTextSize = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  const subtitleSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex min-w-0 items-center gap-4">
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-[1.2rem] bg-[#05070A] shadow-[0_0_22px_rgba(37,99,255,0.45)] ring-1 ring-blue-400/50 ${iconSize[size]}`}
        aria-label="Kolkap logo"
      >
        <div className="absolute inset-1.5 rounded-[0.9rem] border border-blue-300/80" />

        <div className="absolute bottom-1.5 left-3.5 h-3.5 w-3.5 rotate-45 rounded-[2px] border-b border-l border-blue-300/80 bg-[#05070A]" />

        <span className="relative z-10 -mt-1 text-[2rem] font-black leading-none tracking-[-0.08em] text-white">
          K
        </span>

        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#7CFF3D] shadow-[0_0_10px_rgba(124,255,61,0.75)]" />
      </div>

      {showText ? (
        <div className="min-w-0">
          <p
            className={`font-black leading-none tracking-[-0.055em] ${
              lightText ? "text-white" : "text-[#07111F]"
            } ${brandTextSize[size]}`}
          >
            kolkap
          </p>
          <p
            className={`mt-2 font-black uppercase tracking-[0.16em] ${
              lightText ? "text-slate-300" : "text-slate-600"
            } ${subtitleSize[size]}`}
          >
            AI-Powered Responses
          </p>
        </div>
      ) : null}
    </div>
  );
}
