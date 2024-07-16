import { Forms } from './_components/Forms'
import { currentUser } from '@/lib/auth'
import {
    getApplicationByUserID,
    getSavedApplicationByUserID,
} from '@/data/application'
import { getUserById } from '@/data/user'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'
import { redirect } from 'next/navigation'

const ApplicationPage = async () => {
    const user = await currentUser()
    const formData = await getSavedApplicationByUserID(user.id)
    const userDetails = await getUserById(user.id)
    const application = await getApplicationByUserID(user.id)

    return <Forms formData={formData} userData={userDetails} />
}

export default ApplicationPage
