"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Calculate day of week using Zeller's congruence (modified for proleptic Gregorian calendar)
// Assumes Gregorian calendar extends back to 1 CE
function getWeekday(year: number, month: number, day: number): string {
  // Zeller's congruence uses months 3-14 (March = 3, ..., February = 14 of previous year)
  let m = month + 1 // Convert 0-indexed to 1-indexed
  let y = year
  
  if (m < 3) {
    m += 12
    y -= 1
  }
  
  const q = day
  const k = y % 100
  const j = Math.floor(y / 100)
  
  // Zeller's formula for Gregorian calendar
  let h = (q + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7
  
  // Handle negative modulo
  h = ((h % 7) + 7) % 7
  
  // Convert Zeller result (0=Saturday, 1=Sunday, ..., 6=Friday) to standard (0=Sunday, 1=Monday, ...)
  const dayIndex = (h + 6) % 7
  
  return WEEKDAYS[dayIndex]
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function getDaysInMonth(month: number, year: number): number {
  if (month === 1 && isLeapYear(year)) {
    return 29
  }
  return DAYS_IN_MONTH[month]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRandomDate(startYear: number, endYear: number) {
  const year = getRandomInt(startYear, endYear)
  const month = getRandomInt(0, 11)
  const day = getRandomInt(1, getDaysInMonth(month, year))
  
  return { year, month, day }
}

function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function RandomDateGenerator() {
  const [startCentury, setStartCentury] = useState(1)
  const [endCentury, setEndCentury] = useState(500)
  const [generatedDate, setGeneratedDate] = useState<{ year: number; month: number; day: number } | null>(null)
  const [error, setError] = useState("")
  const [showWeekday, setShowWeekday] = useState(false)

  const handleGenerate = () => {
    setError("")
    setShowWeekday(false)
    
    if (startCentury < 1 || endCentury > 500) {
      setError("Centuries must be between 1 and 500")
      return
    }
    
    if (startCentury > endCentury) {
      setError("Start century must be less than or equal to end century")
      return
    }

    const startYear = (startCentury - 1) * 100 + 1
    const endYear = endCentury * 100

    const date = generateRandomDate(startYear, endYear)
    setGeneratedDate(date)
  }

  const getCenturyFromYear = (year: number): number => {
    return Math.ceil(year / 100)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Random Date Generator</CardTitle>
          <CardDescription className="text-slate-400">
            Generate a random date from 1 CE to 50000 CE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-slate-300">Start Century (1-500)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={500}
                value={startCentury}
                onChange={(e) => setStartCentury(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="e.g. 1 (1 CE - 100 CE)"
              />
            </Field>
            <Field>
              <FieldLabel className="text-slate-300">End Century (1-500)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={500}
                value={endCentury}
                onChange={(e) => setEndCentury(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="e.g. 500 (49901 CE - 50000 CE)"
              />
            </Field>
          </FieldGroup>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button 
            onClick={handleGenerate} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            Generate Random Date
          </Button>

          {generatedDate && (
            <div className="mt-6 p-6 rounded-lg bg-slate-700/50 border border-slate-600 text-center space-y-2">
              <p className="text-4xl font-bold text-emerald-400">
                {MONTHS[generatedDate.month]} {formatOrdinal(generatedDate.day)}
              </p>
              <p className="text-5xl font-extrabold text-white">
                {generatedDate.year.toLocaleString()} CE
              </p>
              <p className="text-slate-400 text-sm mt-2">
                {formatOrdinal(getCenturyFromYear(generatedDate.year))} Century
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-600">
                {showWeekday ? (
                  <p className="text-2xl font-bold text-amber-400">
                    {getWeekday(generatedDate.year, generatedDate.month, generatedDate.day)}
                  </p>
                ) : (
                  <button
                    onClick={() => setShowWeekday(true)}
                    className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm font-medium transition-colors"
                  >
                    Reveal Weekday
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>Century 1 = Years 1-100 CE</p>
            <p>Century 500 = Years 49901-50000 CE</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
