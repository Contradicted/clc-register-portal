import { Header } from '@/components/Header'
import "@/app/globals.css";


const MainLayout = ({ children }) => {
    return (
      <>
        <Header />
        <main className="w-full lg:px-[50px]">
          <div className="lg:max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </>
    );
}

export default MainLayout
