import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateForm } from '../utils/validation';
import './TrackForm.css'

export default function TrackForm() { 
    const [crn, setCRN] = useState('')
    const [term , setTerm] = useState('')
    const [errors, setErrors] = useState({})

    const navigate = useNavigate();
    const userAgent = navigator.userAgent

    
    async function handleSubmit(e) {
      e.preventDefault();
      const validErrors = validateForm({ crn, term, requireMRU: false });
      if (Object.keys(validErrors).length > 0) {
        setErrors(validErrors);
        return;
      }
      const res1 = await fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crn, term }),
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
      const data2 = await res2.json();
      console.log(data2)
      
      navigate("/done");
    };

    return (
        <>
            <div className="form-container">
                <div className="form-Header">
                    <h2>Add a course to track</h2>
                </div>
                <form>
                    <label className="form-label">CRN</label>
                    <input
                    className="form-input" 
                    id="crn"
                    value={crn}
                    onChange={(e) => setCRN(e.target.value)}
                    type = "text"
                    placeholder="ex. 123456"
                    />
                    {errors.crn && <p className="error">{errors.crn}</p>}
                    
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