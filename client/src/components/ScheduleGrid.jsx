import LoadingSpinner from "./loadingSpinner";

export function ScheduleGrid({
    showAllCourses,
    setShowAllCourses,
    savedSchedule,
    courseSchedules,
    activeCourse,
    savedLoading,
    savedError,
    assignSectionColors,
    setSelectedSections,
    sectionColors,
    profSections,
    applySectionFilter,
}) {

    function handleScheduleViewToggle() {
        setShowAllCourses(prev => {
          const willShowAllCourses = !prev;
      
          // Reset section filtering only when returning to the active course.
          if (!willShowAllCourses) {
            setSelectedSections(new Set());
          }
      
          return willShowAllCourses;
        });
    }

    async function handleLogOut() {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.log(error)
        }
        else {
          navigate('/')
        }
    }

    const days = ['M', 'T', 'W', 'R', 'F'];
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 9pm

    const allCoursesColor = showAllCourses
      ? assignSectionColors(savedSchedule.map(s => s.section))
      : {};

      const activeColorMap = showAllCourses ? allCoursesColor : sectionColors

    // Collect all valid schedule entries across all tracked courses
    const allSchedules = [];
    const sections = courseSchedules[activeCourse]
    if (showAllCourses) {
      savedSchedule.forEach(section => {
        allSchedules.push({
          courseName: section.courseName,
          section: section.section,
          days: section.days,
          start: section.start_time,
          end: section.end_time,
          classType: section.classType,
          prof: section.prof
        });
      });
    }
    else {
      if (Array.isArray(sections)) {
        sections.forEach(section => {
          if (section.days && section.start_time && section.end_time) {
            allSchedules.push({
              courseName: activeCourse,
              section: section.section,
              days: section.days,
              start: section.start_time,
              end: section.end_time,
              classType: section.classType,
              prof: profSections.find(ps => String(ps.section_id) === String(section.section))?.prof
            });
          }
        });
      }
    }

    if (allSchedules.length === 0) {
        return null;
    }

    // Filter schedules based on selectedSections
    const filteredSchedules = showAllCourses 
    ? allSchedules
    : applySectionFilter(allSchedules)

    // Convert time string (HH:MM) to decimal hours
    const timeToHours = (timeStr) => {
      const hours = parseInt(timeStr.slice(0, -2), 10);
      const minutes = parseInt(timeStr.slice(-2), 10);
      return hours + minutes / 60;
  };

    return (
        <div className="schedule-grid-container">
          <div className='toggles'>
            <div>
              <h4>Weekly Schedule</h4>
              <div className='btnLabel'>
                <h5>Viewing:</h5> 
                <button className='toggle-button'
                onClick={() => handleScheduleViewToggle()}>
                    {showAllCourses ? "Saved Sections" : "All Sections"}
                </button>
              </div>
            </div>
            <div className='toggle-right'>
              <button className="logout-btn" onClick={() => handleLogOut()}>
                Log out
              </button>
            </div>
          </div>
          
          {showAllCourses && savedLoading && (
            <LoadingSpinner />
          )}

          {showAllCourses && savedError && (
            <p role='alert'>{savedError}</p>
          )}

            <div className="schedule-grid">
                <div className="time-labels">
                    <div className="corner-cell"></div>
                    {hours.map(hour => (
                        <div key={hour} className="time-label">
                            {hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                        </div>
                    ))}
                </div>
                <div className="grid-content">
                    {days.map((day) => (
                        <div key={day} className="day-column">
                            <div className="day-header">{day}</div>
                            <div className="day-cells">
                                {hours.map((hour, hourIdx) => (
                                    <div key={hourIdx} className="time-cell">
                                        {filteredSchedules
                                            .filter(schedule => {
                                                // Check if this day is included
                                                if (!schedule.days.includes(day)) return false;

                                                const startHour = timeToHours(schedule.start);
                                                const endHour = timeToHours(schedule.end);

                                                // Check if this hour overlaps with the course time
                                                return hour >= startHour && hour < endHour;
                                            })
                                            .map((schedule, idx) => (
                                                <div
                                                    key={idx}
                                                    className="course-block"
                                                    style={{ backgroundColor: activeColorMap[schedule.section] || '#4f86b8' }}
                                                >
                                                    <span className="course-title">{schedule.courseName}</span>
                                                    <span className="course-section">
                                                        {schedule.prof || 'Prof TBA'} {schedule.classType && `· ${schedule.classType}`}
                                                    </span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}