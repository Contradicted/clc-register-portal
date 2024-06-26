import { Forms } from "./_components/Forms";
import { currentUser } from "@/lib/auth";
import { getSavedApplicationByUserID } from "@/data/application";
import { getUserById } from "@/data/user";

const ApplicationPage = async () => {
  const user = await currentUser();
  const formData = await getSavedApplicationByUserID(user.id);
  const userDetails = await getUserById(user.id);

  return <Forms formData={formData} userData={userDetails} />;
};

export default ApplicationPage;
