import { useEffect, useRef, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList} from 'recharts';
import { ScatterChart, Scatter, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useOverlay } from '../context/OverlayContext';

import './Dashboard.css'
export default function Dashboard() {

    const [courseChart, setCourseChart] = useState([])
    const [activeChart, setActiveChart] = useState('seats')
    const [profName, setProfName] = useState([])
    const [profMetrics, setProfMetrics] = useState([])
    const [trackedCourses, setTrackedCourses] = useState([])
    const [activeCourse, setActiveCourse] = useState()
    const [profSections, setProfSections] = useState([]) // [{ prof, section_id }]
    const [rankedSections, setRankedSections] = useState([])
    const [courseSchedules, setCourseSchedules] = useState({}) // { section:,days:,start:,end:,subject:,courseNum:}
    const scheduleCache = useRef({}) // survives re-renders
    const [sectionColors, setSectionColors] = useState({}) 
    const [selectedSections, setSelectedSections] = useState(new Set())
    const [showAllCourses, setShowAllCourses] = useState(false);
    const [showLabTut, setShowLabTut] = useState(true)
    const [isLoading, setIsLoading] = useState(true);
    const { setShowOverlay, setMessage } = useOverlay()


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
        
            const schedule = data.scheduleData.map(row => {
              // Shorten class_type to Lec/Lab/Tut
              let classTypeShort = '';
              if (row.class_type) {
                const type = row.class_type.toLowerCase();
                if (type.includes('lecture')) classTypeShort = 'Lec';
                else if (type.includes('lab')) classTypeShort = 'Lab';
                else if (type.includes('tutorial')) classTypeShort = 'Tut';
              }

              return {
                subject: row.subject,
                courseNum: row.courseNum,
                term: row.term,
                section: row.section,
                days: row.days,
                start_time: row.start,
                end_time: row.end,
                classType: classTypeShort
              };
            });
        
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
          setIsLoading(true)
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
        console.log(`Active Course: ${activeCourse}`)
        console.log(courseChart)
    }, [courseChart, activeCourse])


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
      if (!activeCourse) return
      if (courseChart.length === 0 || profMetrics.length === 0 || profSections.length === 0) {
          setRankedSections([]);
          setIsLoading(false)
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

              // Shorten class_type to Lec/Lab/Tut
              let classTypeShort = '';
              if (section.class_type) {
                  const type = section.class_type.toLowerCase();
                  if (type.includes('lecture')) classTypeShort = 'Lec';
                  else if (type.includes('lab')) classTypeShort = 'Lab';
                  else if (type.includes('tutorial')) classTypeShort = 'Tut';
              }

              return {
                  section: section.section,
                  prof: profName || 'TBA',
                  seats: section.seats,
                  waitlist: section.waitlist,
                  rating: prof?.avgRating ?? null,
                  difficulty: prof?.avgDifficulty ?? null,
                  availabilityScore: (section.seats > 0 ? 3 : 0) + (section.waitlist > 0 ? 1 : 0),
                  classType: classTypeShort
              };
          })
          .filter(item => item.rating !== null && item.difficulty !== null)
          .sort((a, b) => {
              if (b.rating !== a.rating) return b.rating - a.rating;
              if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
              return b.availabilityScore - a.availabilityScore;
          });

      setRankedSections(ranked);

      // Assign colors: best section gets green, others get unique colors
      const colors = ['#6f9f7e', '#4f86b8', '#c9736b', '#d4a574', '#9b8fc9', '#6fb8b8', '#c98fb8', '#b8c96f'];
      const colorMap = {};
      ranked.forEach((section, idx) => {
          colorMap[section.section] = colors[idx % colors.length];
      });
      setSectionColors(colorMap);
      setIsLoading(false)
    }, [courseChart, profMetrics, profSections])


    useEffect(() => {
        async function getUserCourses() {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                console.log('Current user Found')
            }
            else {
                console.log('User not found')
                return
            }

            const res = await fetch(`http://localhost:3001/api/getUserCourses?userID=${user.id}`, {
                method: 'GET',
                headers: {'Accept': 'application/json'}
            });
            const data = await res.json();
            setTrackedCourses(data)
            const data2 = data[0].course
            setActiveCourse(data2)
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
                      tick={{ fill: '#2e2b26' }}
                     />
                    <YAxis
                      dataKey = 'total_seats'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#2e2b26' }}
                    />
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Legend wrapperStyle={{ color: '#2e2b26' }} />
                    <Bar dataKey = 'seats' stackId='a' fill='#6f9f7e' name='Available' />
                    <Bar dataKey='seatsTaken' stackId='a' fill='#c9736b' name='Taken' />
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
                      tick={{ fill: '#2e2b26' }}
                    />
                    <YAxis
                      dataKey = 'waitlist'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#2e2b26' }}
                    />
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Bar dataKey = "waitlist" stackId='a' fill='#6f9f7e' name='Available' />
                    <Bar dataKey = "waitlistTaken" stackId='a' fill='#c9736b' name='Taken' />
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
                tickLine={false} tick={{ fill: '#2e2b26' }}
                label={{
                  value: 'Difficulty',
                  position: 'insideBottom',
                  offset: -10,
                  fill: '#2e2b26'
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
                tick={{ fill: '#2e2b26' }}
                label={{
                  value: 'Rating',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fill: '#2e2b26'
                }}
              />

              <Tooltip cursor={{ strokeDasharray: '3 3' }} />

              <CartesianGrid stroke="none" />

              <Scatter data={chartData} fill="#4f86b8">
                <LabelList
                  dataKey='lastName'
                  position='top'
                  fill='#2e2b26'
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
    }

    function renderChart() {
        if (activeChart === 'seats') {
          return (
            <SeatsChart chartData={applySectionFilter(courseChart)} />
          )
        } else {
          return (
            <WaitlistChart chartData={applySectionFilter(courseChart)} />
          )
        }
      }

      function renderProfChart() {
        if (profName.length === 0) {
            return <h3>No Prof available for this section</h3>;
        }
    
        const eff = getEffectiveSections();
    
        if (eff === null) {
            return <ProfRatingChart chartData={profMetrics} />;
        }
    
        const sectionProfs = eff.mode === 'exclude'
            ? profSections.filter(ps => !eff.ids.has(ps.section_id))
            : profSections.filter(ps => eff.ids.has(ps.section_id));
    
        const profLastNames = sectionProfs.map(sp => sp.prof);
        const filteredMetrics = profMetrics.filter(pm =>
            profLastNames.some(name => name.toLowerCase().includes(pm.lastName.toLowerCase()))
        );
    
        return <ProfRatingChart chartData={filteredMetrics} />;
    }

    function getEffectiveSections() {
      const labTutSections = new Set(
          rankedSections
              .filter(s => s.classType === 'Lab' || s.classType === 'Tut')
              .map(s => s.section)
      );
  
      if (selectedSections.size === 0) {
          if (showLabTut) return null; // null = no filtering, show everything
          return { mode: 'exclude', ids: labTutSections };
      }
  
      const ids = new Set(selectedSections);
      if (showLabTut) {
          labTutSections.forEach(id => ids.add(id));
      }
      return { mode: 'include', ids };
    }
  
    function applySectionFilter(data) {
        const eff = getEffectiveSections();
        if (eff === null) return data;
        return eff.mode === 'exclude'
            ? data.filter(d => !eff.ids.has(d.section))
            : data.filter(d => eff.ids.has(d.section));
    }

    async function saveSelection(course) {
      const eff = getEffectiveSections();
      const idsToSave = eff === null
          ? []
          : eff.mode === 'exclude'
              ? rankedSections.filter(s => !eff.ids.has(s.section)).map(s => s.section)
              : Array.from(eff.ids);

      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('http://localhost:3001/api/selectedSections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          course,
          sectionIds: idsToSave
        })
      });
      const data = await res.json();
      console.log(data);
      setMessage(data.message)
      setShowOverlay(true)
      if (!res.ok) {
        console.error('Save failed:', data.error);
      }
    }

    function ScheduleGrid() {
        const days = ['M', 'T', 'W', 'R', 'F'];
        const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 9pm

        // Collect all valid schedule entries across all tracked courses
        const allSchedules = [];
        const sections = courseSchedules[activeCourse]
        if (showAllCourses) {
          Object.entries(courseSchedules).forEach(([courseName, sections]) => {
            if (!Array.isArray(sections)) return
              sections.forEach(section =>{
                if (section.days && section.start_time && section.end_time) {
                  allSchedules.push({
                    courseName,
                    section: section.section,
                    days: section.days,
                    start: section.start_time,
                    end: section.end_time,
                    classType: section.classType
                  })
                }
              }) 
          })
        }
        else {
          if (Array.isArray(sections)) {
            sections.forEach(section => {
              if (section.days && section.start_time && section.end_time) {
                allSchedules.push({
                  courseName: activeCourse,
                  section: section.section,
                  days: section.days,
                  start: section.start_time,
                  end: section.end_time,
                  classType: section.classType
                });
              }
            });
          }
        }

        if (allSchedules.length === 0) {
            return null;
        }

        // Filter schedules based on selectedSections
        const filteredSchedules = applySectionFilter(allSchedules)

        // Convert time string (HH:MM) to decimal hours
        const timeToHours = (timeStr) => {
          const hours = parseInt(timeStr.slice(0, -2), 10);
          const minutes = parseInt(timeStr.slice(-2), 10);
          return hours + minutes / 60;
      };

        return (
            <div className="schedule-grid-container">
              <div className='toggles'>
                <h4>Weekly Schedule</h4>
                <div className='toggle-right'>
                  <h5>Currently Showing:</h5> 
                  <button className='toggle-button'
                  onClick={() => 
                    setShowAllCourses(prev => !prev)}>{showAllCourses === true ? "All Courses" : "Selected Course"}</button>
                </div>
              </div>
                <div className="schedule-grid">
                    <div className="time-labels">
                        <div className="corner-cell"></div>
                        {hours.map(hour => (
                            <div key={hour} className="time-label">
                                {hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                            </div>
                        ))}
                    </div>
                    <div className="grid-content">
                        {days.map((day) => (
                            <div key={day} className="day-column">
                                <div className="day-header">{day}</div>
                                <div className="day-cells">
                                    {hours.map((hour, hourIdx) => (
                                        <div key={hourIdx} className="time-cell">
                                            {filteredSchedules
                                                .filter(schedule => {
                                                    // Check if this day is included
                                                    if (!schedule.days.includes(day)) return false;

                                                    const startHour = timeToHours(schedule.start);
                                                    const endHour = timeToHours(schedule.end);

                                                    // Check if this hour overlaps with the course time
                                                    return hour >= startHour && hour < endHour;
                                                })
                                                .map((schedule, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="course-block"
                                                        style={{ backgroundColor: sectionColors[schedule.section] || '#4f86b8' }}
                                                    >
                                                        <span className="course-name">{schedule.courseName}</span>
                                                        <span className="course-section">
                                                            §{schedule.section} {schedule.classType && `· ${schedule.classType}`}
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    function handleCourseChange(e) {
      setActiveCourse(e.target.value);
      setSelectedSections(new Set());
    }
  
    function CourseSelector() {
      return (
          <select value={activeCourse} onChange={handleCourseChange}>
              {trackedCourses.map((item, index) => (
                  <option key={index} value={item.course}>
                      {item.course}
                  </option>
              ))}
          </select>
      );
    }

    function CourseSummary() {
        if (rankedSections.length === 0) {
            return (
              <CourseSelector />
            )
        }

        const bestSection = rankedSections[0];

        const toggleSection = (sectionId) => {
            setSelectedSections(prev => {
                const newSet = new Set(prev);
                if (newSet.has(sectionId)) {
                    newSet.delete(sectionId);
                } else {
                    newSet.add(sectionId);
                }
                return newSet;
            });
        };

        return (
            <div className="summary-container">
                <h3>Best Section</h3>
                <div className="section-title-row">
                    <CourseSelector />
                    <button className="menu-item" onClick={() => navigate("/form")}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Course
                    </button>
                    <button className="menu-item" onClick={() => saveSelection(activeCourse)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Save Course
                    </button>
                 </div>
                <div className="best-section" style={{ borderLeft: `4px solid ${sectionColors[bestSection.section] || '#6f9f7e'}` }}>
                    <div className="section-header">
                        <span className="section-number">§{bestSection.section}</span>
                        <span className="prof-name">{bestSection.prof}</span>
                    </div>
                    <div className="metrics-row">
                        <div className="metric">
                            <span className="metric-label">Rating</span>
                            <span className="metric-value">{bestSection.rating.toFixed(1)}/5</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Difficulty</span>
                            <span className="metric-value">{bestSection.difficulty.toFixed(1)}/5</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Seats</span>
                            <span className="metric-value">
                                {bestSection.seats > 0
                                    ? `${bestSection.seats} open`
                                    : bestSection.waitlist > 0
                                        ? `${bestSection.waitlist} wait`
                                        : 'Full'}
                            </span>
                        </div>
                    </div>
                </div>

                {rankedSections.length > 1 && (
                    <div className="all-sections">
                        <div className='Sections-toggle'>
                          <h4>All Sections</h4>
                          <button 
                          className='idk-yet'
                          onClick={() => setShowLabTut(prev => !prev)}>
                            {showLabTut ? 'Hide Lab/Tut' : 'Show Lab/Tut'}
                          </button>
                        </div>
                        {rankedSections.map((section, idx) => (
                            <div
                                key={section.section}
                                className="section-row"
                                style={{
                                    borderLeft: `4px solid ${sectionColors[section.section] || '#6f9f7e'}`,
                                    opacity: selectedSections.size === 0 || selectedSections.has(section.section) ? 1 : 0.4,
                                    cursor: 'pointer'
                                }}
                                onClick={() => toggleSection(section.section)}
                            >
                                <span className="rank">#{idx + 1}</span>
                                <span className="section-info">
                                    §{section.section} {section.classType && `· ${section.classType}`} · {section.prof}
                                </span>
                                <span className="section-stats">
                                    ⭐ {section.rating.toFixed(1)} · 
                                    📚 {section.difficulty.toFixed(1)} · 
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
          <aside className="sidebar">
            <div className="sidebar-content">
              <div className="sidebar-menu">
                <button className="menu-item active">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </button>   

                <button className="menu-item" onClick={() => navigate("/form")}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Course
                </button>
              </div>
            </div>

            <div className="sidebar-footer">
              <button className="logout-btn" onClick={() => handleLogOut()}>
                Log out
              </button>
            </div>
          </aside>

          <div className="main-content">
            <div className="top-section">
              {isLoading ? <p>Loading Summary...</p>: <CourseSummary />}
              {isLoading ? <p>Loading schedule...</p>: <ScheduleGrid />}
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
                </div>

                {isLoading ? <p>Loading...</p> : renderChart()}
              </div>

              <div className="chart-container">
              {isLoading ? <p>Loading...</p> : renderProfChart()}
              </div>
            </div>
          </div>
        </div>
      </>
    );
}