"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

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

interface ChallengeResult {
  date: { year: number; month: number; day: number }
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
  timestamp: number
}

export default function RandomDateGenerator() {
  const [challengeMode, setChallengeMode] = useState(false)
  
  // Regular mode state
  const [startCentury, setStartCentury] = useState(1)
  const [endCentury, setEndCentury] = useState(100000)
  const [generatedDate, setGeneratedDate] = useState<{ year: number; month: number; day: number } | null>(null)
  const [error, setError] = useState("")
  const [showWeekday, setShowWeekday] = useState(false)

  // Verify date section state
  const [verifyYear, setVerifyYear] = useState("")
  const [verifyMonth, setVerifyMonth] = useState("")
  const [verifyDay, setVerifyDay] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const [verifyWeekday, setVerifyWeekday] = useState<string | null>(null)

  // Challenge mode state
  const [challengeStarted, setChallengeStarted] = useState(false)
  const [challengeEnded, setChallengeEnded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentDate, setCurrentDate] = useState<{ year: number; month: number; day: number } | null>(null)
  const [results, setResults] = useState<ChallengeResult[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; show: boolean }>({ isCorrect: false, show: false })
  const [hardMode, setHardMode] = useState(false)
  const [infiniteMode, setInfiniteMode] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [dateVisible, setDateVisible] = useState(true)
  const [hideCountdown, setHideCountdown] = useState<number | null>(null)
  const [customRangeMode, setCustomRangeMode] = useState(false)
  const [customStartCentury, setCustomStartCentury] = useState(1)
  const [customEndCentury, setCustomEndCentury] = useState(500)

  const generateChallengeDate = useCallback(() => {
    // Calculate year range based on custom range mode
    let startYear: number
    let endYear: number
    
    if (customRangeMode) {
      startYear = (customStartCentury - 1) * 100 + 1
      endYear = customEndCentury * 100
    } else {
      // Default: century 1 to 500 (year 1 to 50000)
      startYear = 1
      endYear = 50000
    }
    
    const date = generateRandomDate(startYear, endYear)
    setCurrentDate(date)
    
    // In hard mode, start countdown and hide the date after 3 seconds
    if (hardMode) {
      setDateVisible(true)
      setHideCountdown(3000)
    }
  }, [hardMode, customRangeMode, customStartCentury, customEndCentury])

  const startChallenge = () => {
    setChallengeStarted(true)
    setChallengeEnded(false)
    setTimeLeft(60)
    setElapsedTime(0)
    setResults([])
    setStartTime(Date.now())
    setDateVisible(true)
    setHideCountdown(null)
    generateChallengeDate()
  }

  const stopChallenge = () => {
    setChallengeEnded(true)
  }

  const handleWeekdayGuess = (guessedDay: string) => {
    if (!currentDate || challengeEnded) return

    const correctAnswer = getWeekday(currentDate.year, currentDate.month, currentDate.day)
    const isCorrect = guessedDay === correctAnswer

    const result: ChallengeResult = {
      date: currentDate,
      correctAnswer,
      userAnswer: guessedDay,
      isCorrect,
      timestamp: Date.now() - startTime
    }

    setResults(prev => [...prev, result])
    
    // Show instant feedback flash
    setFeedback({ isCorrect, show: true })
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 300)
    
    generateChallengeDate()
  }

  const resetChallenge = () => {
    setChallengeStarted(false)
    setChallengeEnded(false)
    setTimeLeft(60)
    setElapsedTime(0)
    setCurrentDate(null)
    setResults([])
    setDateVisible(true)
    setHideCountdown(null)
  }

  // Timer effect
  useEffect(() => {
    if (!challengeStarted || challengeEnded) return

    const timer = setInterval(() => {
      if (infiniteMode) {
        // Count up for infinite mode
        setElapsedTime(prev => prev + 1)
      } else {
        // Count down for regular mode
        setTimeLeft(prev => {
          if (prev <= 1) {
            setChallengeEnded(true)
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [challengeStarted, challengeEnded, infiniteMode])

  // Hard mode countdown effect
  useEffect(() => {
    if (!hardMode || hideCountdown === null || hideCountdown <= 0) return

    const interval = setInterval(() => {
      setHideCountdown(prev => {
        if (prev === null || prev <= 10) {
          setDateVisible(false)
          return null
        }
        return prev - 10
      })
    }, 10)

    return () => clearInterval(interval)
  }, [hardMode, hideCountdown])

  const handleGenerate = () => {
    setError("")
    setShowWeekday(false)
    
    if (startCentury < 1 || endCentury > 100000) {
      setError("Centuries must be between 1 and 100000")
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

  const handleVerify = () => {
    setVerifyError("")
    setVerifyWeekday(null)

    const year = parseInt(verifyYear)
    const month = parseInt(verifyMonth)
    const day = parseInt(verifyDay)

    if (isNaN(year) || year < 1 || year > 10000000) {
      setVerifyError("Year must be between 1 and 10,000,000")
      return
    }

    if (isNaN(month) || month < 1 || month > 12) {
      setVerifyError("Month must be between 1 and 12")
      return
    }

    const maxDays = getDaysInMonth(month - 1, year)
    if (isNaN(day) || day < 1 || day > maxDays) {
      setVerifyError(`Day must be between 1 and ${maxDays} for ${MONTHS[month - 1]} ${year}`)
      return
    }
  }

  const handleRevealVerifyWeekday = () => {
    const year = parseInt(verifyYear)
    const month = parseInt(verifyMonth)
    const day = parseInt(verifyDay)
    setVerifyWeekday(getWeekday(year, month - 1, day))
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const correctCount = results.filter(r => r.isCorrect).length
  const wrongCount = results.filter(r => !r.isCorrect).length
  const accuracy = results.length > 0 ? ((correctCount / results.length) * 100).toFixed(1) : "0"

  // Challenge Mode UI
  if (challengeMode) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {/* Toggle in top right */}
        <div className="fixed top-4 right-4 flex items-center gap-3 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-slate-300 text-sm">Challenge Mode</span>
          <Switch 
            checked={challengeMode} 
            onCheckedChange={(checked) => {
              setChallengeMode(checked)
              resetChallenge()
            }} 
          />
        </div>

        <div className="flex items-center justify-center min-h-screen">
          {!challengeStarted ? (
            <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Challenge</CardTitle>
                <CardDescription className="text-slate-400">
                  Guess the day of the week for random dates {customRangeMode ? `(${customStartCentury.toLocaleString()}-${customEndCentury.toLocaleString()} centuries)` : '(1-500 centuries)'} {infiniteMode ? '' : 'in 60 seconds'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2 text-slate-300">
                  <p>You will be shown random dates.</p>
                  <p>Click the correct day of the week as fast as you can!</p>
                  <p className={hardMode ? 'text-red-400 font-semibold' : infiniteMode ? 'text-cyan-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {hardMode && 'Date visible for 3 seconds only!'}
                    {!hardMode && infiniteMode && 'No time limit - stop whenever you want!'}
                    {!hardMode && !infiniteMode && 'You have 1 minute.'}
                  </p>
                </div>
                
                {/* Hard Mode Toggle */}
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <span className={`text-sm ${hardMode ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                    Hard Mode
                  </span>
                  <Switch 
                    checked={hardMode} 
                    onCheckedChange={setHardMode}
                  />
                </div>
                
                {/* Infinite Time Mode Toggle */}
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <span className={`text-sm ${infiniteMode ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}>
                    Infinite Time Mode
                  </span>
                  <Switch 
                    checked={infiniteMode} 
                    onCheckedChange={setInfiniteMode}
                  />
                </div>
                
                {/* Custom Range Mode Toggle */}
                <div className="space-y-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-sm ${customRangeMode ? 'text-violet-400 font-semibold' : 'text-slate-400'}`}>
                      Custom Range
                    </span>
                    <Switch 
                      checked={customRangeMode} 
                      onCheckedChange={setCustomRangeMode}
                    />
                  </div>
                  
                  {customRangeMode && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 w-20">From Century</label>
                        <Input
                          type="number"
                          min={1}
                          max={100000}
                          value={customStartCentury}
                          onChange={(e) => setCustomStartCentury(Math.max(1, Math.min(100000, Number(e.target.value) || 1)))}
                          className="bg-slate-600 border-slate-500 text-white text-sm h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 w-20">To Century</label>
                        <Input
                          type="number"
                          min={1}
                          max={100000}
                          value={customEndCentury}
                          onChange={(e) => setCustomEndCentury(Math.max(1, Math.min(100000, Number(e.target.value) || 1)))}
                          className="bg-slate-600 border-slate-500 text-white text-sm h-8"
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center">
                        Years {((customStartCentury - 1) * 100 + 1).toLocaleString()} - {(customEndCentury * 100).toLocaleString()} CE
                      </p>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={startChallenge}
                  className={`w-full font-semibold text-lg py-6 ${
                    hardMode 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : infiniteMode
                        ? 'bg-cyan-600 hover:bg-cyan-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white`}
                >
                  Start {hardMode ? 'Hard ' : ''}{infiniteMode ? 'Infinite ' : ''}Challenge
                </Button>
              </CardContent>
            </Card>
          ) : challengeEnded ? (
            <Card className="w-full max-w-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">
                  {infiniteMode ? 'Challenge Stopped!' : 'Challenge Complete!'}
                </CardTitle>
                {/* Mode badges */}
                {(hardMode || infiniteMode || customRangeMode) && (
                  <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                    {hardMode && (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white">HARD MODE</span>
                    )}
                    {infiniteMode && (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-cyan-600 text-white">INFINITE</span>
                    )}
                    {customRangeMode && (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-violet-600 text-white">
                        {customStartCentury.toLocaleString()}-{customEndCentury.toLocaleString()} C
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Time for Infinite Mode */}
                {infiniteMode && (
                  <div className="text-center p-4 rounded-lg bg-cyan-900/30 border border-cyan-700">
                    <p className="text-4xl font-mono font-bold text-cyan-400">
                      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-slate-400 text-sm">Total Time</p>
                  </div>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-emerald-900/30 border border-emerald-700">
                    <p className="text-3xl font-bold text-emerald-400">{correctCount}</p>
                    <p className="text-slate-400 text-sm">Correct</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/30 border border-red-700">
                    <p className="text-3xl font-bold text-red-400">{wrongCount}</p>
                    <p className="text-slate-400 text-sm">Wrong</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-900/30 border border-amber-700">
                    <p className="text-3xl font-bold text-amber-400">{accuracy}%</p>
                    <p className="text-slate-400 text-sm">Accuracy</p>
                  </div>
                </div>

                {/* Results list */}
                <div className="max-h-80 overflow-y-auto space-y-2">
                  <h3 className="text-slate-300 font-semibold mb-2">Question History</h3>
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        result.isCorrect 
                          ? 'bg-emerald-900/20 border-emerald-700/50' 
                          : 'bg-red-900/20 border-red-700/50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {MONTHS[result.date.month]} {formatOrdinal(result.date.day)}, {result.date.year.toLocaleString()} CE
                        </p>
                        <p className="text-sm text-slate-400">
                          Your answer: <span className={result.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{result.userAnswer}</span>
                          {!result.isCorrect && (
                            <span className="text-slate-500"> (Correct: {result.correctAnswer})</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg ${result.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.isCorrect ? '✓' : '✗'}
                        </span>
                        <p className="text-xs text-slate-500">{formatTime(result.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={startChallenge}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full max-w-lg border-slate-700 bg-slate-800/50 backdrop-blur relative overflow-hidden">
              {/* Instant feedback flash overlay */}
              <div 
                className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
                  feedback.show ? 'opacity-100' : 'opacity-0'
                } ${feedback.isCorrect ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}
              />
              
              <CardHeader className="text-center pb-2">
                {/* Mode badges */}
                <div className="mb-2 flex items-center justify-center gap-2 flex-wrap">
                  {hardMode && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white">HARD MODE</span>
                  )}
                  {infiniteMode && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-cyan-600 text-white">INFINITE</span>
                  )}
                  {customRangeMode && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-violet-600 text-white">
                      {customStartCentury.toLocaleString()}-{customEndCentury.toLocaleString()} C
                    </span>
                  )}
                </div>
                {/* Timer */}
                {infiniteMode ? (
                  <div className="text-5xl font-mono font-bold text-cyan-400">
                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </div>
                ) : (
                  <div className={`text-5xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : hardMode ? 'text-red-400' : 'text-amber-400'}`}>
                    {timeLeft}s
                  </div>
                )}
                <div className="text-slate-400 text-sm mt-1">
                  {correctCount} correct / {results.length} total
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentDate && (
                  <>
                    {/* Date display */}
                    <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600 text-center h-[160px] flex flex-col items-center justify-center relative">
                      {dateVisible ? (
                        <>
                          <p className="text-3xl font-bold text-emerald-400">
                            {MONTHS[currentDate.month]} {formatOrdinal(currentDate.day)}
                          </p>
                          <p className="text-4xl font-extrabold text-white mt-2">
                            {currentDate.year.toLocaleString()} CE
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            {formatOrdinal(getCenturyFromYear(currentDate.year))} Century
                          </p>
                          {/* Countdown overlay for hard mode */}
                          {hardMode && hideCountdown !== null && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-600/80 text-white font-mono text-sm">
                              {(hideCountdown / 1000).toFixed(2)}s
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-400">Date Hidden</p>
                          <p className="text-slate-500 text-sm mt-1">Remember the date!</p>
                        </div>
                      )}
                    </div>

                    {/* Weekday buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {WEEKDAYS.map((day) => (
                        <Button
                          key={day}
                          onClick={() => handleWeekdayGuess(day)}
                          variant="outline"
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white py-4 text-sm"
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Stop button for infinite mode */}
                    {infiniteMode && (
                      <Button 
                        onClick={stopChallenge}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                      >
                        Stop Challenge
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    )
  }

  // Regular Mode UI
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Toggle in top right */}
      <div className="fixed top-4 right-4 flex items-center gap-3 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700">
        <span className="text-slate-300 text-sm">Challenge Mode</span>
        <Switch checked={challengeMode} onCheckedChange={setChallengeMode} />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen gap-6">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Random Date Generator</CardTitle>
            <CardDescription className="text-slate-400">
              Generate a random date from 1 CE to 10,000,000 CE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel className="text-slate-300">Start Century (1-100000)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={100000}
                  value={startCentury}
                  onChange={(e) => setStartCentury(Number(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="e.g. 1 (1 CE - 100 CE)"
                />
              </Field>
              <Field>
                <FieldLabel className="text-slate-300">End Century (1-100000)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={100000}
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
              <p>Century 100000 = Years 9,999,901-10,000,000 CE</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-white">Verify a Date</CardTitle>
            <CardDescription className="text-slate-400">
              Enter a date to check its weekday
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel className="text-slate-300 text-sm">Year</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={10000000}
                  value={verifyYear}
                  onChange={(e) => {
                    setVerifyYear(e.target.value)
                    setVerifyWeekday(null)
                  }}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="2000"
                />
              </Field>
              <Field>
                <FieldLabel className="text-slate-300 text-sm">Month</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={verifyMonth}
                  onChange={(e) => {
                    setVerifyMonth(e.target.value)
                    setVerifyWeekday(null)
                  }}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="4"
                />
              </Field>
              <Field>
                <FieldLabel className="text-slate-300 text-sm">Day</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={verifyDay}
                  onChange={(e) => {
                    setVerifyDay(e.target.value)
                    setVerifyWeekday(null)
                  }}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="4"
                />
              </Field>
            </div>

            {verifyError && (
              <p className="text-red-400 text-sm text-center">{verifyError}</p>
            )}

            <Button 
              onClick={() => {
                handleVerify()
                if (!verifyError) {
                  const year = parseInt(verifyYear)
                  const month = parseInt(verifyMonth)
                  const day = parseInt(verifyDay)
                  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    // Validation passed, show the reveal button
                  }
                }
              }} 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Validate Date
            </Button>

            {verifyYear && verifyMonth && verifyDay && !verifyError && (
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 text-center">
                <p className="text-lg text-slate-300 mb-3">
                  {MONTHS[parseInt(verifyMonth) - 1]} {formatOrdinal(parseInt(verifyDay))}, {parseInt(verifyYear).toLocaleString()} CE
                </p>
                {verifyWeekday ? (
                  <p className="text-2xl font-bold text-amber-400">{verifyWeekday}</p>
                ) : (
                  <button
                    onClick={handleRevealVerifyWeekday}
                    className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm font-medium transition-colors"
                  >
                    Reveal Weekday
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
