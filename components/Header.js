import Image from "next/image"
import { LogoutButton } from "@/components/auth/LogoutButton";
import { signOut } from "@/auth";

export const Header = () => {
    return (
      <div className="lg:max-w-screen-2xl mx-auto h-[120px] bg-[#FAFAFA] px-[50px] flex items-center justify-between">
        <div className="flex h-full w-full">
          <Image src="/logo.svg" alt="logo" height="200" width="200" className="w-fit" />
        </div>
        <LogoutButton>
          Log out
        </LogoutButton>
      </div>
    );
}