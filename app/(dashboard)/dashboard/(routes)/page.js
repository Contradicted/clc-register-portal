import { RefreshHandler } from "@/components/RefreshHandler";
import { getApplicationByUserID } from "@/data/application";
import { currentUser } from "@/lib/auth";
import { cn, formatStudyMode, getDisplayStatus } from "@/lib/utils";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();
  const application = await getApplicationByUserID(user.id);

  return (
    <>
      <RefreshHandler />
      <div className="w-full px-2 mt-6 lg:px-0 lg:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {application.map((app, index) => (
              <div
                className="bg-[#F8F8F8] rounded-[10px] p-4 sm:p-6 h-fit"
                key={index}
              >
                <div className="flex flex-col space-y-4">
                  <h3 className="font-semibold text-lg sm:text-xl">
                    Your application
                  </h3>
                  {[
                    { label: "Course Title", value: app.courseTitle },
                    ...(app.campus ? [{ label: "Campus", value: app.campus }] : []),
                    {
                      label: "Study Mode",
                      value: formatStudyMode(app.studyMode),
                    },
                    {
                      label: "Applicant",
                      value: `${user.firstName} ${user.lastName}`,
                    },
                    { label: "Entry", value: app.commencement },
                    {
                      label: "Status",
                      value: getDisplayStatus(app.status),
                      isStatus: true,
                      updateToken: app.updateApplicationToken?.token,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center text-sm sm:text-base"
                    >
                      <div className="font-medium text-[#78778B] w-full sm:w-1/3">
                        {item.label}
                      </div>
                      <div
                        className={cn(
                          "w-full sm:w-2/3 sm:text-right",
                          item.isStatus && getStatusColor(item.value)
                        )}
                      >
                        {item.value}
                        {item.isStatus &&
                          item.value === "Waiting for Change" &&
                          item.updateToken && (
                            <Link
                              href={`/application?token=${item.updateToken}`}
                              className="ml-1 text-black transition-colors duration-200 ease-in-out"
                            >
                              - Click here
                            </Link>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[#EDF2F7] rounded-lg p-4 sm:p-6 h-fit lg:place-self-end">
            <h2 className="text-[#1A202C] font-semibold text-lg sm:text-xl mb-4 sm:mb-6">
              Need assistance?
            </h2>
            <div className="flex flex-col space-y-4">
              {[
                {
                  title: "Admissions Office",
                  content: [
                    "3 Boyd Street, Aldgate East,",
                    "London, E1 1FQ,",
                    "United Kingdom",
                  ],
                },
                {
                  title: "Opening Hours",
                  content: [
                    "<span class='font-bold'>Monday - Friday: </span>09:00 - 20:00",
                    "<span class='font-bold'>Saturday - Sunday: </span>10:00 - 16:00",
                    "Closed on <span class='font-bold'>Public Holidays</span>",
                  ],
                },
                {
                  title: "Contact",
                  content: [
                    "Email: admissions@clc.ac.uk",
                    "Tel: +44 (0)20 7247 2177",
                  ],
                },
              ].map((section, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <h5 className="text-[#23262F] font-medium">
                    {section.title}
                  </h5>
                  {section.content.map((line, i) => (
                    <p
                      key={i}
                      className="text-[#777E90] text-sm"
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getStatusColor(status) {
  switch (status) {
    case "Approved":
      return "text-[#27AE60]";
    case "Rejected":
      return "text-[#DC143c]";
    case "Waiting for Change":
      return "text-[#f39c12]";
    case "Approved for Interview":
      return "text-[#0fa968]";
    case "Interview successful":
      return "text-[#0fa968]";
    case "Re-Submitted":
      return "text-[#00CED1]";
    case "Void":
      return "text-[#787878]";
    default:
      return "text-[#008080]";
  }
}