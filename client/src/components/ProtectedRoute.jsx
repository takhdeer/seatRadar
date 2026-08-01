import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function ProtectedRoute({ children }) {

    const [session, setSession] = useState('Checking')

    const navigate = useNavigate()

    useEffect(() => {
        async function checkSession() {
            const { data, error } = await supabase.auth.getSession()
            if (error) {
                console.log(error)
                return
            }
            else {
                setSession(data.session)
            }
        }
        checkSession()

    }, [])

    useEffect(() => {
        if (session == null) {
            console.log('Session not set') 
            navigate('/')
        }
    },[session, navigate])

    if (session == 'Checking') {
        console.log('Still checking') 
        return 'Loading'
    }

    if (session == null) {
        return null
    }

    return children
}

