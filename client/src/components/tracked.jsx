import { useNavigate } from "react-router-dom"

export default function TrackedPage() {

    const navigate = useNavigate();
    setTimeout(() => {
        navigate('/dashboard')
    }, 3000);
    
    return (
        <>
        <div className="page-login">
            <p>Course added to tracked coruses</p>
        </div>
        </>
    )
}