import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateForm } from "../utils/validation";
import './TrackForm.css'

export default function TrackForm() { 
    const [crn, setCRN] = useState('')
    const [term , setTerm] = useState('')
    const [email, setEmail] = useState('')

    const navigate = useNavigate();
    
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm(email,crn,term)) return
        const res = await fetch("http://localhost:3001/api/submit", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({crn, term, email})
        });

        navigate('/done')
        const data = await res.json();
        console.log(data);
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
                    <label className="form-label">Email</label>
                    <input 
                    className="form-input"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex. test@gmail.com"
                    />
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