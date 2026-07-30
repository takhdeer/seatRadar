import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const testDataDuplicate = [
  { section: 'COMP 3612', seats: 5, seatsTaken: 25 },
  { section: 'COMP 3612', seats: 0, seatsTaken: 35 }
];

const testDataUnique = [
  { section: 'COMP 3612 - Sec A', seats: 5, seatsTaken: 25 },
  { section: 'COMP 3612 - Sec B', seats: 0, seatsTaken: 35 }
];

export default function StackedBarTest() {
  return (
    <>
      <h3>Duplicate labels</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={testDataDuplicate}>
          <XAxis dataKey="section" />
          <YAxis />
          <Tooltip />
          <CartesianGrid stroke="none" />
          <Bar dataKey="seats" stackId="a" fill="#90EE90" name="Available" />
          <Bar dataKey="seatsTaken" stackId="a" fill="#FF474C" name="Taken" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Unique labels</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={testDataUnique}>
          <XAxis dataKey="section" />
          <YAxis />
          <Tooltip />
          <CartesianGrid stroke="none" />
          <Bar dataKey="seats" stackId="a" fill="#90EE90" name="Available" />
          <Bar dataKey="seatsTaken" stackId="a" fill="#FF474C" name="Taken" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}