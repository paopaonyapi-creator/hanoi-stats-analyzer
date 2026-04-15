import { AlertTriangle } from "lucide-react";
import { APP_DISCLAIMER } from "@/lib/constants";

interface DisclaimerBannerProps {
  text?: string;
}

export function DisclaimerBanner({ text }: DisclaimerBannerProps) {
  return (
    <div className="disclaimer-banner flex items-start gap-3 mb-6">
      <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p>
        {text || APP_DISCLAIMER}
      </p>
    </div>
  );
}
