import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function PublicRoute({ children }) {

    const [session, setSession] = useState('Checking')

    const navigate = useNavigate();

    useEffect(() => {
            const { data: listener } = supabase.auth.onAuthStateChange((currentEvent, newSession) => {
                    console.log(currentEvent)
                    setSession(newSession)
            })

        return () => listener.subscription.unsubscribe()
    }, [])

    useEffect(() => {        
        if (session !=='Checking' && session !== null) {
            console.log('Session is set')
            navigate('/dashboard')
        }
    }, [session, navigate])

    if (session == 'Checking') {
        console.log('Still checking') 
        return 'Loading' // Replace with loading spinner
    }

    return children

}