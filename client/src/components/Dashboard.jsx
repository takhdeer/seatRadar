import { useEffect, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList} from 'recharts';
import { ScatterChart, Scatter, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';


import './Dashboard.css'
export default function Dashboard() {

    const [courseData, setCourseData] = useState([])
    const [courseInfo, setCourseInfo] = useState([])
    const [courseChart, setCourseChart] = useState([])
    const [activeChart, setActiveChart] = useState('seats')
    const [profName, setProfName] = useState([])
    const [profMetrics, setProfMetrics] = useState([])
    const [trackedCourses, setTrackedCourses] = useState([])

    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() { 
            const res1 = await fetch(`http://localhost:3001/api/getData?subject=COMP&courseNum=3612`, {
                method: 'GET',  // returns course data: seats,waitlist,etc.
                headers: {'Accept': 'application/json'}
            });
            const data1 = await res1.json();
            setCourseData(data1)
        
            const res2 = await fetch(`http://localhost:3001/api/getCourse?courseID=cfe1312a-5fea-46b8-b190-5f10e2f7954b`, {
                method: 'GET', // returns course: subject and num
                headers: {'Accept': 'application/json'} 
            })
            
            const data2 = await res2.json();
            setCourseInfo(data2)

            const newArray = data1.courseData.map( row => {
                return {
                    ...row,
                    seatsTaken: row.total_seats - row.seats,
                    waitlistTaken: row.total_waitlist - row.waitlist,
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


    useEffect(() => {
        async function getProfs() {
            const res = await fetch('http://localhost:3001/api/profCourses?courseID=cfe1312a-5fea-46b8-b190-5f10e2f7954b', {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            });
            const data = await res.json();
            setProfName(data)
        }
        getProfs()
    }, [])
    
    useEffect(() => {  
        console.log(profName)
    }, [profName])

    useEffect(() => {
        async function getProfRatings() {
            for(let i = 0; i < profName.length; i++){
                const res = await fetch(`http://localhost:3001/api/profRatings?profs=${profName[i]}`, {
                    method: 'GET',
                    headers: {'Accept': 'application/json'}
                });
                const data = await res.json();
                setProfMetrics(prev => [...prev, data[0]]);
            }
        }
        getProfRatings()
    }, [profName])

    useEffect(() => {
        console.log(profMetrics)
    }, [profMetrics])

    
    function SeatsChart( {chartData} ) {
        return (
            <ResponsiveContainer width='100%' height={300}>
                <BarChart data = {chartData}>
                    <XAxis dataKey = 'course' axisLine={false} tickLine={false} tick={{ fill: '#ffffff' }} />
                    <YAxis dataKey = 'total_seats' axisLine={false} tickLine={false} tick={{ fill: '#ffff' }} />
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Legend wrapperStyle={{ color: '#ffffff' }} />
                    <Bar dataKey = 'seats' stackId='a' fill='#90EE90' name='Available' />
                    <Bar dataKey='seatsTaken' stackId='a' fill='#FF474C' name='Taken' />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    function WaitlistChart( {chartData} ) {
        return (
            <ResponsiveContainer width='100%' height={300}>
                <BarChart data = {chartData}>
                    <XAxis dataKey = 'course' axisLine={false} tickLine={false} tick={{ fill: '#ffffff' }}/>
                    <YAxis dataKey = 'waitlist' axisLine={false} tickLine={false} tick={{ fill: '#ffffff' }}/>
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Bar dataKey = "waitlist" stackId='a' fill='#90EE90' name='Available' />
                    <Bar dataKey = "waitlistTaken" stackId='a' fill='#FF474C' name='Taken' />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    function ProfRatingChart({ chartData }) {
        return (
          <ResponsiveContainer width='100%' height={300}>
            <ScatterChart>
              <XAxis dataKey="avgDifficulty" name="Difficulty" axisLine={false} tickLine={false} tick={{ fill: '#ffffff' }} />
              <YAxis dataKey="avgRating" name="Rating" axisLine={false} tickLine={false} tick={{ fill: '#ffffff' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <CartesianGrid stroke="none" />
              <Scatter data={chartData} fill="#4f9dde" />
                <LabelList dataKey='lastName' position='top' fill='#ffffff' />
            </ScatterChart>
          </ResponsiveContainer>
        );
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
        <div className='dashboard-container'>
            <div className='chart-container'>
                <div className='chart-header'>
                    <button 
                        className='seat-btn'
                        name='waitlist'
                        onClick={ () => setActiveChart(activeChart === 'seats' ? 'waitlist' : 'seats')}
                        >{activeChart === 'seats' ? 'Waitlist': 'Seats'}</button>
                    
                    <div className='left-children'>
                        <button 
                            className='course-btn'
                            name='changeCourse'
                            >Course 1</button>
                        <button 
                            className='course-btn'
                            name='changeCourse'
                            >Course 2</button>
                        <button 
                            className='course-btn'
                            name='changeCourse'
                            >Course 3</button>
                    </div>
                </div>

                    {renderChart()} 
            </div>

            <div className='chart-container'>
                <ProfRatingChart chartData={profMetrics}/>

            </div>

            <button 
            className='add-bnt'
            name='addCourse'
            onClick={() => navigate('/form')}
            >Add course</button>
        </div>
  


        </>
    )
}  