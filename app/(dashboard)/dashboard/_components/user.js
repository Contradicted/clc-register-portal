import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { currentUser } from '@/lib/auth'

const User = async () => {
    const user = await currentUser()

    return (
        <div className="bg-[#FAFAFA] flex items-center py-[6px] px-3 gap-x-3 rounded-full">
            <Avatar>
                <AvatarImage src="/placeholder-user.png" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-[#1B212D]">
                {user.firstName + ' ' + user.lastName}
            </span>
        </div>
    )
}

export default User
