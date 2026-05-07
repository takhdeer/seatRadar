import { useNavigate } from 'react-router-dom'
import './Landing.css'

export default function LandingPage(){
    async function handleLogin() {
        // handle login via microsoft playwright
    }
    const navigate = useNavigate();

    return (
        <>
        <div className="page-login">
            <h2>Connect Your MRU Account</h2>
            <button 
            className='main-btn'
            onClick={() => navigate('/form')}
            >Go to: Form</button>
            <p>Why we need this?</p>
        </div>
        </>
    )
}