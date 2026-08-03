import React, { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, CartesianGrid, Cell, Legend, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A stacked bar chart with a legend"

const defaultChartData = [
  { month: "T1", students: 30, teachers: 3 },
  { month: "T2", students: 45, teachers: 4 },
  { month: "T3", students: 60, teachers: 6 },
  { month: "T4", students: 85, teachers: 8 },
  { month: "T5", students: 110, teachers: 10 },
  { month: "T6", students: 140, teachers: 12 },
  { month: "T7", students: 175, teachers: 15 },
  { month: "T8", students: 210, teachers: 18 },
  { month: "T9", students: 245, teachers: 20 },
  { month: "T10", students: 280, teachers: 22 },
  { month: "T11", students: 310, teachers: 25 },
  { month: "T12", students: 350, teachers: 28 },
]

const chartConfig = {
  students: {
    label: "Học sinh",
    color: "#2f8fa3",
  },
  teachers: {
    label: "Giáo viên",
    color: "#f47c20",
  },
} satisfies ChartConfig

interface ChartBarStackedProps {
  data?: { month: string; students: number; teachers: number; [key: string]: any }[]
  title?: string
  description?: string
  className?: string
  isLoading?: boolean
}

export function ChartBarStacked({
  data = defaultChartData,
  title = "Tăng trưởng người dùng (User Growth)",
  description = "So sánh số lượng Giáo viên & Học sinh gia nhập hệ thống theo 12 tháng.",
  className = "",
  isLoading = false
}: ChartBarStackedProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const chartData = data && data.length > 0 ? data : defaultChartData

  if (isLoading) {
    return (
      <Card className={`border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-3xl bg-white p-2 ${className}`}>
        <CardHeader className="flex flex-row items-center pb-2 pt-4 px-6">
          <div className="grid gap-2 w-full">
            <Skeleton className="h-6 w-1/3 rounded-xl" />
            <Skeleton className="h-4 w-2/3 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-6 pb-6">
          <div className="h-[340px] w-full flex items-end justify-between gap-3 px-4 pb-4 pt-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col gap-2 items-center h-full justify-end">
                <Skeleton className="w-full rounded-2xl animate-pulse bg-slate-100" style={{ height: `${20 + (i % 5) * 15}%` }} />
                <Skeleton className="h-3 w-6 rounded-md mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-none ring-0 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white p-2 ${className}`}>
      <CardHeader className="flex flex-row items-center pb-2 pt-4 px-6">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold text-slate-800">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-6 pb-6">
        <ChartContainer config={chartConfig} className="h-[340px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            barSize={22}
            barGap={0}
            onMouseMove={(state: any) => {
              if (state && state.isTooltipActive && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null && state.activeTooltipIndex >= 0) {
                setActiveIndex(Number(state.activeTooltipIndex))
              } else {
                setActiveIndex(null)
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.6)', rx: 8 }}
              content={<ChartTooltipContent indicator="dashed" className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-3 text-xs font-semibold" />}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
            <Bar
              dataKey="students"
              name="Học sinh"
              stackId="a"
              fill="#2f8fa3"
              radius={[0, 0, 6, 6]}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((_, index) => {
                const isHovered = activeIndex !== null && Number(activeIndex) === index
                const isAnyHovered = activeIndex !== null
                return (
                  <Cell
                    key={`cell-student-${index}`}
                    fill="#2f8fa3"
                    opacity={isAnyHovered ? (isHovered ? 1 : 0.55) : 1}
                    style={{
                      transition: "opacity 0.2s ease, filter 0.2s ease",
                      filter: isHovered ? "drop-shadow(0px 6px 12px rgba(47, 143, 163, 0.45))" : "none"
                    }}
                  />
                )
              })}
            </Bar>
            <Bar
              dataKey="teachers"
              name="Giáo viên"
              stackId="a"
              fill="#f47c20"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((_, index) => {
                const isHovered = activeIndex !== null && Number(activeIndex) === index
                const isAnyHovered = activeIndex !== null
                return (
                  <Cell
                    key={`cell-teacher-${index}`}
                    fill="#f47c20"
                    opacity={isAnyHovered ? (isHovered ? 1 : 0.55) : 1}
                    style={{
                      transition: "opacity 0.2s ease, filter 0.2s ease",
                      filter: isHovered ? "drop-shadow(0px 6px 12px rgba(244, 124, 32, 0.45))" : "none"
                    }}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
