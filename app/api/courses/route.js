import { db } from '@/lib/db'

export async function GET() {
    try {
        const courses = await db.course.findMany({
          where: {
            status: "Active",
          },
          select: {
            id: true,
            name: true,
            course_study_mode: true,
            course_instances: {
              where: {
                status: true
              }
            }
          },
        });

        return new Response(JSON.stringify(courses), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Failed to fetch active courses:', error)
        return new Response(
            JSON.stringify({ error: 'Failed to fetch courses' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}
