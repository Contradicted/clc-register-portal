import Image from "next/image"
import { LogoutButton } from "@/components/auth/LogoutButton";

export const Header = () => {
  return (
    <div className="h-[120px] bg-[#FAFAFA]">
      <div className="lg:max-w-screen-2xl mx-auto px-[50px] w-full h-full flex items-center justify-between">
        <div className="flex h-full w-full">
          <Image
            src="/logo.png"
            alt="logo"
            width={200}
            height={200}
            priority
            className="w-auto h-auto max-w-[130px] md:max-w-[200px] object-contain"
          />
        </div>
        <LogoutButton>Log out</LogoutButton>
      </div>
    </div>
  );
};
