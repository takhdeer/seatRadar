import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { validateForm } from '../utils/validation';
import './Landing.css'
import { useOverlay } from '../context/OverlayContext';

export default function SignUpPage(){
    const [email, setMRUEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [username, setusername] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { setShowOverlay, setMessage } = useOverlay()
    const [step, setStep] = useState(0)

    const navigate = useNavigate();


    async function handleEmailSubmit(e) {
        e.preventDefault()
        const validateErrors = validateForm({email: email, requireMRU: true})
        if (Object.keys(validateErrors).length >0) {
            setErrors(validateErrors)
            return
        }

        setIsSubmitting(true)

        const res = await fetch(`http://localhost:3001/api/checkEmail?email=${email}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        });

        const data = await res.json();
        if (res.status !==201) {
            setErrors({server: data.message})
            setIsSubmitting(false)
            return
        }

        setIsSubmitting(false)
        setStep(1)
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true)
        const validErrors = validateForm({password: password, confirmPassword: confirmPassword});
        if (Object.keys(validErrors).length >0) {
            setErrors(validErrors)
            setIsSubmitting(false)
            return
        }

        setIsSubmitting(false)
        setStep(2)
    }

    async function handleSubmit(e) {

        //timeout logic
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)

        setIsSubmitting(true)

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
            setIsSubmitting(false)
        } 
        if (res.status === 500) {
            setMessage('Password is not secure')
            setShowOverlay(true)
            setIsSubmitting(false)
        }
        if (res.status === 201) {
            setMessage('Confirm email, check your inbox')
            setShowOverlay(true)
            navigate('/')
        }
        if (res.status === 503) {
            setMessage(`Database Error: ${data.detail}`)
            setShowOverlay(true)
        }
        setIsSubmitting(false)
    }

    return (
        <>
        <div className='page-login'>
            <div className="form-login">
                <div className="signup-heading">
                    <h2>Create your SeatRadar Account</h2>
                    <button
                        type="button"
                        id='back-btn'
                        className="show-password"
                        aria-label="Go back"
                        onClick={() => navigate(-1)}
                    >&lt;</button>
                </div>
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

                        <button
                            type='submit' 
                            className='show-password'
                            disabled={isSubmitting}
                            >Continue</button>
                        {errors.server && <p className='error'>{errors.server}</p>}
                    </form>
                )}
                {step === 1 && (
                <form onSubmit={handlePasswordSubmit}>
                    <label className='form-label'>Password</label>
                    <div className='password-wrapper'>
                        <input
                        className='login-input password'
                        id='password'
                        value={password}
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Type password here...'
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
                        className='login-input password'
                        id='confirmPassword'
                        value={confirmPassword}
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Confirm password...'
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                    <button
                        type='submit' 
                        className='show-password'
                        disabled={isSubmitting}
                        >Continue</button>
                </form>
                )}
                {step === 2 && (
                <form>
                    <label className='form-label'>Username</label>
                    <div>
                        <input
                        className='login-input'
                        id='username'
                        value={username}
                        type='text'
                        placeholder='Username'
                        onChange={(e) => setusername(e.target.value)}
                        />
                    </div>

                <div className='buttons'>
                        <button 
                        className='show-password'
                        disabled={isSubmitting}
                        onClick={(e) => handleSubmit(e)}
                        >Create Account</button>
                    </div>
                </form>
                )}
            </div>
        </div>

        </>
    )
}