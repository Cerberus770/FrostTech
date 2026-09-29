'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faCalendarDay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useAppState } from '@/context/AppStateContext';

export default function TechnicianCalendar() {
  const { state } = useAppState();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ day: number, tasks: any[] } | null>(null);

  useEffect(() => {
    const sessionName = sessionStorage.getItem('userName') || 'Carlos Rivera';
    
    Promise.all([
      fetch('/api/dispatch').then(r => r.json()),
      fetch('/api/maintenance').then(r => r.json())
    ]).then(([dispatchData, maintenanceData]) => {
      const myDispatch = (dispatchData || []).filter((d: any) => 
        d.technicians?.some((t: any) => `${t.firstName} ${t.lastName}` === sessionName)
      ).map((d: any) => ({ ...d, isMaintenance: false }));
      
      const myMaintenance = (maintenanceData || []).filter((m: any) => 
        m.technicianName === sessionName
      ).map((m: any) => ({ ...m, type: 'Maintenance: ' + m.serviceType, isMaintenance: true }));
      
      setTasks([...myDispatch, ...myMaintenance]);
    }).catch(console.error);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getEventsForDay = (day: number) => {
    return tasks.filter(t => {
      if (!t.scheduledDate) return false;
      // Handle "YYYY-MM-DD" and ISO formats properly without local time shift
      const dStr = t.scheduledDate.includes('T') ? t.scheduledDate : t.scheduledDate + 'T00:00:00';
      const d = new Date(dStr);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  const hasEvent = (day: number) => getEventsForDay(day).length > 0;

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header className="tech-header" style={{position: 'sticky', top: 0, zIndex: 50}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Link href="/technician" style={{color: 'var(--text-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main style={{maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <div>
            <h2 style={{fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-display)'}}>My Schedule</h2>
            <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.25rem'}}>Manage your upcoming appointments and leave.</p>
          </div>
          <button className="btn" style={{background: 'var(--primary-grad)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)'}}>
            <FontAwesomeIcon icon={faPlus} /> Request Time Off
          </button>
        </div>

        <div style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden'}}>
          {/* Calendar Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card-alt)'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)'}}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button onClick={prevMonth} className="btn" style={{padding: '0.5rem 0.75rem', background: 'var(--bg-input)'}}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="btn" style={{background: 'var(--bg-input)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <FontAwesomeIcon icon={faCalendarDay} /> Today
              </button>
              <button onClick={nextMonth} className="btn" style={{padding: '0.5rem 0.75rem', background: 'var(--bg-input)'}}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{padding: '1.5rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', marginBottom: '1rem', textAlign: 'center'}}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={{fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{day}</div>
              ))}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem'}}>
              {/* Empty slots before first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} style={{aspectRatio: '1/1', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)'}} />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                const hasTask = hasEvent(day);

                return (
                  <div
                    key={day}
                    onClick={() => {
                      const dayTasks = getEventsForDay(day);
                      if (dayTasks.length > 0) {
                        setSelectedDayTasks({ day, tasks: dayTasks });
                      }
                    }}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: 'var(--radius-md)',
                      border: isToday ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isToday ? 'rgba(0, 155, 213, 0.1)' : 'var(--bg-input)',
                      boxShadow: isToday ? 'inset 0 0 10px rgba(0,155,213,0.2)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: hasTask ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isToday) e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <span style={{fontSize: '1.125rem', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-dark)'}}>
                      {day}
                    </span>
                    {hasTask && (
                      <div style={{position: 'absolute', bottom: '12px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 5px rgba(242,171,61,0.8)'}} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Selected Day Modal */}
      {selectedDayTasks && (
        <div className="modal-overlay show" onClick={(e) => { if(e.target === e.currentTarget) setSelectedDayTasks(null); }}>
          <div className="modal-content" style={{maxWidth: '500px', transform: 'none'}}>
            <div className="modal-header">
              <div>
                <h3 style={{fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--primary)'}}>
                  Tasks for {monthNames[currentDate.getMonth()]} {selectedDayTasks.day}, {currentDate.getFullYear()}
                </h3>
              </div>
              <button onClick={() => setSelectedDayTasks(null)} className="close-modal">&times;</button>
            </div>
            <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {selectedDayTasks.tasks.map(t => (
                <div key={t.id} style={{background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                    <div>
                      <span style={{fontWeight: 700, color: 'var(--text-dark)'}}>{t.type || 'Job'}</span>
                      <div style={{fontSize: '0.8rem', color: 'var(--text-light)'}}>{t.dispatchNo || t.scheduleNo}</div>
                    </div>
                    <span style={{fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)'}}>{t.status}</span>
                  </div>
                  <p style={{fontSize: '0.9rem', color: 'var(--text-light)'}}><strong>Customer:</strong> {t.name}</p>
                  <p style={{fontSize: '0.9rem', color: 'var(--text-light)'}}><strong>Location:</strong> {t.location || t.address}</p>
                  <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem'}}><strong>Item:</strong> {t.item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
