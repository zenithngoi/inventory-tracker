import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  barKey: string;
  barColor?: string;
}

export function BarChart({
  data,
  xAxisKey,
  yAxisKey,
  barKey,
  barColor = "#3b82f6"
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 25,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          dy={10}
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          dx={-10}
        />
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
        <Bar 
          dataKey={barKey} 
          fill={barColor}
          radius={[4, 4, 0, 0]}
          className="cursor-pointer hover:opacity-80"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}