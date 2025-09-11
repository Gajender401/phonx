import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ClaireHoursChart = () => {
  // Single week data
  const weeklyData = [
    { day: 'Mon', hours: 4.5 },
    { day: 'Tue', hours: 5.2 },
    { day: 'Wed', hours: 4.8 },
    { day: 'Thu', hours: 5.5 },
    { day: 'Fri', hours: 5.0 },
    { day: 'Sat', hours: 3.5 },
    { day: 'Sun', hours: 2.8 },
  ];
  
  // Calculate total hours for the week
  const totalHours = weeklyData.reduce((sum, day) => sum + day.hours, 0);
  const monthHours = 120; // Mock data for total month hours

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xl font-bold">{totalHours.toFixed(1)}h</div>
          <div className="text-sm text-muted-foreground">This Week</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{monthHours}h</div>
          <div className="text-sm text-muted-foreground">This Month: April</div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '10px', border: '1px solid #eee' }}
              formatter={(value) => [`${value}h`, 'Hours']}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#0B6BAF" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClaireHoursChart; 