import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/helpers';

const COLORS = ['#3d2b1c', '#c47a3a', '#a89888', '#e08a40', '#6b5446', '#f4d4c4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: '1px solid #e0dcd5', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p className="label" style={{ margin: 0, fontWeight: 600, color: '#3d2b1c', marginBottom: '8px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: 0, display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{entry.name}:</span> 
            <strong>{formatCurrency(entry.value)}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyTrendChart({ data }) {
  if (!data || data.length === 0) return <p className="empty-state">Not enough data for chart.</p>;

  // Sort chronologically
  const chartData = [...data].sort((a,b) => a.monthKey.localeCompare(b.monthKey)).map(r => ({
    name: r.monthKey,
    Income: r.totalIncome,
    Expenses: r.totalExpense,
    Savings: r.savings
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0dcd5" />
          <XAxis dataKey="name" tick={{ fill: '#6b5446', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fill: '#6b5446', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="Income" fill="#c47a3a" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="Expenses" fill="#3d2b1c" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  if (chartData.length === 0) return <p className="empty-state">Add expenses to generate visual overview.</p>;

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', color: '#3d2b1c' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SavingsLineChart({ data }) {
    if (!data || data.length === 0) return <p className="empty-state">Not enough data.</p>;
  
    const chartData = [...data].sort((a,b) => a.monthKey.localeCompare(b.monthKey)).map(r => ({
      name: r.monthKey,
      Savings: r.savings
    }));
  
    return (
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0dcd5" />
            <XAxis dataKey="name" tick={{ fill: '#6b5446', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fill: '#6b5446', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Savings" stroke="#c47a3a" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
