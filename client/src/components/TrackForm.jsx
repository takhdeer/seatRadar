import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateForm } from '../utils/validation';
import './TrackForm.css'

export default function TrackForm() { 
    const [subject, setSubject] = useState('COMP')
    const [courseNum, setCourseNum] = useState('3612')
    const [term , setTerm] = useState('Fall 2026')
    const [errors, setErrors] = useState({})

    const navigate = useNavigate();
    const userAgent = navigator.userAgent

    
    async function handleSubmit(e) {
      e.preventDefault();
      const validErrors = validateForm({ subject, courseNum, term, requireMRU: false });
      if (Object.keys(validErrors).length > 0) {
        setErrors(validErrors);
        return;
      }

      const termCodes = {
        'Fall 2026': '202604',
        'Winter 2027': '202701'
      }

      const termCode = termCodes[term]

      const res1 = await fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, courseNum, termCode }),
      });

      const data1 = await res1.json();
      console.log(data1);

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
        body: JSON.stringify({courseData})
      });

      await res4.json();

      navigate("/done");
    };

    return (
        <>
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
                        onClick={(e) => handleSubmit(e)}>Submit</button>
                    </div>
                </form>
            </div>
        </>
    )
}