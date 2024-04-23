import { Button } from "@/components/ui/button";
import { getUserByEmail } from "@/data/user";
import { currentUser } from "@/lib/auth";
import Link from "next/link";

const UserDetailsPage = async () => {

    const user = await currentUser();
    const userDetails = await getUserByEmail(user.email);

    return (
      <div className="h-full w-full pt-12">
        <div className="w-full flex flex-col items-center justify-center lg:items-start">
          <div className="flex flex-col text-center lg:text-left">
            <h1 className="font-semibold text-[25px]">Your Details</h1>
            <span className="text-[14px] text-[#929EAE]">
              Below is a summary of your details.
            </span>
          </div>

          <div className="min-w-[500px] px-5 mx-auto mt-[60px] lg:min-w-[700px]">
            <div className="border border-[#F5F5F5] rounded-[10px] p-5 flex justify-between">
              <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B] text-left">
                <span>Username</span>
                <span>Title</span>
                <span>First Name</span>
                <span>Last Name</span>
                <span>Email Address</span>
              </div>
              <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B] text-right">
                <span>{userDetails?.email}</span>
                <span>{userDetails?.title}</span>
                <span>{userDetails?.firstName}</span>
                <span>{userDetails?.lastName}</span>
                <span>{userDetails?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4 lg:flex-row items-center lg:gap-x-4 w-full justify-center mt-20 lg:space-y-0">
            <Button asChild>
              <Link href="/user-details/edit">Edit Details</Link>
            </Button>
            <Button>
              <Link href="/application">Submit an application</Link>
            </Button>
          </div>
        </div>
      </div>
    );
}
 
export default UserDetailsPage;