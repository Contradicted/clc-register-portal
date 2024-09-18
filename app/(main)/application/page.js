import { Forms } from './_components/Forms'
import { currentUser } from '@/lib/auth'
import {
    getApplicationByUserID,
    getSavedApplicationByUserID,
} from '@/data/application'
import { getUserById } from '@/data/user'
import { getActiveCourses } from '@/data/courses'

const ApplicationPage = async () => {
    const user = await currentUser()
    const formData = await getSavedApplicationByUserID(user.id)
    const userDetails = await getUserById(user.id)
    const application = await getApplicationByUserID(user.id)
    const activeCourses = await getActiveCourses()

    return (
        <Forms
            formData={application[0] || formData}
            userData={userDetails}
            activeCourses={activeCourses}
        />
    )
}

export default ApplicationPage
