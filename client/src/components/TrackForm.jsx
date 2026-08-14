import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateForm } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';

import './TrackForm.css'

export default function TrackForm() { 
    const [subject, setSubject] = useState('COMP')
    const [courseNum, setCourseNum] = useState('2659')
    const [term , setTerm] = useState('Fall 2026')
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate();
    const userAgent = navigator.userAgent

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
          // show error on UI
          return
        }


      if (!res1.ok) {
        console.log('Submit failed: ', data1.error)
        // show error on UI
        return
      }

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
      
        const res3 = await fetch('http://localhost:3001/api/scrapper', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subject, courseNum, termCode, cookies})
        });
        const courseData = await res3.json();
        console.log('Course Data:', JSON.stringify(courseData, null, 2))
      
        
        const res4 = await fetch('http://localhost:3001/api/track', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subject, courseNum, courseData})
        });  
        await res4.json();
      } catch (err) {
        console.log(err)
        return
      }
      finally {
        setIsSubmitting(false)
      }
      
      await resetForm()
    };

    return (
        <>
        <div className='page-login'>
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
            </div>
          </div>
        </>
    )
}