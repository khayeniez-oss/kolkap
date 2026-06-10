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
    sm: "h-11 w-11",
    md: "h-14 w-14",
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
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#05070A] shadow-sm ring-1 ring-white/10 ${iconSize[size]}`}
        aria-label="Kolkap logo"
      >
        <img
          src="/kolkap-logo.png"
          alt="Kolkap"
          className="h-full w-full object-cover"
        />
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
            AI Staff Platform
          </p>
        </div>
      ) : null}
    </div>
  );
}