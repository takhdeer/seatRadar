import { useEffect, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList} from 'recharts';
import { ScatterChart, Scatter, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

import './Dashboard.css'
export default function Dashboard() {

    const [courseChart, setCourseChart] = useState([])
    const [activeChart, setActiveChart] = useState('seats')
    const [profName, setProfName] = useState([])
    const [profMetrics, setProfMetrics] = useState([])
    const [trackedCourses, setTrackedCourses] = useState([])
    const [activeCourse, setActveCourse] = useState()

    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() { 
            const split = activeCourse.split(' ')
            const subject = split[0]
            const number = split[1]
            const res1 = await fetch(`http://localhost:3001/api/getData?subject=${subject}&courseNum=${number}`, {
                method: 'GET',  // returns course data: seats,waitlist,etc.
                headers: {'Accept': 'application/json'}
            });
            const data1 = await res1.json();
        

            const newArray = data1.courseData.map( row => {
                return {
                    ...row,
                    seatsTaken: row.total_seats - row.seats,
                    waitlistTaken: row.total_waitlist - row.waitlist,
                    course: activeCourse
                }
            })
            setCourseChart(newArray)

        }
        fetchData()
    }, [activeCourse]) // dependency array for re-fetching on change

    useEffect(() => {
        console.log(courseChart)

    }, [courseChart])


    useEffect(() => {
        async function getProfs() {
            const res = await fetch(`http://localhost:3001/api/profCourses?courseID=${courseChart[0].id}`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            });
            const data = await res.json();
            setProfName(data)
        }
        getProfs()
    }, [courseChart])
    
    useEffect(() => {  
        console.log(profName)
    }, [profName])

    useEffect(() => {
        async function getProfRatings() {
          setProfMetrics([]) 
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


    useEffect(() => {
        async function getUserCourses() {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                console.log('Current user Found')
            }
            else {
                console.log('User not found')
            }

            const res = await fetch(`http://localhost:3001/api/getUserCourses?userID=${user.id}`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            });
            const data = await res.json();
            setTrackedCourses(data)
            const data2 = data[0].course
            setActveCourse(data2)
        }
        getUserCourses()
    }, [])

    useEffect(() => {
        console.log(trackedCourses)
    }, [trackedCourses])
    
    function SeatsChart( {chartData} ) {
        return (
            <ResponsiveContainer width='100%' height='80%'>
                <BarChart data = {chartData}>
                    <XAxis 
                      dataKey = 'course' 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff' }}
                     />
                    <YAxis 
                      dataKey = 'total_seats' 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffff' }} 
                    />
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
            <ResponsiveContainer width='100%' height='75%'>
                <BarChart data = {chartData}>
                    <XAxis 
                      dataKey = 'course' 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff' }}
                    />
                    <YAxis 
                      dataKey = 'waitlist' 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff' }}
                    />
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
          <ResponsiveContainer width='100%' height='100%'>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20}}>
              <XAxis 
                dataKey="avgDifficulty" 
                type='number'
                domain={[1,5]}
                ticks={[1,2,3,4,5]}
                name="Difficulty" 
                axisLine={false} 
                tickLine={false} tick={{ fill: '#ffffff' }} 
                label={
                  { value: 'Difficulty', 
                  position: 'insideBottom', 
                  offset: -10, 
                  fill: '#ffffff' }
                  } />
              <YAxis 
                dataKey="avgRating" 
                type='number'
                domain={[1,5]}
                ticks={[1,2,3,4,5]}
                tickMargin={12}
                name="Rating" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff' }} 
                label={
                  { value: 'Rating', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 10,
                  fill: '#ffffff' }
                  } />
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


    async function handleLogOut() {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.log(error)
      }
      else {
        navigate('/')
      }
    } 
    return (
      <>
        <div className="dashboard-container">
          <div className="chart-container">
            <div className="chart-header">
              <button
                className="seat-btn"
                name="waitlist"
                onClick={() =>
                  setActiveChart(activeChart === "seats" ? "waitlist" : "seats")
                }
              >
                {activeChart === "seats" ? "Waitlist" : "Seats"}
              </button>

              <div className="left-children">
                <select value={activeCourse} onChange={(e) => setActveCourse(e.target.value)}>
                  {trackedCourses.map((item, index) => (
                    <option key={index} value={item.course}>
                      {item.course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderChart()}
          </div>

          <div className="chart-container">
            <ProfRatingChart chartData={profMetrics} />
          </div>
        
          <div className="btn-container">
            <button
              className="add-btn"
              name="addCourse"
              onClick={() => navigate("/form")}
            >
              Add course
            </button>
          </div>

          <div className='btn-container'>
            <button
                className="add-btn"
                name="addCourse"
                onClick={() => handleLogOut()}
              >
                Log Out
              </button>
          </div>
        </div>
      </>
    );
}