import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
    getApplicationByUserID,
    getSavedApplicationByUserID,
} from '@/data/application'
import { getUserByEmail } from '@/data/user'
import { currentUser } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'

const ApplicationSavedPage = async () => {
    const user = await currentUser()
    const userDetails = await getUserByEmail(user.email)
    const savedApplication = await getSavedApplicationByUserID(user.id)
    const application = await getApplicationByUserID(user.id)

    if (!savedApplication) {
        return redirect(DEFAULT_LOGIN_REDIRECT)
    }

    return (
      <div className="h-full w-full pt-12">
        <div className="w-full flex flex-col items-center justify-center lg:items-start">
          <div className="flex flex-col text-center lg:text-left">
            <h1 className="font-semibold text-[25px]">Application Saved</h1>
            <span className="text-[14px] text-[#929EAE] px-5 md:px-0">
              Thank you for saving your application. Below is a summary of your
              details
            </span>
          </div>

          <div className="min-w-[320px] md:min-w-[500px] px-5 mx-auto mt-[60px] lg:min-w-[700px]">
            <div className="border border-[#F5F5F5] rounded-[10px] p-5">
              <h3 className="font-semibold mb-5">
                {savedApplication?.courseTitle}
              </h3>
              <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B]">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Course Title</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {savedApplication?.courseTitle || "-"}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Year</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    2024/5
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Name</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.title} {userDetails?.firstName}{" "}
                    {userDetails?.lastName}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Date of Birth</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {formatDate(userDetails?.dateOfBirth) || "-"}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Email Address</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.email || "-"}
                  </span>
                </div>
              </div>
              {/* <div className="flex justify-between">
                <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B] text-left">
                  <span>Course Title</span>
                  <span>Year</span>
                  <span>Name</span>
                  <span>Date of Birth</span>
                  <span>Email</span>
                </div>
                <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B] text-right">
                  <span>{savedApplication?.courseTitle || "-"}</span>
                  <span>2024/5</span>
                  <span>
                    {userDetails?.title} {userDetails?.firstName}{" "}
                    {userDetails?.lastName}
                  </span>
                  <span>{formatDate(userDetails?.dateOfBirth)}</span>
                  <span>{userDetails?.email || "-"}</span>
                </div>
              </div> */}
            </div>
          </div>

          <div className="flex flex-col space-y-4 lg:flex-row items-center lg:gap-x-4 w-full justify-center mt-20 lg:space-y-0">
            {savedApplication && (
              <Button>
                <Link href="/your-application">Back to application</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
}

export default ApplicationSavedPage
