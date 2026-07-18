"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  desktop: {
    label: "Bài tập hoàn thành",
    color: "#3b82f6", // var(--chart-1) equivalent
  },
  mobile: {
    label: "Bài tập chưa nộp",
    color: "#ef4444", // var(--chart-2) equivalent
  },
} satisfies ChartConfig

export function ChartBarStacked({ data }: { data: any[] }) {
  // If data is empty, use some mock data or just render empty
  const chartData = data && data.length > 0 ? data : [
    { month: "Tháng 1", desktop: 0, mobile: 0 }
  ];

  return (
    <Card className="h-full flex flex-col rounded-[20px] border-[#e2e8f0] shadow-none bg-white">
      <CardHeader className="p-[24px] pb-0">
        <CardTitle className="text-[1.1rem] font-extrabold text-slate-800">Tiến độ bài tập</CardTitle>
        <CardDescription>Thống kê số lượng bài tập trong 6 tháng gần nhất</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-[24px] pt-4">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{fill: '#64748b', fontSize: 12}}
              tickFormatter={(value) => value.slice(0, 7)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="desktop"
              stackId="a"
              fill="var(--color-desktop)"
              radius={[0, 0, 4, 4]}
              maxBarSize={40}
            />
            <Bar
              dataKey="mobile"
              stackId="a"
              fill="var(--color-mobile)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
