import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { validateForm } from '../utils/validation';
import './Landing.css'

export default function SignUpPage(){
    const [email, setMRUEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate();
    const userAgent = navigator.userAgent


    async function handleSubmit(e) {

        // Finding browser for Playwright
        let browserType

        if (userAgent.includes('Firefox')) {
            browserType = 'firefox'
        }
        else if (userAgent.includes('Chrome')) {
            browserType = 'chromium'
        }
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browserType = 'webkit'
        }
        else {
            browserType = null
        }

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
            body: JSON.stringify({email, password}),
            signal: controller.signal
        });

        clearTimeout(timeout)
            
        const data = await res.json();
        console.log(data)

        if (res.status === 409) {
            setErrors({server: 'User Already Exists'})
        }

        if (res.status === 201) {
            navigate('/form')
        }
    }

    return (
        <>
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

               <div className='buttons'>
                    <button 
                    className='main-btn'
                    onClick={(e) => handleSubmit(e)}
                    >Create Account</button>
                </div>
                {errors.server && <p className='error'>{errors.server}</p>}
            </form>

        </div>
        </>
    )
}