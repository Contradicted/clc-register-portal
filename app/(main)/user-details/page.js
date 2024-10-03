import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
    getApplicationByUserID,
    getSavedApplicationByUserID,
} from '@/data/application'
import { getUserByEmail } from '@/data/user'
import { currentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sendRecievedApplicationEmail } from '@/lib/mail'

const UserDetailsPage = async () => {
    const user = await currentUser()
    const userDetails = await getUserByEmail(user.email)
    const savedApplication = await getSavedApplicationByUserID(user.id)

    return (
      <div className="h-full w-full pt-12">
        <div className="w-full flex flex-col items-center justify-center lg:items-start">
          <div className="flex flex-col text-center lg:text-left">
            <h1 className="font-semibold text-[25px]">Your Details</h1>
            <span className="text-[14px] text-[#929EAE]">
              Below is a summary of your details.
            </span>
          </div>

          <div className="min-w-[320px] px-5 mx-auto mt-[60px] md:min-w-[500px] lg:min-w-[700px]">
            <div className="border border-[#F5F5F5] rounded-[10px] p-5 flex flex-col">
              <div className="flex flex-col space-y-5 font-medium text-[14px] text-[#78778B]">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Username</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.email}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Title</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.title}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">First Name</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.firstName}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Last Name</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.lastName}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between">
                  <span className="md:w-1/3">Email Address</span>
                  <span
                    className="break-words md:w-2/3 md:text-right"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {userDetails?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4 md:flex-row items-center md:gap-x-4 w-full justify-center mt-20 md:space-y-0">
            <Button asChild>
              <Link href="/user-details/edit">Edit Details</Link>
            </Button>
            {savedApplication ? (
              <Button>
                <Link href="/application">Edit application</Link>
              </Button>
            ) : (
              <Button>
                <Link href="/application">Submit an application</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
}

export default UserDetailsPage
