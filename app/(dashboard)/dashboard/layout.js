import { Toaster } from "@/components/ui/toaster";
import Header from "./_components/header";
import Sidebar from "./_components/sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-full overflow-hidden">
      <aside className="hidden lg:block w-[250px]">
        <Sidebar />
      </aside>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="max-w-screen-xl px-3 lg:px-[30px] lg:mt-5">
          {children}
        </main>
      </div>
    </div>
  );
}
