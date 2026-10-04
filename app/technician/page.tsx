'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';
import { useConfirmModal } from '@/components/ConfirmModal';

interface DispatchItem {
  id: string; dispatchNo: string; type: string; name: string; location: string; item: string; notes: string; status: string;
  technicians?: { firstName: string; lastName: string }[];
  scheduledDate?: string;
}

function GeocodedMap({ address }: { address: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!address) return;
    
    // Check if coordinates were passed from checkout
    if (address.includes('| COORDS:')) {
      const coordsPart = address.split('| COORDS:')[1];
      if (coordsPart) {
        const [lat, lng] = coordsPart.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCoords({ lat, lng });
          return;
        }
      }
    }

    // Geocode the address using Nominatim (free, no API key needed)
    const cleanAddress = address.split('| COORDS:')[0].trim();
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress + ', Philippines')}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          // Fallback coordinate for demo purposes if address not found
          setCoords({ lat: 14.6091, lng: 121.0223 }); // somewhere in QC/Manila
        }
      })
      .catch((err) => {
        console.error('Geocoding error:', err);
        setCoords({ lat: 14.6091, lng: 121.0223 });
      });
  }, [address]);

  return <GoogleMap height="300px" center={coords || { lat: 14.6091, lng: 121.0223 }} markerPosition={coords || { lat: 14.6091, lng: 121.0223 }} pinnable={false} />;
}

