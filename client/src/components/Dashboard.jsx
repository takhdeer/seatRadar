import { useEffect, useRef, useState } from 'react';
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
    const [profSections, setProfSections] = useState([]) // [{ prof, section_id }]
    const [rankedSections, setRankedSections] = useState([])
    const [courseSchedules, setCourseSchedules] = useState({}) // { section: '307541', days: 'TR', start: '1600', end: '1720', subject: 'MATH', courseNum: '1271' }
    const scheduleCache = useRef({}) // survives re-renders

    const navigate = useNavigate()

    // Sync schedules whenever the set of tracked courses changes
    useEffect(() => {
      if (trackedCourses.length === 0) return;

      const currentNames = new Set(trackedCourses.map(c => c.course));

      // Drop cached entries for courses the user stopped tracking
      for (const name of Object.keys(scheduleCache.current)) {
        if (!currentNames.has(name)) {
          delete scheduleCache.current[name];
        }
      }

      async function fetchMissingSchedules() {
        const toFetch = trackedCourses.filter(c => !scheduleCache.current[c.course]);

        if (toFetch.length === 0) {
          setCourseSchedules({ ...scheduleCache.current });
          return;
        }

        for (const c of toFetch) {
          const [subject, number] = c.course.split(' ');
          try {
            const res = await fetch(
              `http://localhost:3001/api/getSchedule?subject=${subject}&courseNum=${number}`,
              { method: 'GET', headers: { Accept: 'application/json' } }
            );
            const data = await res.json();
        
            if (!res.ok || !Array.isArray(data.scheduleData)) {
              console.warn(`No schedule data available for ${c.course}`, data);
              scheduleCache.current[c.course] = [];
              continue;
            }
        
            const schedule = data.scheduleData.map(row => ({
              section: row.section,
              days: row.days,
              start_time: row.start,
              end_time: row.end
            }));
        
            scheduleCache.current[c.course] = schedule;
          } catch (err) {
            console.error(`Failed to fetch schedule for ${c.course}`, err);
          }
        }

        setCourseSchedules({ ...scheduleCache.current });
      }

      fetchMissingSchedules();
    }, [trackedCourses]);

    useEffect(() => {
      console.log(courseSchedules)
  }, [courseSchedules])

    useEffect(() => {
        async function fetchData() { 
          if (!activeCourse) return;
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
          setProfSections(data)
  
          const uniqueNames = [...new Set(data.map(d => d.prof))]
              .filter(name => name && !['tba', 'TBA', 'Tba'].includes(name));
          setProfName(uniqueNames)
      }
      if (courseChart.length > 0) {
          getProfs()
      }
  }, [courseChart])
    
    useEffect(() => {  
        console.log(profName)
        console.log(profSections)
    }, [profName, profSections])

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
      if (courseChart.length === 0 || profMetrics.length === 0 || profSections.length === 0) {
          setRankedSections([]);
          return;
      }
    
      const ranked = courseChart.map(section => {
              const sectionProf = profSections.find(
                  ps => String(ps.section_id) === String(section.section)
              );
              const profName = sectionProf?.prof;
    
              const prof = profName && profMetrics.find(p =>
                  p.lastName && profName.toLowerCase().includes(p.lastName.toLowerCase())
              );
    
              return {
                  section: section.section,
                  prof: profName || 'TBA',
                  seats: section.seats,
                  waitlist: section.waitlist,
                  rating: prof?.avgRating ?? null,
                  difficulty: prof?.avgDifficulty ?? null,
                  availabilityScore: (section.seats > 0 ? 3 : 0) + (section.waitlist > 0 ? 1 : 0)
              };
          })
          .filter(item => item.rating !== null && item.difficulty !== null)
          .sort((a, b) => {
              if (b.rating !== a.rating) return b.rating - a.rating;
              if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
              return b.availabilityScore - a.availabilityScore;
          });
    
      setRankedSections(ranked);
    }, [courseChart, profMetrics, profSections])


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
            <ScatterChart 
              margin={{ top: 20, right: 30, left: 20, bottom: 20}}
            >
              <XAxis 
                dataKey="avgDifficulty" 
                type='number'
                domain={[1,5]}
                ticks={[1,2,3,4,5]}
                name="Difficulty" 
                axisLine={false} 
                tickLine={false} tick={{ fill: '#ffffff' }} 
                label={{ 
                  value: 'Difficulty', 
                  position: 'insideBottom', 
                  offset: -10, 
                  fill: '#ffffff' 
                }} 
              />

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
                label={{ 
                  value: 'Rating', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 10,
                  fill: '#ffffff' 
                }} 
              />

              <Tooltip cursor={{ strokeDasharray: '3 3' }} />

              <CartesianGrid stroke="none" />

              <Scatter data={chartData} fill="#4f9dde">
                <LabelList 
                  dataKey='lastName'
                  position='top'
                  fill='#ffffff' 
                />
              </Scatter>
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

    function CourseSummary() {
        if (rankedSections.length === 0) {
            return (
                <div className="summary-container">
                    <h3>Course Summary</h3>
                    <p>No professor ratings available for this course.</p>
                </div>
            );
        }

        const bestSection = rankedSections[0];

        return (
            <div className="summary-container">
                <h3>Best Section Recommendation</h3>
                <div className="best-section">
                    <div className="section-header">
                        <span className="section-number">Section {bestSection.section}</span>
                        <span className="prof-name">{bestSection.prof}</span>
                    </div>
                    <div className="metrics-row">
                        <div className="metric">
                            <span className="metric-label">Rating</span>
                            <span className="metric-value">{bestSection.rating.toFixed(1)}/5.0</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Difficulty</span>
                            <span className="metric-value">{bestSection.difficulty.toFixed(1)}/5.0</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Availability</span>
                            <span className="metric-value">
                                {bestSection.seats > 0
                                    ? `${bestSection.seats} open seats`
                                    : bestSection.waitlist > 0
                                        ? `${bestSection.waitlist} waitlist spots`
                                        : 'Full'}
                            </span>
                        </div>
                    </div>
                </div>

                {rankedSections.length > 1 && (
                    <div className="all-sections">
                        <h4>All Sections Ranked</h4>
                        {rankedSections.map((section, idx) => (
                            <div key={section.section} className="section-row">
                                <span className="rank">#{idx + 1}</span>
                                <span className="section-info">
                                    Section {section.section} - {section.prof}
                                </span>
                                <span className="section-stats">
                                    ⭐ {section.rating.toFixed(1)} |
                                    📚 {section.difficulty.toFixed(1)} |
                                    {section.seats > 0
                                        ? `💺 ${section.seats}`
                                        : section.waitlist > 0
                                            ? `⏳ ${section.waitlist}`
                                            : '🚫'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
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
          <div className="top-controls">
            <button
              className="add-btn"
              onClick={() => navigate("/form")}
            >
              Add course
            </button>
            <button
              className="logout-btn"
              onClick={() => handleLogOut()}
            >
              Log out
            </button>
          </div>

          <div className="charts-row">
            <div className="chart-container">
              <div className="chart-header">
                <button
                  className="seat-btn"
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
          </div>

          <CourseSummary />
        </div>
      </>
    );
}