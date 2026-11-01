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

  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: new Date().toISOString().split('T')[0], type: 'job' });

  const loadAllTasks = () => {
    const sessionName = sessionStorage.getItem('userName') || 'Carlos Rivera';
    
    Promise.all([
      fetch('/api/dispatch').then(r => r.json()).catch(() => []),
      fetch('/api/maintenance').then(r => r.json()).catch(() => []),
      fetch(`/api/calendar?technician=${encodeURIComponent(sessionName)}`).then(r => r.json()).catch(() => [])
    ]).then(([dispatchData, maintenanceData, calendarData]) => {
      const myDispatch = (dispatchData || []).filter((d: any) => 
        d.technicians?.some((t: any) => `${t.firstName} ${t.lastName}` === sessionName)
      ).map((d: any) => ({ ...d, isMaintenance: false }));
      
      const myMaintenance = (maintenanceData || []).filter((m: any) => 
        m.technicianName === sessionName
      ).map((m: any) => ({ ...m, type: 'Maintenance: ' + m.serviceType, isMaintenance: true }));

      const myCalendar = (calendarData || []).map((c: any) => ({
        id: c.id,
        scheduledDate: c.date,
        type: `Event: ${c.type.toUpperCase()}`,
        name: c.technician,
        item: c.title,
        status: 'SCHEDULED',
        isEvent: true
      }));
      
      setTasks([...myDispatch, ...myMaintenance, ...myCalendar]);
    }).catch(console.error);
  };

  useEffect(() => {
    loadAllTasks();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getEventsForDay = (day: number) => {
    return tasks.filter(t => {
      if (!t.scheduledDate) return false;
      // Extract just the YYYY-MM-DD part (before the time block text)
      const datePart = t.scheduledDate.split(' ')[0];
      const d = new Date(datePart + 'T00:00:00');
      return !isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
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
          <div style={{display: 'flex', gap: '0.75rem'}}>
            <button 
              onClick={() => setShowEventModal(true)}
              className="btn" 
              style={{background: 'var(--primary-grad)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)'}}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Appointment
            </button>
            <button className="btn" style={{background: 'var(--bg-input)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <FontAwesomeIcon icon={faPlus} /> Request Time Off
            </button>
          </div>
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

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="modal-overlay show" onClick={(e) => { if(e.target === e.currentTarget) setShowEventModal(false); }}>
          <div className="modal-content" style={{maxWidth: '450px', transform: 'none'}}>
            <div className="modal-header">
              <h3 style={{fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--primary)'}}>
                Add Schedule / Appointment
              </h3>
              <button onClick={() => setShowEventModal(false)} className="close-modal">&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const sessionName = sessionStorage.getItem('userName') || 'Carlos Rivera';
              try {
                const res = await fetch('/api/calendar', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: newEvent.title,
                    date: newEvent.date,
                    technician: sessionName,
                    type: newEvent.type
                  })
                });
                if (res.ok) {
                  setShowEventModal(false);
                  setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], type: 'job' });
                  loadAllTasks();
                } else {
                  alert('Failed to save appointment to database');
                }
              } catch (err) {
                console.error('Failed to create event:', err);
              }
            }} className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.35rem'}}>Appointment Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Diagnostic Inspection at Branch B"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  style={{width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-dark)'}}
                />
              </div>

              <div>
                <label style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.35rem'}}>Date</label>
                <input 
                  type="date" 
                  required
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  style={{width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-dark)'}}
                />
              </div>

              <div>
                <label style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.35rem'}}>Type</label>
                <select 
                  value={newEvent.type}
                  onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                  style={{width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-dark)'}}
                >
                  <option value="job">Service Job</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Site Inspection</option>
                  <option value="meeting">Team Briefing</option>
                </select>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem'}}>
                <button type="button" onClick={() => setShowEventModal(false)} className="btn" style={{background: 'var(--bg-input)', border: '1px solid var(--border-color)'}}>Cancel</button>
                <button type="submit" className="btn" style={{background: 'var(--primary-grad)'}}>Save to Calendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
