import { Toaster } from '@/components/ui/toaster'
import Header from './_components/header'
import Sidebar from './_components/sidebar'

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-full">
        <aside className="hidden lg:block w-[250px] border-r">
          <Sidebar />
        </aside>
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-screen-3xl px-3 lg:px-[30px] lg:mt-5 pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
}
