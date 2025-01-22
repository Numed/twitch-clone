import Image from "next/image";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const Logo = () => {
  return (
    <div className="flex flex-col items-center gap-y-4">
      <div className="bg-white rounded-full p-1">
        <Image src="/twitch.svg" width={32} height={32} alt="Gnitch" />
      </div>
      <div className={cn("flex flex-col items-center", font.className)}>
        <h2 className="text-xl font-semibold">Gnitch</h2>
        <p className="text-sm  text-muted-foreground">Let&apos;s begin your journey</p>
      </div>
    </div>
  );
};
