import { LogoutButton } from "@/components/auth/LogoutButton";

export default function Home() {
  return (
    <div className="flex h-full items-center justify-center w-full">
      <LogoutButton>
        Log out
      </LogoutButton>
    </div>
  );
}
