import { useState, useEffect } from 'react';

function useSavedSchedule(userId) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3001/api/selectedSections?userId=${userId}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();

        
        const mapped = data.map((entry) => ({
          courseName: entry.course,
          section: entry.section_id,
          classType: entry.class_type,
          days: entry.days,
          start: entry.start_time,
          end: entry.end_time,
        }));

        setSchedule(mapped);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load schedule:', err);
          setError('Could not load your saved schedule.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();

    return () => controller.abort();
  }, [userId]);

  return { schedule, loading, error };
}

export default useSavedSchedule;