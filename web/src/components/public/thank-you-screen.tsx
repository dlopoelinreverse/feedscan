"use client";

import { useTranslations } from "next-intl";

export function ThankYouScreen() {
  const t = useTranslations("publicForm.thankYou");
  const tCommon = useTranslations("publicForm");

  const hour = new Date().getHours();
  const message =
    hour < 12
      ? t("messageMorning")
      : hour < 17
        ? t("message")
        : t("messageEvening");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-6 animate-in fade-in duration-500">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center checkmark-circle">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 12l6 6L20 6"
                stroke="#1D9E75"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                className="checkmark-path"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {message}
        </p>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#6C5CE7] opacity-80" />
          <span className="w-2 h-2 rounded-full bg-[#00B894] opacity-60" />
          <span className="w-2 h-2 rounded-full bg-[#FDCB6E] opacity-40" />
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          {tCommon("poweredBy")}
        </p>
      </div>

      <style jsx>{`
        .checkmark-circle {
          animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .checkmark-path {
          animation: draw 0.5s 0.3s ease-out forwards;
        }
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
