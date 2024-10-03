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

const YourApplicationPage = async () => {
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
            <h1 className="font-semibold text-[25px]">Your Application</h1>
            <span className="text-[14px] text-[#929EAE] px-5 md:px-0">
              Below is your current application in progress. Please ensure you
              complete and submit
            </span>
          </div>

          <div className="min-w-[320px] md:min-w-[500px] px-5 mx-auto mt-[60px] lg:min-w-[700px]">
            <div className="border border-[#F5F5F5] rounded-[10px] p-5">
              <h3 className="font-semibold mb-5">
                {savedApplication?.courseTitle}
              </h3>
              {/* <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-3 font-medium text-[14px] text-[#78778B] text-left">
                  <span>Year: 2024/5</span>
                  <span>Application ID: {savedApplication?.id}</span>
                </div>
                <Button
                  variant="secondary"
                  className="px-16 border border-[#F5F5F5]"
                >
                  <Link href="/application">Edit</Link>
                </Button>
              </div> */}
              <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B] md:flex-row md:justify-between md:items-center md:space-y-0">
                <div className="flex flex-col gap-y-3">
                  <span>Year: 2024/5</span>
                  <span>Application ID: {savedApplication?.id}</span>
                </div>
                <Button
                  variant="secondary"
                  className="px-16 border border-[#F5F5F5]"
                >
                  <Link href="/application">Edit</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default YourApplicationPage
