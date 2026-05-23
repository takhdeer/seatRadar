import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { validateForm } from '../utils/validation';
import './Landing.css'

export default function LandingPage(){
    const [mruEmail, setMRUEmail] = useState('')
    const [mruPassword, setMRUPass] = useState('')

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm(mruEmail, mruPassword)) return
            const res = await fetch('http://localhost:3001/api/mru-login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mruEmail, mruPassword})
            });
            
        navigate('/form')
        const data = await res.json();
        console.log(data)
    }

    return (
        <>
        <div className="page-login">
            <h2>Connect Your MRU Account</h2>
            <form>
                <label className='form-label'>MRU Email</label>
                <input
                className='form-input'
                id='mruEmail'
                value={mruEmail}
                type='text'
                placeholder='example@mtroyal.ca'
                onChange={(e) => setMRUEmail(e.target.value)}
                />

                <label className='form-label'>MRU Password</label>
                <input
                className='form-input'
                id='mruPassword'
                value={mruPassword}
                type='text'
                placeholder='123456'
                onChange={(e) => setMRUPass(e.target.value)}
                />

                <button 
                className='main-btn'
                onClick={(e) => handleSubmit(e)}
                >Submit</button>
                <p>Why we need this?</p>
            </form>

        </div>
        </>
    )
}