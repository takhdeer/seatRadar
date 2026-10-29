import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useOverlay } from '../context/OverlayContext';
import { HoverPopUp } from './HoverPopUp'

export function CourseSummary({
    rankedSections,
    activeCourse,
    trackedCourses,
    handleCourseChange,
    sectionColors,
    setSelectedSections,
    setHoveredSection,
    showAllCourses,
    showLabTut,
    setShowLabTut,
    getEffectiveSections,
    userId,
    refreshSavedSchedule,
    activeChart
}) {
    const { setShowOverlay, setMessage } = useOverlay()
    const navigate = useNavigate()

    async function saveSelection(course) {
        const eff = getEffectiveSections();
        const idsToSave = eff === null
            ? []
            : eff.mode === 'exclude'
                ? rankedSections.filter(s => !eff.ids.has(s.section)).map(s => s.section)
                : Array.from(eff.ids);

        const { data: { user } } = await supabase.auth.getUser();
        const res = await fetch('http://localhost:3001/api/selectedSections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: user.id,
            course,
            sectionIds: idsToSave
        })
        });
        const data = await res.json();
        console.log(data);
        setMessage(data.message)
        setShowOverlay(true)

        refreshSavedSchedule()

        if (!res.ok) {
        console.error('Save failed:', data.error);
        setMessage('Save failed')
        setShowOverlay(true)
        }
    }


    async function deleteSavedSelection(course) {
        const res = await fetch(`http://localhost:3001/api/delSections?userId=${userId}&course=${course}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        });
    
        const data = await res.json();
        console.log(data.message)
        setMessage(data.message)
        setShowOverlay(true)

        refreshSavedSchedule()
    
        if (!res.ok) {
        console.error('Delete failed:', data.error);
        setMessage('Delete failed')
        setShowOverlay(true)
        return;
        }
    }

    function CourseSelector() {
        return (
            <select value={activeCourse} onChange={handleCourseChange}>
                {trackedCourses.map((item, index) => (
                    <option key={index} value={item.course}>
                        {item.course}
                    </option>
                ))}
            </select>
        );
    }

    if (rankedSections.length === 0) {
        return (
          <CourseSelector />
        )
    }

    const bestSection = rankedSections[0];

    const toggleSection = (sectionId) => {
        setSelectedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    return (
        <div className="summary-container">
            <h3>Best Section</h3>
            <div className="section-title-row">
                <CourseSelector />
                <button className="menu-item" onClick={() => navigate("/form")}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Course
                </button>
             </div>
            <div className="best-section" style={{ borderLeft: `4px solid ${sectionColors[bestSection.section] || '#6f9f7e'}` }}>
                <div className="section-header">
                    <span className="section-number">{bestSection.section}</span>
                    <span className="prof-name">{bestSection.prof}</span>
                </div>
                <div className="metrics-row">
                    <div className="metric">
                        <span className="metric-label">Rating</span>
                        <span className="metric-value">{bestSection.rating !== null ? `${bestSection.rating.toFixed(1)}/5` : 'TBA'}</span>
                    </div>
                    <div className="metric">
                        <span className="metric-label">Difficulty</span>
                        <span className="metric-value">{bestSection.difficulty !== null ? `${bestSection.difficulty.toFixed(1)}/5` : 'TBA'}</span>

                    </div>
                    <div className="metric">
                        <span className="metric-label">Seats</span>
                        <span className="metric-value">
                            {bestSection.seats > 0
                                ? `${bestSection.seats} open`
                                : bestSection.waitlist > 0
                                    ? `${bestSection.waitlist} wait`
                                    : 'Full'}
                        </span>
                    </div>
                </div>
            </div>

            {rankedSections.length > 1 && (
                <div className="all-sections">
                  <h4>All Sections</h4>
                    <div className='section-title-row'>
                      <button className="menu-item" onClick={() => saveSelection(activeCourse)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        Save Section
                     </button>
                     <button className="menu-item" onClick={() => deleteSavedSelection(activeCourse)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Remove Section
                     </button>
                     {!showAllCourses && (
                        <button 
                        className='idk-yet'
                        onClick={() => setShowLabTut(prev => !prev)}>
                          {showLabTut ? 'Hide Lab/Tut' : 'Show Lab/Tut'}
                        </button>
                      )}
                    </div>
                    <div onMouseLeave={() => setHoveredSection(null)}>
                    {rankedSections.map((section, idx) => (
                      <HoverPopUp
                            key={section.section}
                            className="section-row"
                            onClick={() => toggleSection(section.section)}
                            onMouseEnter={() => setHoveredSection(section.section)}
                            content={
                                activeChart
                            }
                        >
                        <div className='section-row'
                          style={{cursor: 'pointer' }}
                        >
                            <span className="rank">#{idx + 1}</span>
                            <span className="section-info">
                                {section.section} {section.classType && `· ${section.classType}`} · {section.prof || 'Professor TBA'}
                            </span>
                            <span className="section-stats">
                                {section.rating !== null ? `⭐ ${section.rating.toFixed(1)} · `: `⭐ Prof TBA · `} 
                                {section.difficulty !== null ? `📚 ${section.difficulty.toFixed(1)} · ` : '📚 · '}
                                {section.seats > 0
                                    ? `💺 ${section.seats}`
                                    : section.waitlist > 0
                                        ? `⏳ ${section.waitlist}`
                                        : '🚫'}
                            </span>
                        </div>
                      </HoverPopUp>
                    ))}
                    </div>
                </div>
            )}
        </div>
    );
}