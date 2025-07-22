import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface PieChartProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChart({
  data,
  nameKey,
  valueKey,
  colors = ['#3b82f6', '#93c5fd', '#60a5fa', '#2563eb', '#1e40af'],
  innerRadius = 60,
  outerRadius = 80,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
              className="cursor-pointer hover:opacity-80"
            />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">
                        {payload[0].name}:
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-medium">
                        {payload[0].value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}