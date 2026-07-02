import './Dashboard.css'
export default async function Dashboard(subject, courseNum) {

    const res = await fetch(`http://localhost:3001/api/getData?subject=${subject}&courseNum=${courseNum}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'},
    });

    const CourseData = await res.json()
    const trackedCourses = []
    const error = null;

    return (
        <>
            <div className='dashboard-container'>
                
            </div>
        </>
    )
}  