import { useEffect, useState } from 'react';
import './Dashboard.css'
export default function Dashboard() {

    const [courseData, setCourseData] = useState('')
    const [course, setCourse] = useState('')
    const [courseChart, setCourseChart] = useState('')

    useEffect(() => {
        async function render() {
            const res1 = await fetch(`http://localhost:3001/api/getData?subject=COMP&courseNum=3612`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            });
            setCourseData(await res1.json())
            console.log(courseData)
        
            const res2 = await fetch(`http://localhost:3001/api/getCourse?courseID=cfe1312a-5fea-46b8-b190-5f10e2f7954b`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            })
            
            setCourse(await res2.json())

        }
        render()
    }, []) // dependency array for re-fetching on change

    return (
        <>
        <p>{JSON.stringify(courseData)}</p>
        </>
    )
}  