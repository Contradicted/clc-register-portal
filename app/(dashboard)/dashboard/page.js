import { getApplicationByUserID } from "@/data/application";
import { currentUser } from "@/lib/auth";
import { cn, getDisplayStatus } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await currentUser();
  const application = await getApplicationByUserID(user.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-5 lg:gap-x-[50px]">
      {application.map((app, index) => (
        <div
          className="bg-[#F8F8F8] rounded-[10px] p-5 lg:col-span-2 h-fit"
          key={index}
        >
          <div className="flex flex-col space-y-5">
            <h3 className="font-semibold text-[18px]">Your application</h3>
            <div className="flex gap-3 text-[#78778B] font-medium">
              <div className="flex items-start w-full max-w-[25%]">
                <p>Course Title</p>
              </div>
              <p className="flex justify-end flex-wrap w-full text-right">
                {app.courseTitle}
              </p>
            </div>
            <div className="flex gap-3 text-[#78778B] font-medium">
              <div className="flex items-start w-full max-w-[25%]">
                <p>Applicant</p>
              </div>
              <p className="flex justify-end flex-wrap w-full">
                {user.firstName + " " + user.lastName}
              </p>
            </div>
            <div className="flex gap-3 text-[#78778B] font-medium">
              <div className="flex items-start w-full max-w-[25%]">
                <p>Entry month/year</p>
              </div>
              <p className="flex justify-end flex-wrap w-full">
                September 2023/4
              </p>
            </div>
            <div className="flex gap-3 text-[#78778B] font-medium">
              <div className="flex items-start w-full max-w-[25%]">
                <p>Status</p>
              </div>
              <p
                className={cn(
                  "flex justify-end flex-wrap w-full text-[#008080]",
                  getDisplayStatus(app.status) === "Approved" &&
                    "text-[#27AE60]",
                  getDisplayStatus(app.status) === "Rejected" &&
                    "text-[#DC143c]",
                  getDisplayStatus(app.status) === "Waiting for Change" &&
                    "text-[#f39c12]",
                  getDisplayStatus(app.status) === "Re-Submitted" &&
                    "text-[#00CED1]"
                )}
              >
                {getDisplayStatus(app.status)}
              </p>
            </div>
          </div>
        </div>
      ))}
      <div className="border border-[#EDF2F7] w-full rounded-lg p-6">
        <h2 className="text-[#1A202C] font-semibold text-xl mb-7">
          Need assistance?
        </h2>
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col space-y-0.5">
            <h5 className="text-[#23262F] font-medium">Admissions Office</h5>
            <p className="text-[#777E90] text-sm font-light">
              3 Boyd Street, Aldgate East, <br />
              London, E1 1FQ, <br />
              United Kingdom
            </p>
          </div>

          <div className="flex flex-col space-y-0.5">
            <h5 className="text-[#23262F] font-medium">Opening Hours</h5>
            <p className="text-[#777E90] text-sm font-light">
              <span className="font-bold">Monday - Friday: </span>
              09:00 - 20:00
            </p>
            <p className="text-[#777E90] text-sm font-light">
              <span className="font-bold">Saturday - Sunday: </span>
              10:00 - 16:00
            </p>
            <p className="text-[#777E90] text-sm font-light">
              Closed on
              <span className="font-bold"> Public Holidays</span>
            </p>
          </div>

          <div className="flex flex-col space-y-1.5 pt-[40px]">
            <p className="text-[#23262F] font-medium">
              Email: admissions@clc.ac.uk
            </p>
            <p className="text-[#23262F] font-medium">
              Tel: +44 (0)20 7247 2177
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
