import './Dashboard.css'
export default async function Dashboard(subject, courseNum) {

    const res1 = await fetch(`http://localhost:3001/api/getData?subject=${subject}&courseNum=${courseNum}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
    });

    const CourseData = await res1.json()

    const res2 = await fetch(`http://localhost:3001/api/getCourse`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
    })

    const Course = await res2.json()

    return (
        <>
            <div className='dashboard-container'>

            </div>
        </>
    )
}  