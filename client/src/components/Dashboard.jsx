import { useEffect, useRef, useState } from 'react';
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList} from 'recharts';
import { ScatterChart, Scatter, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useSavedSchedule from '../utils/savedSchedule';
import LoadingSpinner from './loadingSpinner';
import { useLocation } from 'react-router-dom';
import { CourseSummary } from './CourseSummary';
import { ScheduleGrid } from './ScheduleGrid';

import './Dashboard.css'
export default function Dashboard() {

    const location = useLocation()

    const [courseChart, setCourseChart] = useState([])
    const [profName, setProfName] = useState([])
    const [profMetrics, setProfMetrics] = useState([])
    const [trackedCourses, setTrackedCourses] = useState(location.state?.prefetched ?? [])
    const [activeCourse, setActiveCourse] = useState()
    const [profSections, setProfSections] = useState([]) // [{ prof, section_id }]
    const [rankedSections, setRankedSections] = useState([])
    const [courseSchedules, setCourseSchedules] = useState({}) // { section:,days:,start:,end:,subject:,courseNum:}
    const scheduleCache = useRef({}) // survives re-renders
    const [sectionColors, setSectionColors] = useState({}) 
    const [selectedSections, setSelectedSections] = useState(new Set())
    const [hoveredSection, setHoveredSection] = useState(null) // previews one section in the charts
    const [showAllCourses, setShowAllCourses] = useState(true);
    const [showLabTut, setShowLabTut] = useState(true)
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    const navigate = useNavigate()
    // Sync schedules whenever the set of tracked courses changes

    function assignSectionColors(sectionIds) {
      // Assign colors: best section gets green, others get unique colors
      const colors = ['#6f9f7e', '#4f86b8', '#c9736b', '#d4a574', '#9b8fc9', '#6fb8b8', '#c98fb8', '#b8c96f'];
      const colorMap = {};
      sectionIds.forEach((id, idx) => {
        colorMap[id] = colors[idx % colors.length];
      });
      return colorMap
    }

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
              method: 'GET', // returns prof and section_id
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
                    method: 'GET', // returns RMP Ratings for profs 
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
          .sort((a, b) => {
            if (a.rating === null && b.rating === null) return 0;
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            if (b.rating !== a.rating) return b.rating - a.rating;
            if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
            return b.availabilityScore - a.availabilityScore;
          });
      
      setRankedSections(ranked);
      setSectionColors(assignSectionColors(ranked.map(s => s.section)));
      setIsLoading(false)
    }, [courseChart, profMetrics, profSections])


    useEffect(() => {
        async function getUserCourses() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('Current user Found')
                setUserId(user.id)
            }
            else {
                console.log('User not found')
                return
            }

            if (trackedCourses.length > 0) return

            const res = await fetch(`http://localhost:3001/api/getUserCourses?userEmail=${user.email}`, {
                method: 'GET', // returns courses tracked by user
                headers: {'Accept': 'application/json'}
            });
            const data = await res.json();
            setTrackedCourses(data)
        }
        getUserCourses()
    }, [])

    useEffect(() => {
      if (!activeCourse && trackedCourses.length > 0) {
        setActiveCourse(trackedCourses[0].course)
      }
    }, [trackedCourses, activeCourse]);

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
            <ResponsiveContainer width='100%' height='80%'>
                <BarChart data = {chartData}>
                    <XAxis
                      dataKey = 'course'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#2e2b26' }}
                    />
                    <YAxis
                      dataKey = 'total_waitlist'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#2e2b26' }}
                    />
                    <Tooltip />
                    <CartesianGrid stroke='none'/>
                    <Legend wrapperStyle={{ color: '#2e2b26' }} />
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
        const chartData = applySectionFilter(courseChart)
        const showWaitlist = chartData.length > 0 && chartData.every(s => s.seats === 0 && s.total_waitlist > 0)

        return showWaitlist
          ? <WaitlistChart chartData={chartData} />
          : <SeatsChart chartData={chartData} />
      }

      function renderProfChart() {
        if (profName.length === 0) {
            return <h3>No Prof available for this section</h3>;
        }
    
        const eff = getChartSections();
    
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
  
    // Hovered row overrides the selection for charts only (not for saving)
    function getChartSections() {
      if (hoveredSection) return { mode: 'include', ids: new Set([hoveredSection]) };
      return getEffectiveSections();
    }

    function applySectionFilter(data) {
        const eff = getChartSections();
        if (eff === null) return data;
        return eff.mode === 'exclude'
            ? data.filter(d => !eff.ids.has(d.section))
            : data.filter(d => eff.ids.has(d.section));
    }

    function handleCourseChange(e) {
      setActiveCourse(e.target.value);
      setSelectedSections(new Set());
    }

    const { 
      schedule: savedSchedule,
      loading: savedLoading,
      error: savedError,
      refreshSavedSchedule } = useSavedSchedule(userId);
    return (
      <>
        <div className="dashboard-container">
          <div className="main-content">
            <div className="top-section">
              {isLoading ? <LoadingSpinner />: (
                <CourseSummary
                  rankedSections={rankedSections}
                  activeCourse={activeCourse}
                  trackedCourses={trackedCourses}
                  handleCourseChange={handleCourseChange}
                  sectionColors={sectionColors}
                  setSelectedSections={setSelectedSections}
                  setHoveredSection={setHoveredSection}
                  showAllCourses={showAllCourses}
                  showLabTut={showLabTut}
                  setShowLabTut={setShowLabTut}
                  getEffectiveSections={getEffectiveSections}
                  userId={userId}
                  refreshSavedSchedule={refreshSavedSchedule}
                  activeChart={renderChart()}
                  profRatingChart={renderProfChart()}
                  selectedSections={selectedSections}
                />
              )}
              {isLoading ? <LoadingSpinner />: (
                <ScheduleGrid
                  showAllCourses={showAllCourses}
                  setShowAllCourses={setShowAllCourses}
                  savedSchedule={savedSchedule}
                  courseSchedules={courseSchedules}
                  activeCourse={activeCourse}
                  savedLoading={savedLoading}
                  savedError={savedError} 
                  assignSectionColors={assignSectionColors}
                  setSelectedSections={setSelectedSections}
                  sectionColors={sectionColors}
                  profSections={profSections}
                  applySectionFilter={applySectionFilter}
                />
              )}
            </div>
          </div>
        </div>
      </>
    );
}