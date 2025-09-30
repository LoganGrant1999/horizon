import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Card } from '@health-heatmap/ui';
import { Activity, Heart, TrendingUp } from 'lucide-react';

interface VitalsChartProps {
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  title: string;
  color?: string;
  unit?: string;
}

export function VitalsChart({ data, title, color = '#00BFA6', unit = '' }: VitalsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          {title}
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={{ stroke: '#E2E8F0' }}
            label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value} ${unit}`, title]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface SymptomFrequencyChartProps {
  data: Array<{
    name: string;
    count: number;
  }>;
}

export function SymptomFrequencyChart({ data }: SymptomFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Symptom Frequency
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No symptoms logged yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        Symptom Frequency (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data.slice(0, 8)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={{ stroke: '#E2E8F0' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={{ stroke: '#E2E8F0' }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" fill="#F8B400" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface ActivityChartProps {
  data: Array<{
    date: string;
    minutes: number;
  }>;
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Activity Minutes
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No activity data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Activity Minutes (Last 14 Days)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={{ stroke: '#E2E8F0' }}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="minutes" fill="#00BFA6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}