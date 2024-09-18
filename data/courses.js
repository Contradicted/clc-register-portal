import { db } from '@/lib/db'

export const getActiveCourses = async () => {
    try {
        const courses = await db.course.findMany({
            where: {
                status: 'Active',
            },
            select: {
                id: true,
                name: true,
                course_study_mode: true,
            },
        })

        return courses
    } catch (error) {
        console.log('[FETCHING_ACTIVE_COURSES_ERROR]', error)
        return null
    }
}

export const getCourseByName = async (name) => {
    try {
        const course = await db.course.findFirst({
            where: {
                name: name,
                status: 'Active',
            },
        })

        return course
    } catch (error) {
        console.log('[FETCHING_COURSE_BY_NAME_ERROR]', error)
        return null
    }
}
