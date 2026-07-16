import { useNavigate } from "react-router-dom"

export default function TrackedPage() {

    const navigate = useNavigate();
    setTimeout(() => {
        navigate('/dashboard')
    }, 3000);
    
    return (
        <>
            <p>Course added to tracked coruses</p>
        </>
    )
}