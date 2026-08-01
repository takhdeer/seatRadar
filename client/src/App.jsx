import { BrowserRouter, Routes, Route} from 'react-router-dom'
import TrackForm from './components/TrackForm'
import SignUpPage from './components/SignUp'
import TrackedPage from './components/tracked'
import LandingPage from './components/Landing'
import Dashboard from './components/Dashboard'

import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

export default function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path='/' element={
                <PublicRoute>
                    <LandingPage />
                </PublicRoute>
            } />
            <Route path="/signup" element={
                <PublicRoute>
                    <SignUpPage />
                </PublicRoute>
            } />
            <Route path='/form' element={<TrackForm />} />
            <Route path='/done' element={<TrackedPage />} />
            <Route path='/dashboard' element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
        </Routes>
        </BrowserRouter>
    )

}
