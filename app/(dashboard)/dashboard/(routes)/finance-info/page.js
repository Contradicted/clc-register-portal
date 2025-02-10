import { FinanceForm } from "@/components/FinanceForm";
import { getApplicationIDByUserID } from "@/data/application";
import { getActiveCourses } from "@/data/courses";
import { getFinanceInfoByUserID } from "@/data/finance";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FinanceInfoPage() {
  const user = await currentUser();
  const courses = await getActiveCourses();
  const applicationID = await getApplicationIDByUserID(user.id);

  const userCourse = courses.find((course) => course.id === applicationID);

  // Redirect to dashboard if course is hybrid
  if (userCourse?.course_title?.includes("Hybrid")) {
    redirect("/dashboard");
  }

  const data = await getFinanceInfoByUserID(user.id);

  return <FinanceForm data={data} courses={courses} />;
}
