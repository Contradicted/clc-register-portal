import { Header } from "@/components/Header";

const MainLayout = ({
    children
}) => {
    return (
      <>
        <Header />
        <main className="h-full w-full lg:px-[50px]">
          <div className="lg:max-w-screen-2xl mx-auto h-full">{children}</div>
        </main>
      </>
    );
}
 
export default MainLayout;