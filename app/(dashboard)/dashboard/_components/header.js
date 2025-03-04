import MobileSidebar from './mobile-sidebar'
import User from './user'
import DashboardTitle from './dashboard-title'
import { getActiveCourses } from '@/data/courses'
import { currentUser } from '@/lib/auth'
import { getApplicationByUserID } from '@/data/application'

const Header = async () => {

    const courses = await getActiveCourses();
    const user = await currentUser();
    const applicationID = await getApplicationByUserID(user.id)

    return (
        <div className="w-full h-[120px]">
            <div className="h-full flex items-center justify-between shadow-sm lg:shadow-none">
                <div className="w-full hidden px-[30px] lg:flex lg:items-center lg:justify-between">
                    <DashboardTitle />
                    <User />
                </div>
                <div className="lg:hidden px-3">
                    <MobileSidebar courses={courses} applicationID={applicationID} />
                </div>
            </div>
        </div>
    )
}

export default Header
