import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { validateForm } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';
import './Landing.css'

export default function LandingPage() {
    const [email, setMRUEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate();

    async function handleSubmit(e) {

        e.preventDefault();
        const validErrors = validateForm({email: email, password: password,requireMRU: true});
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
            
            navigate('/dashboard')
        }

        else if (res.status === 400) {
            setErrors({server: 'User Does Not Exist'})
            setIsSubmitting(false)
        }
        setIsSubmitting(false)
    }

    return (
        <>
        <div className='page-login'>
            <div className='form-container'>
                <h2>Login to your SeatRadar Account</h2>
                <form>
                    <label className='form-label'>Email</label>
                    <input
                    className='form-input'
                    id='email'
                    value={email}
                    type='text'
                    placeholder='example@mtroyal.ca'
                    onChange={(e) => setMRUEmail(e.target.value)}
                    />
                    {errors.email && <p className="error">{errors.email}</p>}

                    <label className='form-label'>Password</label>
                    <div className='password-wrapper'>
                    <input
                    className='form-input password'
                    id='password'
                    value={password}
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
                        className='main-btn'
                        disabled={isSubmitting}
                        onClick={(e) => handleSubmit(e)}
                        >LogIn</button>
                    {errors.server && <p className='error'>{errors.server}</p>}

                        <button
                        type='button'
                        className='main-btn'
                        disabled={isSubmitting}
                        onClick={() => navigate('/signup')}
                        >SignUp</button>
                    </div> 
                </form>
            </div>
        </div>
        </>
    )
}