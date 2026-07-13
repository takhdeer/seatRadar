import { useEffect, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

import './Dashboard.css'
export default function Dashboard() {

    const [courseData, setCourseData] = useState([])
    const [courseInfo, setCourseInfo] = useState([])
    const [courseChart, setCourseChart] = useState([])
    const [activeChart, setActiveChart] = useState('seats')

    useEffect(() => {
        async function fetchData() {
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
            setCourseInfo(data2)

            const newArray = data1.courseData.map( row => {
                return {
                    ...row,
                    ...data2
                }
            })
            setCourseChart(newArray)

        }
        fetchData()
    }, []) // dependency array for re-fetching on change

    useEffect(() => {
        console.log(courseChart)

    }, [courseChart])

    
    function SeatsChart( {chartData}) {
        return (
            <ResponsiveContainer width='100%' height={300}>
                <BarChart data = {chartData}>
                    <XAxis dataKey = 'course' axisLine={false} tickLine={false}/>
                    <YAxis dataKey = 'total_seats' axisLine={false} tickLine={false}/>
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Bar dataKey = "total_seats" fill='#4f9dde'/>
                </BarChart>
            </ResponsiveContainer>
        )
    }

    function WaitlistChart( {chartData}) {
        return (
            <ResponsiveContainer width='100%' height={300}>
                <BarChart data = {chartData}>
                    <XAxis dataKey = 'course' axisLine={false} tickLine={false}/>
                    <YAxis dataKey = 'waitlist' axisLine={false} tickLine={false}/>
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Bar dataKey = "waitlist" fill='#4f9dde'/>
                </BarChart>
            </ResponsiveContainer>
        )
    }

    function renderChart() {
        if (activeChart === 'seats') {
            return (
                <SeatsChart chartData={courseChart} />
            )
        } else {
            return (
                <WaitlistChart chartData={courseChart} />
            )
        }
    }
    return (
        <>
        <div className='chart-container'>
            <button 
                className='main-btn'
                name='waitlist'
                onClick={ () => setActiveChart(activeChart === 'seats' ? 'waitlist' : 'seats')}
                >{activeChart === 'seats' ? 'Waitlist': 'Seats'}</button>
                    
                {renderChart()} 
        </div>

        </>
    )
}  