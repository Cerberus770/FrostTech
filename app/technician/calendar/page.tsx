'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faCalendarDay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useAppState } from '@/context/AppStateContext';

export default function TechnicianCalendar() {
  const { state } = useAppState();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Dummy events derived from maintenance schedule just for visual purposes
  const hasEvent = (day: number) => {
    // In a real app, you would check `state.maintenanceSchedule` dates matching this year/month/day
    // For demo, just light up random days based on the date seed
    return (day % 4 === 0) || (day === 15) || (day === 22);
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      <header className="bg-[#0f172a]/90 backdrop-blur-xl border-b border-border-subtle p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/technician" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-6 mt-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-primary">My Schedule</h2>
            <p className="text-sm text-text-muted mt-1">Manage your upcoming appointments and leave.</p>
          </div>
          <button className="px-4 py-2 gradient-primary text-white font-semibold rounded-lg shadow-glow flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} /> Request Time Off
          </button>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
          {/* Calendar Header */}
          <div className="flex justify-between items-center p-6 border-b border-border-subtle bg-bg-card-alt">
            <h3 className="text-xl font-bold font-[family-name:var(--font-display)]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-input hover:border-primary border border-border-subtle transition-colors">
                <FontAwesomeIcon icon={faChevronLeft} className="text-text-muted" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 flex items-center gap-2 rounded-lg bg-bg-input hover:border-primary border border-border-subtle transition-colors font-semibold text-sm">
                <FontAwesomeIcon icon={faCalendarDay} className="text-text-muted" /> Today
              </button>
              <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-input hover:border-primary border border-border-subtle transition-colors">
                <FontAwesomeIcon icon={faChevronRight} className="text-text-muted" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs font-bold text-text-muted uppercase tracking-wider">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
              {/* Empty slots before first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent border border-dashed border-border-subtle/50" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                const hasTask = hasEvent(day);

                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                      isToday
                        ? 'border-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(0,155,213,0.2)]'
                        : 'border-border-subtle bg-bg-input hover:border-primary/50'
                    }`}
                  >
                    <span className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                      {day}
                    </span>
                    {hasTask && (
                      <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_5px_rgba(242,171,61,0.8)]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
