import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import LoadingSpinner from "./loadingSpinner";

export default function ProtectedRoute({ children }) {

    const [session, setSession] = useState('Checking')

    const navigate = useNavigate()

    useEffect(() => {
            const { data: listener } = supabase.auth.onAuthStateChange((currentEvent, newSession) => {
                    console.log(currentEvent)
                    setSession(newSession)
            })

        return () => listener.subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (session == null) {
            console.log('Session not set') 
            navigate('/')
        }
    },[session, navigate])

    if (session == 'Checking') {
        console.log('Still checking') 
        return <LoadingSpinner />
    }

    if (session == null) {
        return null
    }

    return children
}

