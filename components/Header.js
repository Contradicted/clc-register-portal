import Image from "next/image"
import { LogoutButton } from "@/components/auth/LogoutButton";

export const Header = () => {
  return (
    <div className="h-[120px] bg-[#FAFAFA]">
      <div className="lg:max-w-screen-2xl mx-auto px-[50px] w-full h-full flex items-center justify-between">
        <div className="flex h-full w-full">
          <Image
            src="/logo.svg"
            alt="logo"
            height="200"
            width="200"
            className="w-fit"
          />
        </div>
        <LogoutButton>Log out</LogoutButton>
      </div>
    </div>
  );
};
