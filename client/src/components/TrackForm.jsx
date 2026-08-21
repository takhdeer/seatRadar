import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateForm } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';
import { useOverlay } from '../context/OverlayContext'
import LoadingSpinner from './loadingSpinner';

import './TrackForm.css'

export default function TrackForm() { 
    const [subject, setSubject] = useState('COMP')
    const [courseNum, setCourseNum] = useState('2659')
    const [term , setTerm] = useState('Fall 2026')
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { setShowOverlay, setMessage } = useOverlay()
    const [trackedCourses, setTrackedCourses] = useState([])

    const navigate = useNavigate();
    const userAgent = navigator.userAgent

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
  }

    const undoStack = []  // push successful endpoints onto undoStack

    useEffect(() => {
      getUserCourses()
    }, [])

    useEffect(() => {
      console.log(trackedCourses)
    }, [trackedCourses])

    async function resetForm() {
      setSubject('')
      setCourseNum('')
      setTerm('')
      setErrors({})
      setIsSubmitting(false)
    }

    async function handleSubmit(e) {
      e.preventDefault();
      const validErrors = validateForm({ subject, courseNum, term, requireMRU: false });
      if (Object.keys(validErrors).length > 0) {
        setErrors(validErrors);
        return;
      }

      setIsSubmitting(true)

      const termCodes = {
        'Fall 2026': '202604',
        'Winter 2027': '202701'
      }

      const termCode = termCodes[term]

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.log('Could not set session', error)
        return
      }

      const access_token = data.session.access_token;

      try {
        const res1 = await fetch("http://localhost:3001/api/submit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${access_token}`
          },
          body: JSON.stringify({ subject, courseNum, termCode }),
        });
        const data1 = await res1.json();
        console.log(data1);

        if (!res1.ok) {
          console.log('Submit failed: ', data1.error)
          setMessage(`Submit Failed: ${data1.error}`)
          setShowOverlay(true)
          setIsSubmitting(false)
          return
        } else {
          setMessage(`Tracking... ${subject} ${courseNum}`)
          setShowOverlay(true)
        }

        undoStack.push(() => fetch ('http://localhost:3001/api/submit', {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${access_token}`
          },
          body: JSON.stringify({ subject, courseNum, termCode }),
        }));


      // Finding browser for Playwright
      let browserType;

      if (userAgent.includes("Firefox")) {
        browserType = "firefox";
      } else if (userAgent.includes("Chrome")) {
        browserType = "chromium";
      } else if (
        userAgent.includes("Safari") &&
        !userAgent.includes("Chrome")
      ) {
        browserType = "webkit";
      } else {
        browserType = null;
      }

        const res2 = await fetch('http://localhost:3001/api/cookies', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({browserType})
        });
        const cookies = await res2.json();
        console.log(cookies)

        if (!res2.ok) {
          console.log('Cookie Getter Failed: ', data2.error)
          setMessage('Error Occured from MRU database')
          setShowOverlay(true)
          return
        }

        undoStack.push(() => fetch ('http://localhost:3001/api/cookies', {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({browserType})
        }));
      
        const res3 = await fetch('http://localhost:3001/api/scrapper', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subject, courseNum, termCode, cookies})
        });
        const courseData = await res3.json();
        console.log('Course Data:', JSON.stringify(courseData, null, 2))

        if (!res3.ok) {
          console.log('Scrapping Data Failed: ', courseData.error)
          setMessage('Could not get course data from MRU')
          setShowOverlay(true)
          setIsSubmitting(false)
          return
        }

        undoStack.push(() => fetch ('http://localhost:3001/api/scrapper', {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subject, courseNum, termCode, cookies})
        }));
      
        const res4 = await fetch('http://localhost:3001/api/track', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subject, courseNum, courseData})
        });  
        await res4.json();

        if (!res4.ok) {
          console.log('Database Error: ', res4.error)
          setMessage('Database error')
          setShowOverlay(true)
          setIsSubmitting(false)
          return
        }

        undoStack.push(() => fetch ('http://localhost:3001/api/track', {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subject, courseNum, courseData})
        }));

        await getUserCourses()
        setIsSubmitting(false)
        
      } catch (err) {
        console.log(err)
        console.log('------ Undoing Successful Endpints ------')
        for (const undo of undoStack.reverse()) {
          await undo().catch(e => console.error('Rollback Failed: ', e));
        }
        setIsSubmitting(false)
      }
      await resetForm()
    };

    async function handleRemove(tc) {
      const split = tc.course.split(' ')
      const subject = split[0]
      const number = split[1]
      const term = tc.term
      try {
        const res = await fetch(`http://localhost:3001/api/delCourse?subject=${subject}&courseNum=${number}&term=${term}`, {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'}
        });

        if (!res.ok) {
          console.error('Delete failed:', res.status, res.statusText);
          return;
        }

        const data = await res.json();
        console.log(data);
        setMessage(data.message)
        setShowOverlay(true)
        // Only update UI after successful delete
        setTrackedCourses(prev => prev.filter(c => c.course !== tc.course));
      } catch (err) {
        console.error('Error removing course:', err);
      }
    }

    return (
        <>
        <div className='page-login'>
            <div className="cards-container">
                <div className="form-container">
                    <div className="form-Header">
                        <h2>Add a course to track</h2>
                    </div>
                    <form>
                        <label className='form-label'>Subject</label>
                        <select
                        className='course-name'
                        id='subject'
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        >
                          <option></option>
                          <option>COMP</option>
                          <option>MATH</option>
                        </select>
                        {errors.subject && <p className="error">{errors.subject}</p>}

                        <label className="form-label">Course Number</label>
                        <input
                        className="form-input"
                        id="courseNum"
                        value={courseNum}
                        onChange={(e) => setCourseNum(e.target.value)}
                        type = "text"
                        placeholder="ex. 2659"
                        />
                        {errors.courseNum && <p className="error">{errors.courseNum}</p>}

                        <label className="form-label">Term</label>
                        <select
                        className="form-select"
                        id="term"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        >
                            <option></option>
                            <option>Fall 2026</option>
                            <option>Winter 2027</option>
                        </select>
                        {errors.term && <p className="error">{errors.term}</p>}

                        <div className="buttons">
                            <button
                            className="main-btn"
                            name="submit"
                            disabled={isSubmitting}
                            onClick={(e) => handleSubmit(e)}>
                              {isSubmitting ? `Submitting...` : 'Submit'}
                            </button>

                            <button
                            className="main-btn"
                            name="dashboard"
                            disabled={isSubmitting}
                            onClick={() => navigate("/dashboard")}>
                              Dashboard
                            </button>
                        </div>
                    </form>
                    {isSubmitting && <LoadingSpinner />}
                </div>

                <div className="tracked-courses-container">
                    <div className="tracked-header">
                        <h2>Tracked Courses</h2>
                        <span className="course-count">3 courses</span>
                    </div>

                    <div className="tracked-courses-list">
                      {trackedCourses.map((tc, idx) => (
                        <div className="tracked-course-item">
                          <div key={idx} className="course-info">
                            <span className="course-code">{tc.course}</span>
                            <span className="course-term">{tc.term}</span>
                          </div>
                            <button 
                            className="remove-btn"
                            onClick={() => handleRemove(tc)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                      ))}
                    </div>

                    {trackedCourses.length === 0 && (
                      <div className="empty-state" style={{ display: 'none' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p>No courses tracked yet</p>
                        <span>Add a course to get started</span>
                      </div>
                    )}
                </div>
            </div>
          </div>
        </>
    )
}