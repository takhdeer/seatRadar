import { useEffect, useState } from 'react';
import './Dashboard.css'
export default function Dashboard() {

    const [courseData, setCourseData] = useState([])
    const [course, setCourse] = useState([])
    const [courseChart, setCourseChart] = useState([])

    useEffect(() => {
        async function render() {
            const res1 = await fetch(`http://localhost:3001/api/getData?subject=COMP&courseNum=3612`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            });
            const data1 = await res1.json();
            setCourseData(data1)
        
            const res2 = await fetch(`http://localhost:3001/api/getCourse?courseID=cfe1312a-5fea-46b8-b190-5f10e2f7954b`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            })
            
            const data2 = await res2.json();
            setCourse(data2)

            const newArray = data1.courseData.map( row => {
                return {
                    ...row,
                    ...data2
                }
            })
            setCourseChart(newArray)

        }
        render()
    }, []) // dependency array for re-fetching on change

    useEffect(() => {
        console.log(courseChart)
    }, [courseChart])
    return (
        <>
        <p>{JSON.stringify(courseChart)}</p>
        <p>{JSON.stringify(courseData)}</p>
        <p>{JSON.stringify(course)}</p>
        </>
    )
}  