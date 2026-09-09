'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';

interface DispatchItem {
  id: string; dispatchNo: string; type: string; name: string; location: string; item: string; notes: string; status: string;
  technician?: { firstName: string; lastName: string } | null;
}

export default function TechnicianDashboard() {
  const [tasks, setTasks] = useState<DispatchItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [techName, setTechName] = useState('Carlos Rivera');

  const [showClientModal, setShowClientModal] = useState(false);
  const [showSuppliesModal, setShowSuppliesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DispatchItem | null>(null);
  const [kebabOpen, setKebabOpen] = useState(false);
  const router = useRouter();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    router.push('/login');
  };

  useEffect(() => {
    // Attempt to get user name from session, fallback to Carlos Rivera for demo
    const sessionName = sessionStorage.getItem('userName');
    if (sessionName) setTechName(sessionName);

    fetch('/api/dispatch')
      .then(r => r.json())
      .then((data: DispatchItem[]) => {
        // Filter tasks assigned to this technician
        const myTasks = data.filter(d => 
          d.technician && `${d.technician.firstName} ${d.technician.lastName}` === (sessionName || 'Carlos Rivera')
        );
        setTasks(myTasks);
      })
      .catch(console.error);
  }, []);

  const handleUpdateStatus = (jobId: string, newStatus: string) => {
    // Optimistically update the state
    setTasks(prev => prev.map(t => t.id === jobId ? { ...t, status: newStatus } : t));
    
    // In a real app we'd make a PATCH request here:
    // fetch(`/api/dispatch/${jobId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
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

  return (
    <>


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
                    <a href="technician.html"><i className="fa-solid fa-screwdriver-wrench"></i> My Dashboard</a>
                    <a href="tech-calendar.html"><i className="fa-regular fa-calendar-days"></i> My Calendar</a>
                    <div className="divider"></div>
                    <a href="technician.html#settings"><i className="fa-solid fa-gear"></i> Settings</a>
                    <a href="#" id="logout-link" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Log Out</a>
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

            {filteredTasks.length === 0 && <p style={{textAlign: 'center', padding: '2rem'}}>No jobs match this filter.</p>}
            {filteredTasks.map(job => (
                <div key={job.id} className={`job-card ${job.type === 'Deep Cleaning' ? 'deep-cleaning' : job.type === 'Repair' ? 'repair' : ''}`} data-status={job.status.toLowerCase()}>
                    <div className="job-card-header">
                        <h4>
                            <i className={`fa-solid ${job.type === 'New Installation' ? 'fa-screwdriver-wrench' : job.type === 'Deep Cleaning' ? 'fa-shield-halved' : 'fa-wrench'}`} style={{color: job.type === 'New Installation' ? 'var(--primary)' : job.type === 'Deep Cleaning' ? '#28a745' : 'var(--accent-red)', marginRight: '8px'}}></i>
                            {job.type}
                        </h4>
                        <span className={`job-status ${job.status === 'PENDING' ? 'pending' : job.status === 'COMPLETED' ? 'completed' : 'in-progress'}`}>{job.status === 'ASSIGNED' ? 'In Progress' : job.status}</span>
                    </div>
                    <div className="job-detail-row"><i className="fa-solid fa-user"></i> {job.name}</div>
                    <div className="job-detail-row"><i className="fa-solid fa-location-dot"></i> {job.location}</div>
                    <div className="job-detail-row"><i className="fa-solid fa-fan"></i> {job.item}</div>
                    <div className="job-detail-row"><i className="fa-regular fa-clipboard"></i> {job.notes || 'No extra notes'}</div>
                    <div className="job-actions">
                        {job.status === 'COMPLETED' ? (
                            <button className="btn btn-sm btn-secondary" disabled style={{"opacity":"0.6"}}><i className="fa-solid fa-check-double"></i> Done</button>
                        ) : job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' ? (
                            <button className="btn btn-sm" onClick={() => handleUpdateStatus(job.id, 'COMPLETED')}><i className="fa-solid fa-check"></i> Mark Complete &rarr;</button>
                        ) : (
                            <button className="btn btn-sm" onClick={() => handleUpdateStatus(job.id, 'ASSIGNED')}><i className="fa-solid fa-play"></i> Start Job &rarr;</button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedJob(job); setShowClientModal(true); }}><i className="fa-solid fa-circle-info"></i> Client Info</button>
                    </div>
                </div>
            ))}

        </div>

        {/*  Today's Schedule  */}
        <div className="schedule-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-dark)' }}><i className="fa-regular fa-calendar" style={{"marginRight":"8px", color: 'var(--primary)'}}></i> Today's Schedule</h3>
            <p style={{"fontSize":"0.85rem","color":"var(--text-light)","marginBottom":"1.5rem"}}>Friday, June 27, 2026</p>

            <div className="schedule-slot">
                <div className="slot-time">8:00<br />AM</div>
                <div className="slot-info">
                    <h5>Lisa Cruz</h5>
                    <p>BGC, Taguig</p>
                </div>
                <span className="slot-type cleaning">Cleaning</span>
            </div>
            <div className="schedule-slot">
                <div className="slot-time">9:30<br />AM</div>
                <div className="slot-info">
                    <h5>Ben Reyes</h5>
                    <p>Mandaluyong</p>
                </div>
                <span className="slot-type repair">Repair</span>
            </div>
            <div className="schedule-slot">
                <div className="slot-time">10:00<br />AM</div>
                <div className="slot-info">
                    <h5>John Doe</h5>
                    <p>Makati City</p>
                </div>
                <span className="slot-type cleaning">Cleaning</span>
            </div>
            <div className="schedule-slot">
                <div className="slot-time">1:00<br />PM</div>
                <div className="slot-info">
                    <h5>Maria Santos</h5>
                    <p>Quezon City</p>
                </div>
                <span className="slot-type repair">Repair</span>
            </div>
            <div className="schedule-slot">
                <div className="slot-time">3:30<br />PM</div>
                <div className="slot-info">
                    <h5>Andrew Lim</h5>
                    <p>Pasig City</p>
                </div>
                <span className="slot-type deep-cleaning">Deep Clean</span>
            </div>
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
                <p style={{"fontSize":"0.9rem","marginBottom":"1rem"}}>{selectedJob?.location}</p>
                
                {/*  Map Container  */}
                <div style={{height: "300px", zIndex: 1, marginBottom: '1.5rem'}}>
                    <GoogleMap height="300px" />
                </div>
                
                <div style={{"marginTop":"1.5rem","display":"flex","justifyContent":"flex-end"}}>
                    <button className="btn" onClick={() => setShowClientModal(false)}><i className="fa-solid fa-check"></i> Got it</button>
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
                <button className="btn" style={{"width":"100%"}} onClick={() => {
                    alert('Supply request submitted!');
                    setShowSuppliesModal(false);
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