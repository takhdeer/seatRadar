import { useState, useEffect, useCallback } from 'react';

function useSavedSchedule(userId) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshSavedSchedule = useCallback(() => {
    setRefreshKey(key => key + 1);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    async function fetchSchedule() {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:3001/api/selectedSections?userId=${userId}`,
          { method: 'GET', signal: controller.signal }
        );

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();

        setSchedule(data.map(entry => ({
          courseName: entry.course,
          section: entry.section_id,
          classType: entry.class_type,
          days: entry.days,
          start_time: entry.start_time,
          end_time: entry.end_time,
        })));

        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load your saved schedule.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();

    return () => controller.abort();
  }, [userId, refreshKey]);

  return { schedule, loading, error, refreshSavedSchedule };
}

export default useSavedSchedule;