export default function TechnicianDashboard() {
  const { confirm, showAlert, ModalComponent } = useConfirmModal();
  const [tasks, setTasks] = useState<DispatchItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [techName, setTechName] = useState('');

  const [showClientModal, setShowClientModal] = useState(false);
  const [showSuppliesModal, setShowSuppliesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DispatchItem | null>(null);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    router.push('/login');
  };

  useEffect(() => {
    setIsLoggedIn(sessionStorage.getItem('userName') !== null);
    const sessionName = sessionStorage.getItem('userName');
    if (sessionName) setTechName(sessionName);

    fetch('/api/dispatch')
      .then(r => r.json())
      .then((data: DispatchItem[]) => {
        // Filter tasks assigned to this technician
        const myTasks = data.filter(d => 
          d.technicians?.some(t => `${t.firstName} ${t.lastName}` === (sessionName || ''))
        );
        setTasks(myTasks);
      })
      .catch(console.error);
  }, []);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    // Optimistically update the state
    setTasks(prev => prev.map(t => t.id === jobId ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`/api/dispatch`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status: newStatus }) 
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleSendInvoice = async (job: DispatchItem, invoiceType: 'ADMIN' | 'CUSTOMER') => {
    const isConfirmed = await confirm({
      title: `Send ${invoiceType === 'ADMIN' ? 'Admin Invoice' : 'Customer Receipt'}`,
      message: `Are you sure you want to send this ${invoiceType.toLowerCase()} for ${job.name}?`
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: invoiceType,
          dispatchId: job.id,
          dispatchNo: job.dispatchNo,
          customerName: job.name,
          serviceType: job.type,
          acUnit: job.item,
          location: job.location?.split('| COORDS:')[0].trim() || '',
          technicianName: techName,
          amount: 0,
          notes: job.notes || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        showAlert({ 
          title: 'Success', 
          message: `${invoiceType === 'ADMIN' ? 'Admin Invoice' : 'Customer Receipt'} sent successfully!\n\nInvoice No: ${data.invoiceNo}\nCustomer: ${job.name}\nService: ${job.type}` 
        });
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
      showAlert({ title: 'Error', message: 'Failed to send invoice. Please try again.', type: 'error' });
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const progressCount = tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Pending' && t.status === 'PENDING') return true;
    if (filter === 'In Progress' && (t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS')) return true;
    if (filter === 'Completed' && t.status === 'COMPLETED') return true;
    return false;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
    const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
    const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
    return dateA - dateB;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 3;
  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);
  const paginatedTasks = sortedTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  // Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ day: number, tasks: any[] } | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getEventsForDay = (day: number) => {
    return tasks.filter(t => {
      if (!t.scheduledDate) return false;
      const dStr = t.scheduledDate.includes('T') ? t.scheduledDate : t.scheduledDate + 'T00:00:00';
      const d = new Date(dStr);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  const hasEvent = (day: number) => getEventsForDay(day).length > 0;

  return (
    <>
      <ModalComponent />

    {/*  Header  */}
    <header className="tech-header">
        <a href="landingpage.html" className="logo">
            <img src="LOGO.jpg" alt="FrostTech Logo" style={{"height":"35px","verticalAlign":"middle","borderRadius":"4px","marginRight":"8px"}} /> <span style={{"fontWeight":"700","fontSize":"1.2rem","verticalAlign":"middle","color":"white","letterSpacing":"-0.5px"}}>FrostTech</span>
        </a>
        
        <div className="search-bar">
            <input type="text" placeholder="Search jobs, customers..." />
            <button><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <div className="header-icons">
            <div className="kebab-menu">
                <button className="kebab-btn" onClick={() => setKebabOpen(!kebabOpen)}><i className="fa-solid fa-bars"></i></button>
                <div className={`kebab-dropdown ${kebabOpen ? 'active' : ''}`} id="kebab-dropdown">
                    <Link href="/technician"><i className="fa-solid fa-screwdriver-wrench"></i> My Dashboard</Link>
                    <Link href="/technician/calendar"><i className="fa-regular fa-calendar-days"></i> My Calendar</Link>
                    <div className="divider"></div>
                    <Link href="/technician#settings"><i className="fa-solid fa-gear"></i> Settings</Link>
                    {isLoggedIn ? (
                        <a href="#" id="logout-link" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Log Out</a>
                    ) : (
                        <Link href="/login"><i className="fa-solid fa-right-to-bracket"></i> Log In</Link>
                    )}
                </div>
            </div>
        </div>
    </header>

    {/*  Welcome  */}
    <div className="tech-welcome" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
        <div>
            <h2><i className="fa-solid fa-screwdriver-wrench" style={{"marginRight":"10px"}}></i> Technician Dashboard</h2>
            <p>Welcome back, <strong>{techName}</strong> — here's your workday overview.</p>
        </div>
        <div style={{"display":"flex","gap":"10px","alignItems":"center"}}>
            <button className="btn btn-sm" onClick={() => setShowSuppliesModal(true)}><i className="fa-solid fa-box"></i> Request Supplies</button>
            <span className="status-badge status-online"><i className="fa-solid fa-circle" style={{"fontSize":"0.6rem","marginRight":"6px"}}></i> On Duty</span>
        </div>
    </div>

    {/*  Stats  */}
    <div className="tech-stats">
        <div className="stat-card">
            <i className="fa-solid fa-clipboard-list" style={{"color":"var(--primary)"}}></i>
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total Jobs Today</span>
        </div>
        <div className="stat-card">
            <i className="fa-solid fa-spinner" style={{"color":"#ffc107"}}></i>
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
            <i className="fa-solid fa-wrench" style={{"color":"#007bff"}}></i>
            <span className="stat-number">{progressCount}</span>
            <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
            <i className="fa-solid fa-circle-check" style={{"color":"#28a745"}}></i>
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Completed</span>
        </div>
    </div>

    {/*  Main Content  */}
    <div className="tech-main">

        {/*  Jobs List  */}
        <div className="jobs-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)' }}><i className="fa-solid fa-list-check" style={{"marginRight":"8px", color: 'var(--primary)'}}></i> Assigned Jobs</h3>
            
            <div className="job-filters" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                    className={`filter-btn ${filter === 'All' ? 'active' : ''}`} 
                    onClick={() => setFilter('All')}
                    style={{ background: filter === 'All' ? 'var(--primary)' : 'transparent', color: filter === 'All' ? 'white' : 'var(--text-light)', border: '1px solid var(--border-color)' }}
                >All</button>
                <button 
                    className={`filter-btn ${filter === 'Pending' ? 'active' : ''}`} 
                    onClick={() => setFilter('Pending')}
                    style={{ background: filter === 'Pending' ? 'var(--primary)' : 'transparent', color: filter === 'Pending' ? 'white' : 'var(--text-light)', border: '1px solid var(--border-color)' }}
                >Pending</button>
                <button 
                    className={`filter-btn ${filter === 'In Progress' ? 'active' : ''}`} 
                    onClick={() => setFilter('In Progress')}
                    style={{ background: filter === 'In Progress' ? 'var(--primary)' : 'transparent', color: filter === 'In Progress' ? 'white' : 'var(--text-light)', border: '1px solid var(--border-color)' }}
                >In Progress</button>
                <button 
                    className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`} 
                    onClick={() => setFilter('Completed')}
                    style={{ background: filter === 'Completed' ? 'var(--primary)' : 'transparent', color: filter === 'Completed' ? 'white' : 'var(--text-light)', border: '1px solid var(--border-color)' }}
                >Completed</button>
            </div>

            {paginatedTasks.length === 0 && <p style={{textAlign: 'center', padding: '2rem'}}>No jobs match this filter.</p>}
            {paginatedTasks.map(job => {
                const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset()*60*1000)).toISOString().split('T')[0];
                const isToday = !!(job.scheduledDate && job.scheduledDate.startsWith(todayStr));

                return (
                <div key={job.id} className={`job-card ${job.type === 'Deep Cleaning' ? 'deep-cleaning' : job.type === 'Repair' ? 'repair' : ''}`} data-status={job.status.toLowerCase()}>
                    <div className="job-card-header">
                        <h4>
                            <i className={`fa-solid ${job.type === 'New Installation' ? 'fa-screwdriver-wrench' : job.type === 'Deep Cleaning' ? 'fa-shield-halved' : 'fa-wrench'}`} style={{color: job.type === 'New Installation' ? 'var(--primary)' : job.type === 'Deep Cleaning' ? '#28a745' : 'var(--accent-red)', marginRight: '8px'}}></i>
                            {job.type}
                        </h4>
                        <span className={`job-status ${job.status === 'PENDING' ? 'pending' : job.status === 'COMPLETED' ? 'completed' : 'in-progress'}`}>{job.status === 'ASSIGNED' ? 'In Progress' : job.status}</span>
                    </div>
                    <div className="job-detail-row"><i className="fa-solid fa-user"></i> {job.name}</div>
                    <div className="job-detail-row"><i className="fa-solid fa-location-dot"></i> {job.location?.split('| COORDS:')[0].trim()}</div>
                    <div className="job-detail-row"><i className="fa-solid fa-fan"></i> {job.item}</div>
                    <div className="job-detail-row"><i className="fa-regular fa-calendar-check"></i> {job.scheduledDate || 'No date set'}</div>
                    <div className="job-detail-row"><i className="fa-regular fa-clipboard"></i> {job.notes || 'No extra notes'}</div>
                    <div className="job-actions" style={{ flexWrap: 'wrap' }}>
                        {job.status === 'COMPLETED' ? (
                            <>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleSendInvoice(job, 'ADMIN')}><i className="fa-solid fa-file-invoice"></i> Admin Invoice</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleSendInvoice(job, 'CUSTOMER')}><i className="fa-solid fa-receipt"></i> Customer Receipt</button>
                            </>
                        ) : job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' ? (
                            <button className="btn btn-sm" onClick={() => { if(isToday) handleUpdateStatus(job.id, 'COMPLETED') }} disabled={!isToday} style={{ opacity: isToday ? 1 : 0.5, cursor: isToday ? 'pointer' : 'not-allowed' }} title={!isToday ? "You can only mark jobs complete on their scheduled date." : ""}><i className="fa-solid fa-check"></i> Mark Complete &rarr;</button>
                        ) : (
                            <button className="btn btn-sm" onClick={() => { if(isToday) handleUpdateStatus(job.id, 'ASSIGNED') }} disabled={!isToday} style={{ opacity: isToday ? 1 : 0.5, cursor: isToday ? 'pointer' : 'not-allowed' }} title={!isToday ? "You can only start jobs on their scheduled date." : ""}><i className="fa-solid fa-play"></i> Start Job &rarr;</button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedJob(job); setShowClientModal(true); }}><i className="fa-solid fa-circle-info"></i> Client Info</button>
                    </div>
                </div>
            )})}

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&larr; Previous</button>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Page {currentPage} of {totalPages}</span>
                    <button className="btn btn-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next &rarr;</button>
                </div>
            )}
        </div>

        {/*  Today's Schedule  */}
        <div className="schedule-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)' }}><i className="fa-regular fa-calendar" style={{"marginRight":"8px", color: 'var(--primary)'}}></i> Today&apos;s Schedule</h3>

            {(() => {
                const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset()*60*1000)).toISOString().split('T')[0];
                const todaysTasks = [...tasks]
                    .filter(t => t.scheduledDate && t.scheduledDate.startsWith(todayStr))
                    .sort((a, b) => a.scheduledDate!.localeCompare(b.scheduledDate!));

                if (todaysTasks.length === 0) {
                    return <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No jobs scheduled for today.</p>;
                }

                return todaysTasks.map(task => {
                    const datePart = task.scheduledDate!.split(' ')[0]; // "2026-10-04"
                    const timePart = task.scheduledDate!.replace(datePart, '').trim(); // "Morning (8AM - 12PM)"
                    const d = new Date(datePart);
                    const month = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short' }) : '';
                    const day = !isNaN(d.getTime()) ? d.getDate().toString() : '';

                    return (
                        <div key={`sched-${task.id}`} className="schedule-slot" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                            setSelectedJob(task);
                            setShowClientModal(true);
                        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                            <div className="slot-time" style={{ whiteSpace: 'pre-line', textAlign: 'center', lineHeight: '1.2', minWidth: '60px' }}>
                                <strong style={{fontSize: '1.2rem', color: 'var(--primary)'}}>{day}</strong><br/>
                                <span style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)'}}>{month}</span>
                            </div>
                            <div className="slot-info" style={{ flex: 1 }}>
                                <h5>{task.name}</h5>
                                <p style={{ marginBottom: '0.2rem' }}>{task.location?.split('| COORDS:')[0].trim()}</p>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>{timePart || 'Time TBA'}</span>
                            </div>
                            <span className={`slot-type ${task.type === 'Deep Cleaning' ? 'deep-cleaning' : task.type === 'Repair' ? 'repair' : 'cleaning'}`}>
                                {task.type === 'New Installation' ? 'Install' : task.type === 'Deep Cleaning' ? 'Deep Clean' : 'Repair'}
                            </span>
                        </div>
                    );
                });
            })()}
        </div>
    </div>



    {/*  Client Info Modal  */}
    <div className={`modal-overlay ${showClientModal ? 'show' : ''}`} id="client-info-modal">
        <div className="modal-content">
            <div className="modal-header">
                <div>
                    <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}><i className="fa-solid fa-user-circle" style={{"marginRight":"8px"}}></i> Client Information</h2>
                </div>
                <button className="close-modal" onClick={() => setShowClientModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
                <h3 style={{"margin":"1.5rem 0 1rem","color":"var(--text-dark)","fontSize":"1.1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"0.8rem"}}>Current Task Details</h3>
                <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1.5rem","marginBottom":"1.5rem"}}>
                    <div style={{"background":"var(--bg-card)","padding":"1.2rem","borderRadius":"var(--radius-md)","border":"1px solid var(--border-color)"}}>
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"0.8rem","fontSize":"0.95rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"0.5rem"}}>Contact Details</h4>
                        <p style={{"fontSize":"0.9rem","marginBottom":"0.4rem","color":"var(--text-dark)"}}><strong>Name:</strong> <span>{selectedJob?.name}</span></p>
                        <p style={{"fontSize":"0.9rem","marginBottom":"0.4rem","color":"var(--text-dark)"}}><strong>Phone:</strong> <a href="#" style={{"color":"var(--primary)","textDecoration":"none","fontWeight":"500"}}>+63 9XX XXX XXXX</a></p>
                    </div>
                    <div style={{"background":"var(--bg-card)","padding":"1.2rem","borderRadius":"var(--radius-md)","border":"1px solid var(--border-color)"}}>
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"0.8rem","fontSize":"0.95rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"0.5rem"}}>Job Details</h4>
                        <p style={{"fontSize":"0.9rem","marginBottom":"0.4rem","color":"var(--text-dark)"}}><strong>AC Unit:</strong> <span>{selectedJob?.item}</span></p>
                        <p style={{"fontSize":"0.9rem","marginBottom":"0.4rem","color":"var(--text-dark)"}}><strong>Type:</strong> <span>{selectedJob?.type}</span></p>
                    </div>
                </div>
                
                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.8rem","fontSize":"0.95rem"}}><i className="fa-solid fa-location-dot" style={{"color":"var(--accent-red)","marginRight":"5px"}}></i> Location</h4>
                <p style={{"fontSize":"0.9rem","marginBottom":"1rem"}}>{selectedJob?.location?.split('| COORDS:')[0].trim()}</p>
                
                {/*  Map Container  */}
                <div style={{height: "300px", zIndex: 1, marginBottom: '1.5rem'}}>
                    {selectedJob?.location && showClientModal && (
                      <GeocodedMap key={selectedJob.id} address={selectedJob.location} />
                    )}
                </div>
                
                <div style={{"marginTop":"1.5rem","display":"flex","justifyContent":"space-between", "flexWrap": "wrap", "gap": "1rem"}}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => { if(selectedJob) handleSendInvoice(selectedJob, 'ADMIN') }}>
                            <i className="fa-solid fa-file-invoice"></i> Admin Invoice
                        </button>
                        <button className="btn btn-secondary" onClick={() => { if(selectedJob) handleSendInvoice(selectedJob, 'CUSTOMER') }}>
                            <i className="fa-solid fa-receipt"></i> Customer Receipt
                        </button>
                    </div>
                    <button className="btn" onClick={() => setShowClientModal(false)}><i className="fa-solid fa-check"></i> Close</button>
                </div>
            </div>
        </div>
    </div>

    {/*  Request Supplies Modal  */}
    <div className={`modal-overlay ${showSuppliesModal ? 'show' : ''}`} id="request-supplies-modal">
        <div className="modal-content" style={{"maxWidth":"500px"}}>
            <div className="modal-header">
                <h3><i className="fa-solid fa-box" style={{"color":"var(--primary)"}}></i> Request Supplies</h3>
                <button className="close-modal" onClick={() => setShowSuppliesModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
                <div style={{"marginBottom":"1rem"}}>
                    <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-dark)","display":"block","marginBottom":"0.4rem"}}>Item / Tool Needed</label>
                    <input type="text" id="req-item" placeholder="e.g. Copper Tubing, R32 Refrigerant, Multi-tester" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit","background":"transparent","color":"var(--text-dark)"}} />
                </div>
                <div style={{"marginBottom":"1rem"}}>
                    <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-dark)","display":"block","marginBottom":"0.4rem"}}>Quantity</label>
                    <input type="number" id="req-qty" placeholder="1" min="1" defaultValue="1" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit","background":"transparent","color":"var(--text-dark)"}} />
                </div>
                <div style={{"marginBottom":"1.5rem"}}>
                    <label style={{"fontSize":"0.85rem","fontWeight":"600","color":"var(--text-dark)","display":"block","marginBottom":"0.4rem"}}>Reason / Job Reference</label>
                    <textarea id="req-reason" rows={3} placeholder="Briefly state why this is needed..." style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit","resize":"vertical","background":"transparent","color":"var(--text-dark)"}}></textarea>
                </div>
                <button className="btn" style={{"width":"100%"}} onClick={async () => {
                    const itemEl = document.getElementById('req-item') as HTMLInputElement;
                    const qtyEl = document.getElementById('req-qty') as HTMLInputElement;
                    const reasonEl = document.getElementById('req-reason') as HTMLTextAreaElement;
                    const item = itemEl?.value?.trim();
                    const qty = parseInt(qtyEl?.value || '1', 10);
                    const reason = reasonEl?.value?.trim();
                    if (!item) return showAlert({ title: 'Missing Item', message: 'Please enter the item needed.', type: 'warning' });
                    const techId = sessionStorage.getItem('userId');
                    if (!techId) return showAlert({ title: 'Authentication Error', message: 'Not logged in.', type: 'error' });
                    
                    const isConfirmed = await confirm({
                        title: 'Request Supplies',
                        message: `Submit request for ${qty}x ${item}?`
                    });
                    if (!isConfirmed) return;

                    try {
                      const res = await fetch('/api/tech-requests', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ technicianId: techId, itemNeeded: item, quantity: qty, reason: reason || 'N/A' })
                      });
                      if (res.ok) {
                        showAlert({ title: 'Success', message: 'Supply request submitted successfully!' });
                        if (itemEl) itemEl.value = '';
                        if (qtyEl) qtyEl.value = '1';
                        if (reasonEl) reasonEl.value = '';
                        setShowSuppliesModal(false);
                      } else {
                        throw new Error('Failed');
                      }
                    } catch (err) {
                      console.error(err);
                      showAlert({ title: 'Error', message: 'Failed to submit request. Please try again.', type: 'error' });
                    }
                }}>Submit Request &rarr;</button>
            </div>
        </div>
    </div>

    {/*  Footer  */}
    <footer>
        <div className="footer-grid">
            <div className="footer-col">
                <h3>Customer Service</h3>
                <ul>
                    <li><a href="#">Contact Us</a></li>
                    <li><a href="#">Track Order</a></li>
                    <li><a href="#">Return Policy</a></li>
                </ul>
            </div>
            <div className="footer-col">
                <h3>About FrostTech</h3>
                <ul>
                    <li><a href="#">Our Story</a></li>
                    <li><a href="#">Store Locations</a></li>
                    <li><a href="#">Careers</a></li>
                </ul>
            </div>
            <div className="footer-col">
                <h3>Connect With Us</h3>
                <ul>
                    <li><a href="https://www.facebook.com/FrostTechCoolingSolutionsCo" target="_blank"><i className="fa-brands fa-facebook"></i> Facebook</a></li>
                </ul>
            </div>
        </div>
        <div className="footer-bottom">
            &copy; 2026 FrostTech Cooling Solutions Co. All rights reserved.
        </div>
    </footer>

    

</>
  );
}