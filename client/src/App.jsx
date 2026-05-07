import { BrowserRouter, Routes, Route} from 'react-router-dom'
import TrackForm from './components/TrackForm'
import LandingPage from './components/Landing'

import './App.css'

export default function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path='/form' element={<TrackForm />} />
        </Routes>
        </BrowserRouter>
    )

}
