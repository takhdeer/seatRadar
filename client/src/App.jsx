import { BrowserRouter, Routes, Route} from 'react-router-dom'
import TrackForm from './components/TrackForm'
import SignUpPage from './components/SignUp'
import TrackedPage from './components/tracked'
import LandingPage from './components/Landing'

import './App.css'

export default function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path='/form' element={<TrackForm />} />
            <Route path='/done' element={<TrackedPage />} />
        </Routes>
        </BrowserRouter>
    )

}
