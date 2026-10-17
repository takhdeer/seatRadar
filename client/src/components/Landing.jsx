import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { validateForm } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';
import { useOverlay } from '../context/OverlayContext';
import './Landing.css'

export default function LandingPage() {
    const [email, setMRUEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(0)
    const [dashbaordData, setDashboardData] = useState(null)
    const { setShowOverlay, setMessage } = useOverlay()

    const navigate = useNavigate();

    useEffect(() => {
        if (step !== 1) return
        fetch (`http://localhost:3001/api/getUserCourses?userEmail=${email}`)
            .then(r => r.json())
            .then(data => setDashboardData(data))
            .catch(() => {})
    }, [step])

    async function handleEmailSubmit(e) {
        e.preventDefault()
        const validateErrors = validateForm({email: email, requireMRU: true})
        if (Object.keys(validateErrors).length >0) {
            setErrors(validateErrors)
            return
        }

        setStep(1)
    }
    async function handlePasswordSubmit(e) {

        e.preventDefault();
        const validErrors = validateForm({password: password});
        if (Object.keys(validErrors).length >0) {
            setErrors(validErrors)
            return
        }
        setIsSubmitting(true)

        //timeout logic
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) 

        const res = await fetch('http://localhost:3001/api/usr-login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password}),
            signal: controller.signal
        });
        
        clearTimeout(timeout)

        const data = await res.json();

        if (res.status === 403) {
            setMessage('Confirm email, please check inbox')
            setShowOverlay(true)
            setIsSubmitting(false)
            return
        }
        if (res.status === 200) {
            const { error } = await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token
            });

            if (error) {
                console.log('Could not set session', error)
                setIsSubmitting(false)
                return
            }
            
            navigate('/dashboard', {state: {email, prefetched: dashbaordData} })
            setStep(0)
        }

        else if (res.status === 400) {
            setErrors({server: 'User Does Not Exist'})
            setIsSubmitting(false)
        }

        if (res.status === 401) {
            setMessage('Invalid Email or Password')
            setShowOverlay(true)
        }
        setIsSubmitting(false)
    }

    useEffect(() => {
        if (step == 1) {
            // fetch dashboard data 
            // save dashboard data
        }
    }, [step])

    return (
        <>
        <div className='page-login'>
            <div className='form-login'>
            <h2>Login to your SeatRadar Account</h2>
            {step === 0 && (
                <form onSubmit={handleEmailSubmit}>
                    <label className='form-label'>Email</label>
                    <input
                    className='login-input'
                    id='email'
                    value={email}
                    type='text'
                    placeholder='example@mtroyal.ca'
                    onChange={(e) => setMRUEmail(e.target.value)}
                    />
                    {errors.email && <p className="error">{errors.email}</p>}

                    <div className='buttons'>
                        <button
                        type='submit' 
                        className='show-password'
                        disabled={isSubmitting}
                        >Continue</button>
                        {errors.server && <p className='error'>{errors.server}</p>}
                    </div>
                    <div className='new-user'>
                        <p>New User?</p>
                        <a href='/signup'>SignUp</a>
                    </div>
                </form>
            )}
            {step === 1 && (
                <form>
                    <label className='form-label'>Password</label>
                    <div className='password-wrapper'>
                    <input
                    className='login-input password'
                    id='password'
                    value={password}
                    placeholder='Type password here...'
                    type={showPassword ? 'text' : 'password'}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                    type='button'
                    className='show-password'
                    onClick={() => setShowPassword(!showPassword)} 
                    >{ showPassword ? 'Hide' : 'Show'}</button>
                    </div>  
                    {errors.password && <p className="error">{errors.password}</p>}

                    <div className='buttons'>
                        <button 
                        className='show-password'
                        disabled={isSubmitting}
                        onClick={(e) => handlePasswordSubmit(e)}
                        >LogIn</button>
                        {errors.server && <p className='error'>{errors.server}</p>}
                    </div>
                </form>
            )}
            </div>
        </div>
        </>
    )
}