import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { validateForm } from '../utils/validation';
import './Landing.css'
import { supabase } from '../utils/supabaseClient';
import { useOverlay } from '../context/OverlayContext';

export default function SignUpPage(){
    const [email, setMRUEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [username, setusername] = useState('')
    const { setShowOverlay, setMessage } = useOverlay()

    const navigate = useNavigate();

    async function handleSubmit(e) {

        //timeout logic
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)

        e.preventDefault();
        const validErrors = validateForm({email: email, password: password, confirmPassword: confirmPassword,requireMRU: true});
        if (Object.keys(validErrors).length >0) {
            setErrors(validErrors)
            return
        }

        const res = await fetch('http://localhost:3001/api/usr-signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, username}),
            signal: controller.signal
        });

        clearTimeout(timeout)
            
        const data = await res.json();
        console.log(data)

        if (res.status === 409) {
            setErrors({server: 'User Already Exists'})
        }
        if (res.status === 400) {
            setMessage('Please confirm email sent to inbox')
            setShowOverlay(true)
        } 
        if (res.status === 500) {
            setMessage('Can not send Confirmation Email')
            setShowOverlay(true)
        }
        if (res.status === 201) {
            const { error } = await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token
            });

            if (error) {
                console.log('Could not set session', error)
                return
            }
            setTimeout(() => {
                navigate('/')
            }, 3000);
        }
    }

    return (
        <>
        <div className='page-login'>
            <div className="form-container">
                <h2>Create your SeatRadar Account</h2>
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

                    <label className='form-label'>Confirm Password</label>
                    <div className='password-wrapper'>
                        <input
                        className='form-input password'
                        id='confirmPassword'
                        value={confirmPassword}
                        type={showPassword ? 'text' : 'password'}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

                    <label className='form-label'>Username</label>
                    <div>
                        <input
                        className='form-input'
                        id='username'
                        value={username}
                        type='text'
                        onChange={(e) => setusername(e.target.value)}
                        />
                    </div>
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

                <div className='buttons'>
                        <button 
                        className='main-btn'
                        onClick={(e) => handleSubmit(e)}
                        >Create Account</button>
                        <button 
                        className='main-btn'
                        onClick={navigate('/')}
                        >Log in</button>
                    </div>
                </form>

            </div>
        </div>

        </>
    )
}