import { getUserByEmail } from "@/data/user";
import { currentUser } from "@/lib/auth";

import { UserDetailsEditForm } from "../_components/UserDetailsEditForm";

const UserDetailsEditPage = async () => {
  const user = await currentUser();
  const userDetails = await getUserByEmail(user.email);

  return (
    <div className="h-full w-full pt-12">
      <div className="w-full flex flex-col items-center justify-center lg:items-start">
        <div className="flex flex-col text-center lg:text-left">
          <h1 className="font-semibold text-[25px]">Your Details</h1>
          <span className="text-[14px] text-[#929EAE]">
            Please edit your details below
          </span>
        </div>
        <div className="px-5 mx-auto mt-[60px] lg:min-w-[700px]">
          <UserDetailsEditForm userDetails={userDetails} />
        </div>

      </div>
    </div>
  );
};

export default UserDetailsEditPage;
