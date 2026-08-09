import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricsChartProps {
  data: any[];
  title?: string;
}

const MetricsChart = ({ data, title }: MetricsChartProps) => {
  return (
    <div style={{ height: '300px', display: 'flex', flexDirection: 'column', width: '100%', padding: '0 32px 32px' }}>
      {title && <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: '#1e293b' }}>{title}</h3>}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              itemStyle={{ color: '#1e293b', fontSize: '12px' }}
              labelStyle={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}
            />
            {/* CPU Line (Blue) */}
            <Line 
              type="monotone" 
              dataKey="cpu" 
              name="CPU Usage"
              stroke="#3B6BFC" 
              strokeWidth={2} 
              dot={{ r: 3, strokeWidth: 2, fill: 'white' }} 
              activeDot={{ r: 5, strokeWidth: 0, fill: '#3B6BFC' }} 
            />
            {/* Memory Line (Green) */}
            <Line 
              type="monotone" 
              dataKey="mem" 
              name="Memory Usage"
              stroke="#16A34A" 
              strokeWidth={2} 
              dot={{ r: 3, strokeWidth: 2, fill: 'white' }} 
              activeDot={{ r: 5, strokeWidth: 0, fill: '#16A34A' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsChart;
