import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateForm } from "../utils/validation";
import './TrackForm.css'

export default function TrackForm() { 
    const [crn, setCRN] = useState('')
    const [term , setTerm] = useState('')
    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState({})

    const navigate = useNavigate();
    
    async function handleSubmit(e) {
        e.preventDefault();
        const validErrors = validateForm({email,crn,term});
        if (Object.keys(validErrors).length >0) {
            setErrors(validErrors)
            return
        }
        const res = await fetch("http://localhost:3001/api/submit", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({crn, term, email})
        });
        const data = await res.json();
        console.log(data);
        navigate('/done')

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

                    <label className="form-label">Email</label>
                    <input 
                    className="form-input"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex. test@gmail.com"
                    />
                    {errors.email && <p className="error">{errors.email}</p>}

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