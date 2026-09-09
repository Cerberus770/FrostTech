'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/GoogleMap';

interface InventoryItem {
  id: string; sku: string; brand: string; model: string; category: string; stock: number; price: number;
}
interface Order {
  id: string; orderNo: string; name: string; location: string; item: string; payment: string; status: string; date: string;
}
interface Installment {
  id: string; appId: string; name: string; item: string; date: string; status: string; issue: string; term: number; employer: string; income: string; idType: string;
}
interface DispatchItem {
  id: string; dispatchNo: string; type: string; name: string; location: string; item: string; notes: string; status: string;
  technician?: { firstName: string; lastName: string } | null;
}
interface MaintenanceItem {
  id: string; scheduleNo: string; name: string; phone: string; address: string; item: string; serviceType: string; scheduledDate: string; technicianName: string; status: string; notes: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('tab-inventory');
  const [activeInstTab, setActiveInstTab] = useState('inst-pending');
  const [activeDispatchTab, setActiveDispatchTab] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [dispatch, setDispatch] = useState<DispatchItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);

  // Calendar state (defaults to July 2026 where our seed data is)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));
  const [kebabOpen, setKebabOpen] = useState(false);
  const router = useRouter();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    router.push('/login');
  };

  useEffect(() => {
    fetch('/api/inventory').then(r => r.json()).then(setInventory).catch(() => {});
    fetch('/api/orders').then(r => r.json()).then(setOrders).catch(() => {});
    fetch('/api/installments').then(r => r.json()).then(setInstallments).catch(() => {});
    fetch('/api/dispatch').then(r => r.json()).then(setDispatch).catch(() => {});
    fetch('/api/maintenance').then(r => r.json()).then(setMaintenance).catch(() => {});
  }, []);

  const acInventory = inventory.filter(i => i.category.includes('AC'));
  const partsInventory = inventory.filter(i => !i.category.includes('AC'));

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', className: 'status-critical' };
    if (stock <= 5) return { label: 'Low Stock', className: 'status-low' };
    return { label: 'In Stock', className: 'status-good' };
  };

  return (
    <>


    {/*  Header  */}
    <header className="admin-header">
        <a href="landingpage.html" className="logo">
            <img src="LOGO.jpg" alt="FrostTech Logo" style={{"height":"35px","verticalAlign":"middle","borderRadius":"4px","marginRight":"8px"}} /> <span style={{"fontWeight":"700","fontSize":"1.2rem","verticalAlign":"middle","color":"white","letterSpacing":"-0.5px"}}>FrostTech</span>
        </a>

        <div className="search-bar">
            <input type="text" id="admin-search" placeholder="Search by name, customer ID, or item..." />
            <button><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <div className="header-icons">
            <div className="kebab-menu">
                <button className="kebab-btn" onClick={() => setKebabOpen(!kebabOpen)}><i className="fa-solid fa-bars"></i></button>
                <div className={`kebab-dropdown ${kebabOpen ? 'active' : ''}`} id="kebab-dropdown">
                    <a href="admin.html"><i className="fa-solid fa-shield-halved"></i> Admin Console</a>
                    <div className="divider"></div>
                    <a href="#" id="logout-link" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Log Out</a>
                </div>
            </div>
        </div>
    </header>

    <div className="admin-layout">

        {/*  Sidebar  */}
        <aside className="admin-sidebar">
            <div className="admin-profile">
                <i className="fa-solid fa-shield-halved"
                    style={{"fontSize":"3rem","color":"var(--primary)","marginBottom":"10px"}}></i>
                <h3>Admin Portal</h3>
                <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}}>Owner Access</p>
            </div>
            <ul className="admin-nav">
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-inventory'); }}><i
                            className="fa-solid fa-boxes-stacked"></i> Inventory</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-pos' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-pos'); }}><i className="fa-solid fa-cash-register"></i> Point of Sale</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-installments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-installments'); }}><i className="fa-solid fa-file-invoice-dollar"></i> Installment Approvals</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-installations' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-installations'); }}><i
                            className="fa-solid fa-clipboard-check"></i> Pending Orders</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-dispatch' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-dispatch'); }}><i className="fa-solid fa-truck-fast"></i>
                        Dispatch & Schedule</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-maintenance' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-maintenance'); }}><i className="fa-solid fa-calendar-check"></i>
                        Maintenance Schedule</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-calendar' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-calendar'); }}><i className="fa-regular fa-calendar-days"></i>
                        Master Calendar</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-tech-requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-tech-requests'); }}><i className="fa-solid fa-toolbox"></i>
                        Tech Requests</a></li>
                <li><a href="#" className={`tab-btn ${activeTab === 'tab-customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tab-customers'); }}><i className="fa-solid fa-users"></i>
                        Customer Directory</a></li>
            </ul>
        </aside>

        {/*  Main Content  */}
        <main className="admin-content">

            {/*  Point of Sale (POS)  */}
            <div id="tab-pos" className={`tab-panel ${activeTab === 'tab-pos' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Point of Sale</h2>
                    <p>Process walk-in orders and manual transactions.</p>
                </div>
                
                <div className="pos-layout">
                    {/*  Product Catalog  */}
                    <div className="pos-catalog">
                        <div className="search-bar" style={{"width":"100%","marginBottom":"1.5rem","maxWidth":"none"}}>
                            <input type="text" id="pos-search" placeholder="Search products for POS..." style={{"width":"100%","padding":"0.8rem","borderRadius":"8px","border":"1px solid var(--border-color)"}} />
                        </div>
                        
                        <div style={{"marginTop":"1rem"}}>
                            <h3 style={{"marginBottom":"1rem","color":"var(--text-dark)","fontSize":"1.1rem"}}>Air Conditioning Units</h3>
                            <div className="pos-product-grid" id="pos-grid-ac">
                                {/*  Dynamic Content Rendered by admin.js  */}
                            </div>
                            
                            <h3 style={{"margin":"2rem 0 1rem","color":"var(--text-dark)","fontSize":"1.1rem"}}>Parts, Accessories & Tools</h3>
                            <div className="pos-product-grid" id="pos-grid-parts">
                                {/*  Dynamic Content Rendered by admin.js  */}
                            </div>
                        </div>
                    </div>

                    {/*  Cart / Receipt Panel  */}
                    <div className="pos-cart-panel admin-card" style={{"marginBottom":"0"}}>
                        <h3 style={{"marginBottom":"1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"1rem"}}>Current Order</h3>
                        
                        <div className="pos-cart-items" id="pos-cart-items">
                            <div className="empty-cart-msg" style={{"textAlign":"center","color":"var(--text-light)","padding":"2rem 0"}}>
                                <i className="fa-solid fa-cart-shopping" style={{"fontSize":"2rem","marginBottom":"1rem","opacity":"0.5"}}></i><br />
                                No items in order.
                            </div>
                        </div>
                        
                        <div className="pos-totals" style={{"marginTop":"1.5rem","borderTop":"1px solid var(--border-color)","paddingTop":"1.5rem"}}>
                            <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"0.5rem","color":"var(--text-light)"}}>
                                <span>Subtotal</span>
                                <span id="pos-subtotal">₱0.00</span>
                            </div>
                            <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"1rem","color":"var(--text-light)"}}>
                                <span>VAT (12%)</span>
                                <span id="pos-tax">₱0.00</span>
                            </div>
                            <div style={{"display":"flex","justifyContent":"space-between","marginBottom":"1.5rem","fontSize":"1.2rem","fontWeight":"700","color":"var(--text-dark)"}}>
                                <span>Total</span>
                                <span id="pos-total" style={{"color":"var(--primary)"}}>₱0.00</span>
                            </div>
                            
                            <div style={{"marginBottom":"1.5rem"}}>
                                <label style={{"display":"block","marginBottom":"0.5rem","fontSize":"0.9rem","fontWeight":"600"}}>Payment Method</label>
                                <select id="pos-payment-method" style={{"width":"100%","padding":"0.8rem","border":"1px solid var(--border-color)","borderRadius":"6px"}}>
                                    <option value="cash">Cash (Full Payment)</option>
                                    <option value="installment">Installment (Requires Approval)</option>
                                </select>
                            </div>
                            
                            <button className="btn" style={{"width":"100%","padding":"1rem","background":"var(--primary)","fontSize":"1.1rem"}} onClick={() => {}}>
                                <i className="fa-solid fa-check-to-slot"></i> Process Payment &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/*  Installment Approvals  */}
            <div id="tab-installments" className={`tab-panel ${activeTab === 'tab-installments' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Installment Applications</h2>
                    <p>Manage customer requirements and approvals for installment plans.</p>
                </div>
                
                {/*  Sub-tabs for organization  */}
                <div className="installment-tabs" style={{"marginBottom":"1.5rem","display":"flex","gap":"1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"1rem"}}>
                    <button className={`btn inst-tab-btn ${activeInstTab === 'inst-pending' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveInstTab('inst-pending'); }} style={activeInstTab === 'inst-pending' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-regular fa-clock"></i> Pending</button>
                    <button className={`btn btn-secondary inst-tab-btn ${activeInstTab === 'inst-repending' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveInstTab('inst-repending'); }} style={activeInstTab === 'inst-repending' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-triangle-exclamation" style={{"color": activeInstTab === 'inst-repending' ? 'white' : 'var(--accent-red)'}}></i> Re-pending</button>
                    <button className={`btn btn-secondary inst-tab-btn ${activeInstTab === 'inst-completed' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveInstTab('inst-completed'); }} style={activeInstTab === 'inst-completed' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-regular fa-circle-check" style={{"color": activeInstTab === 'inst-completed' ? 'white' : '#28a745'}}></i> Completed</button>
                </div>

                <div className="installment-views">
                    
                    {/*  Pending View  */}
                    <div id="inst-pending" className="inst-view" style={{"display": activeInstTab === 'inst-pending' ? "block" : "none","background":"var(--bg-main)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h3 style={{"marginBottom":"1.5rem","color":"var(--text-dark)"}}>Waiting for Requirements</h3>
                        <div id="inst-pending-container" className="sub-container" style={{"overflowY":"auto","maxHeight":"500px","paddingRight":"10px","display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(300px, 1fr))","gap":"1.5rem"}}>
                            {installments.filter(i => i.status === 'PENDING').map(inst => (
                                <div key={inst.id} className="admin-card">
                                    <h4 style={{marginBottom: '10px'}}>{inst.appId} - {inst.name}</h4>
                                    <p><strong>Item:</strong> {inst.item}</p>
                                    <p><strong>Term:</strong> {inst.term} Months</p>
                                    <button className="btn" style={{marginTop: '10px'}}>Review</button>
                                </div>
                            ))}
                            {installments.filter(i => i.status === 'PENDING').length === 0 && <p>No pending applications.</p>}
                        </div>
                    </div>

                    {/*  Re-pending View  */}
                    <div id="inst-repending" className="inst-view" style={{"display": activeInstTab === 'inst-repending' ? "block" : "none","background":"var(--bg-main)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h3 style={{"marginBottom":"1.5rem","color":"var(--text-dark)"}}>Missing or Incorrect Information</h3>
                        <div id="inst-repending-container" className="sub-container" style={{"overflowY":"auto","maxHeight":"500px","paddingRight":"10px","display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(300px, 1fr))","gap":"1.5rem"}}>
                            {installments.filter(i => i.status === 'REPENDING').map(inst => (
                                <div key={inst.id} className="admin-card">
                                    <h4 style={{marginBottom: '10px'}}>{inst.appId} - {inst.name}</h4>
                                    <p><strong>Issue:</strong> {inst.issue}</p>
                                    <button className="btn" style={{marginTop: '10px'}}>Review</button>
                                </div>
                            ))}
                            {installments.filter(i => i.status === 'REPENDING').length === 0 && <p>No re-pending applications.</p>}
                        </div>
                    </div>

                    {/*  Completed View  */}
                    <div id="inst-completed" className="inst-view" style={{"display": activeInstTab === 'inst-completed' ? "block" : "none","background":"var(--bg-main)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h3 style={{"marginBottom":"1.5rem","color":"var(--text-dark)"}}>Requirements Fully Verified</h3>
                        <div id="inst-completed-container" className="sub-container" style={{"overflowY":"auto","maxHeight":"500px","paddingRight":"10px","display":"grid","gridTemplateColumns":"repeat(auto-fill, minmax(300px, 1fr))","gap":"1.5rem"}}>
                            {installments.filter(i => i.status === 'COMPLETED').map(inst => (
                                <div key={inst.id} className="admin-card">
                                    <h4 style={{marginBottom: '10px'}}>{inst.appId} - {inst.name}</h4>
                                    <p><strong>Status:</strong> Approved</p>
                                </div>
                            ))}
                            {installments.filter(i => i.status === 'COMPLETED').length === 0 && <p>No completed applications.</p>}
                        </div>
                    </div>

                </div>
            </div>

            {/*  1. Inventory Management  */}
            <div id="tab-inventory" className={`tab-panel ${activeTab === 'tab-inventory' ? 'active' : ''}`}>
                <div className="panel-header" style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-end"}}>
                    <div>
                        <h2>Inventory Management</h2>
                        <p>Monitor current stock levels for all Air Conditioning units.</p>
                    </div>
                    <button className="btn" style={{"background":"var(--primary)"}} onClick={() => {}}><i className="fa-solid fa-plus"></i> Add Product</button>
                </div>

                <div className="admin-card">
                    <h3 style={{"marginBottom":"1rem","color":"var(--primary)"}}>Air Conditioning Units</h3>
                    <table style={{"marginBottom":"2rem"}}>
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Brand & Model</th>
                                <th>Category</th>
                                <th>Remaining Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body-ac">
                            {acInventory.map(item => {
                              const status = getStockStatus(item.stock);
                              return (
                                <tr key={item.id}>
                                  <td>{item.sku}</td>
                                  <td>{item.brand} {item.model}</td>
                                  <td>{item.category}</td>
                                  <td>{item.stock}</td>
                                  <td><span className={`status-badge ${status.className}`}>{status.label}</span></td>
                                  <td><button className="btn" style={{background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}>Restock</button></td>
                                </tr>
                              );
                            })}
                            {acInventory.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No AC inventory items found.</td></tr>}
                        </tbody>
                    </table>

                    <h3 style={{"marginBottom":"1rem","color":"var(--primary)"}}>Parts, Accessories & Tools</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Brand & Model</th>
                                <th>Category</th>
                                <th>Remaining Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body-parts">
                            {partsInventory.map(item => {
                              const status = getStockStatus(item.stock);
                              return (
                                <tr key={item.id}>
                                  <td>{item.sku}</td>
                                  <td>{item.brand} {item.model}</td>
                                  <td>{item.category}</td>
                                  <td>{item.stock}</td>
                                  <td><span className={`status-badge ${status.className}`}>{status.label}</span></td>
                                  <td><button className="btn" style={{background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}>Restock</button></td>
                                </tr>
                              );
                            })}
                            {partsInventory.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No parts inventory items found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  2. Orders & Installations  */}
            <div id="tab-installations" className={`tab-panel ${activeTab === 'tab-installations' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Pending Orders & Installations</h2>
                    <p>Review new purchases from customers. Accept orders to push them to the dispatch queue for
                        installation.</p>
                </div>

                <div className="admin-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Name</th>
                                <th>Item Purchased</th>
                                <th>Payment Method</th>
                                <th>Date Ordered</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="orders-table-body">
                            {orders.map(order => (
                              <tr key={order.id}>
                                <td>{order.orderNo}</td>
                                <td>{order.name}</td>
                                <td>{order.item}</td>
                                <td>{order.payment}</td>
                                <td>{order.date}</td>
                                <td><button className="btn" style={{background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}>Accept</button></td>
                              </tr>
                            ))}
                            {orders.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No pending orders.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  3. Dispatch & Schedule  */}
            <div id="tab-dispatch" className={`tab-panel ${activeTab === 'tab-dispatch' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Dispatch & Schedule</h2>
                    <p>Assign approved installations and service requests to available technicians.</p>
                </div>

                {/*  Dispatch Sub-tabs  */}
                <div className="dispatch-tabs" style={{"marginBottom":"1.5rem","display":"flex","gap":"1rem","borderBottom":"1px solid var(--border-color)","paddingBottom":"1rem"}}>
                    <button className={`btn dispatch-tab-btn ${activeDispatchTab === 'all' ? 'active' : ''}`} onClick={() => setActiveDispatchTab('all')} style={activeDispatchTab === 'all' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-list"></i> All</button>
                    <button className={`btn btn-secondary dispatch-tab-btn ${activeDispatchTab === 'New Installation' ? 'active' : ''}`} onClick={() => setActiveDispatchTab('New Installation')} style={activeDispatchTab === 'New Installation' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-screwdriver-wrench" style={{"color": activeDispatchTab === 'New Installation' ? 'white' : 'var(--primary)'}}></i> New Installation</button>
                    <button className={`btn btn-secondary dispatch-tab-btn ${activeDispatchTab === 'Deep Cleaning' ? 'active' : ''}`} onClick={() => setActiveDispatchTab('Deep Cleaning')} style={activeDispatchTab === 'Deep Cleaning' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-broom" style={{"color": activeDispatchTab === 'Deep Cleaning' ? 'white' : 'var(--accent-red)'}}></i> Deep Cleaning</button>
                    <button className={`btn btn-secondary dispatch-tab-btn ${activeDispatchTab === 'Repair' ? 'active' : ''}`} onClick={() => setActiveDispatchTab('Repair')} style={activeDispatchTab === 'Repair' ? {"background":"var(--primary)","color":"white"} : {"borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-wrench" style={{"color": activeDispatchTab === 'Repair' ? 'white' : '#e67e22'}}></i> Repair</button>
                </div>

                <div className="dispatch-list" id="dispatch-grid">
                    {dispatch
                      .filter(item => activeDispatchTab === 'all' || item.type === activeDispatchTab)
                      .map(item => (
                        <div key={item.id} className="dispatch-card admin-card" style={{"position":"relative","paddingLeft":"4.5rem"}}>
                            <div className="dispatch-icon" style={{"position":"absolute","left":"1.2rem","top":"1.5rem","width":"40px","height":"40px","borderRadius":"8px","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"1.2rem","color":"white", "background": item.type === 'New Installation' ? 'var(--primary)' : item.type === 'Deep Cleaning' ? 'var(--accent-red)' : '#e67e22'}}>
                                <i className={`fa-solid ${item.type === 'New Installation' ? 'fa-screwdriver-wrench' : item.type === 'Deep Cleaning' ? 'fa-broom' : 'fa-wrench'}`}></i>
                            </div>
                            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-start","marginBottom":"0.8rem"}}>
                                <div>
                                    <h4 style={{"color":"var(--primary)","marginBottom":"0.2rem"}}>{item.type}</h4>
                                    <p style={{"fontSize":"0.85rem","color":"var(--text-light)","fontWeight":"600"}}>{item.dispatchNo}</p>
                                </div>
                                <span className={`status-badge ${item.status === 'PENDING' ? 'status-low' : 'status-good'}`}>{item.status}</span>
                            </div>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Customer:</strong> {item.name}</p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Location:</strong> {item.location}</p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"1rem"}}><strong>Unit:</strong> {item.item}</p>
                            
                            <div style={{"display":"flex","gap":"0.8rem","alignItems":"center","borderTop":"1px solid var(--border-color)","paddingTop":"1rem","marginTop":"auto"}}>
                                {item.status === 'PENDING' ? (
                                    <>
                                        <select className="assign-select" style={{"flex":"1","padding":"0.6rem","border":"1px solid var(--border-color)","borderRadius":"6px","fontSize":"0.9rem"}}>
                                            <option value="">Assign Technician...</option>
                                            <option value="Carlos Rivera">Carlos Rivera (Available)</option>
                                            <option value="David Reyes">David Reyes (Available)</option>
                                            <option value="Michael Cruz">Michael Cruz (Busy)</option>
                                        </select>
                                        <button className="btn" style={{"padding":"0.6rem 1rem","background":"var(--primary)"}}>Assign</button>
                                    </>
                                ) : (
                                    <p style={{"fontSize":"0.9rem","color":"var(--text-dark)","fontWeight":"600"}}><i className="fa-solid fa-user-gear"></i> Assigned to: {item.technician?.firstName} {item.technician?.lastName}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {dispatch.filter(item => activeDispatchTab === 'all' || item.type === activeDispatchTab).length === 0 && (
                  <div id="empty-dispatch"
                      style={{"textAlign":"center","padding":"4rem 0","color":"var(--text-light)"}}>
                      <i className="fa-solid fa-clipboard-check" style={{"fontSize":"4rem","marginBottom":"1rem"}}></i>
                      <p style={{"fontSize":"1.1rem"}}>All caught up! No pending items to dispatch in this category.</p>
                  </div>
                )}
            </div>

            {/*  4. Master Calendar  */}
            <div id="tab-calendar" className={`tab-panel ${activeTab === 'tab-calendar' ? 'active' : ''}`}>
                <div className="calendar-header-top">
                    <div>
                        <h2 style={{"color":"var(--primary)","fontSize":"1.8rem","marginBottom":"0.5rem"}}>Master Calendar
                        </h2>
                        <p style={{"color":"var(--text-light)"}}>View the schedule of all technicians.</p>
                    </div>
                    <div className="calendar-controls">
                        <div className="month-selector">
                            <button id="cal-prev-month" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><i className="fa-solid fa-chevron-left"></i></button>
                            <span id="cal-month-title">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button id="cal-next-month" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><i className="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                {/*  Legend  */}
                <div style={{"display":"flex","gap":"1.5rem","marginBottom":"1.5rem"}}>
                    <span style={{"fontSize":"0.85rem"}}><span
                            style={{"display":"inline-block","width":"12px","height":"12px","background":"#E6F0FA","borderLeft":"3px solid var(--primary)","marginRight":"5px"}}></span>
                        Carlos Rivera</span>
                    <span style={{"fontSize":"0.85rem"}}><span
                            style={{"display":"inline-block","width":"12px","height":"12px","background":"#FFEBEB","borderLeft":"3px solid var(--accent-red)","marginRight":"5px"}}></span>
                        David Reyes</span>
                    <span style={{"fontSize":"0.85rem"}}><span
                            style={{"display":"inline-block","width":"12px","height":"12px","background":"#d4edda","borderLeft":"3px solid #28a745","marginRight":"5px"}}></span>
                        Michael Cruz</span>
                </div>

                <div className="full-calendar-grid">
                    <div className="calendar-days">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>
                    <div className="calendar-dates" id="dynamic-calendar-dates">
                        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="calendar-cell empty"></div>
                        ))}
                        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const dateNum = i + 1;
                            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum);
                            const dateString = cellDate.toISOString().split('T')[0];
                            const events = maintenance.filter(m => {
                                const mDate = new Date(m.scheduledDate);
                                return mDate.toISOString().split('T')[0] === dateString;
                            });

                            return (
                                <div key={dateNum} className="calendar-cell">
                                    <div className="date-number">{dateNum}</div>
                                    {events.map(event => (
                                        <div key={event.id} className="event-chip" style={{"background":"#E6F0FA","borderLeft":"3px solid var(--primary)", "padding": "2px 4px", "fontSize": "0.75rem", "marginBottom": "2px", "borderRadius": "2px"}}>
                                            <strong>{event.technicianName?.split(' ')[0] || 'Tech'}</strong>: {event.serviceType}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/*  Calendar Event Details Modal  */}
            <div className="modal-overlay" id="event-details-modal">
                <div className="modal-content" style={{"maxWidth":"450px"}}>
                    <div className="modal-header">
                        <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}>Task Details</h2>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"background":"#f8fafc","border":"1px solid var(--border-color)","borderRadius":"8px","padding":"1.5rem","marginBottom":"1rem"}}>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Technician:</strong> <span id="event-modal-tech"></span></p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Task Type:</strong> <span id="event-modal-type"></span></p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Schedule:</strong> <span id="event-modal-datetime"></span></p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>Location:</strong> <span id="event-modal-location"></span></p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0.5rem"}}><strong>AC Unit:</strong> <span id="event-modal-item"></span></p>
                            <p style={{"fontSize":"0.9rem","marginBottom":"0"}}><strong>Customer ID:</strong> <span id="event-modal-cus"></span></p>
                        </div>
                        <button className="btn" style={{"width":"100%","background":"var(--primary)"}} onClick={() => {}}>Close</button>
                    </div>
                </div>
            </div>

            {/*  5. Maintenance Schedule  */}
            <div id="tab-maintenance" className={`tab-panel ${activeTab === 'tab-maintenance' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Maintenance Schedule</h2>
                    <p>Track upcoming AC maintenance appointments for the next days and weeks.</p>
                </div>

                {/*  Maintenance Filter  */}
                <div style={{"display":"flex","gap":"1rem","marginBottom":"1.5rem","flexWrap":"wrap"}}>
                    <button className="btn maint-filter-btn active" data-mfilter="all" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem"}}><i className="fa-solid fa-list"></i> All Upcoming</button>
                    <button className="btn btn-secondary maint-filter-btn" data-mfilter="today" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem","borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-calendar-day"></i> Today</button>
                    <button className="btn btn-secondary maint-filter-btn" data-mfilter="week" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem","borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-calendar-week"></i> This Week</button>
                    <button className="btn btn-secondary maint-filter-btn" data-mfilter="month" style={{"padding":"0.6rem 1.2rem","fontSize":"0.85rem","borderColor":"var(--border-color)","color":"var(--text-dark)"}}><i className="fa-solid fa-calendar"></i> This Month</button>
                </div>

                {/*  Stats Cards  */}
                <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(180px, 1fr))","gap":"1.2rem","marginBottom":"2rem"}}>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid var(--primary)"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"var(--primary)"}} id="maint-total-count">8</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>Total Upcoming</p>
                    </div>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid #f59e0b"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"#f59e0b"}} id="maint-today-count">2</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>Today</p>
                    </div>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid #10b981"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"#10b981"}} id="maint-week-count">5</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>This Week</p>
                    </div>
                    <div className="admin-card" style={{"textAlign":"center","marginBottom":"0","padding":"1.2rem","borderLeft":"4px solid var(--accent-red)"}}>
                        <p style={{"fontSize":"2rem","fontWeight":"800","color":"var(--accent-red)"}} id="maint-overdue-count">1</p>
                        <p style={{"fontSize":"0.82rem","color":"var(--text-light)","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.5px"}}>Overdue</p>
                    </div>
                </div>

                {/*  Maintenance List  */}
                <div className="admin-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Schedule</th>
                                <th>Customer</th>
                                <th>AC Unit</th>
                                <th>Service Type</th>
                                <th>Technician</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="maint-table-body">
                            {maintenance.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div style={{"fontWeight":"600","color":"var(--text-dark)"}}>{new Date(m.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div style={{"fontSize":"0.85rem","color":"var(--text-light)"}}>{m.scheduleNo}</div>
                                    </td>
                                    <td>
                                        <div style={{"fontWeight":"500"}}>{m.name}</div>
                                        <div style={{"fontSize":"0.85rem","color":"var(--text-light)"}}>{m.address}</div>
                                    </td>
                                    <td>{m.item}</td>
                                    <td>
                                        <span className={`status-badge ${m.serviceType === 'Deep Cleaning' ? 'status-low' : 'status-good'}`} style={{"background": m.serviceType === 'Deep Cleaning' ? '#FFEBEB' : '#FFF3CD', "color": m.serviceType === 'Deep Cleaning' ? 'var(--accent-red)' : '#856404'}}>{m.serviceType}</span>
                                    </td>
                                    <td>{m.technicianName}</td>
                                    <td>
                                        {m.status === 'SCHEDULED' ? <span className="status-badge status-good">Upcoming</span> : <span className="status-badge status-critical">Overdue</span>}
                                    </td>
                                </tr>
                            ))}
                            {maintenance.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-light)', padding: '2rem'}}>No upcoming maintenance.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  Maintenance Details Modal  */}
            <div className="modal-overlay" id="maint-details-modal">
                <div className="modal-content" style={{"maxWidth":"600px"}}>
                    <div className="modal-header">
                        <div>
                            <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="maint-modal-title">Customer Details</h2>
                            <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="maint-modal-subtitle">MNT-000 • CUS-000</p>
                        </div>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1.5rem","marginBottom":"1.5rem"}}>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-user" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Customer Info</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>Name:</strong> <span id="maint-modal-name"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Phone:</strong> <span id="maint-modal-phone"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Address:</strong> <span id="maint-modal-address"></span></p>
                            </div>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-screwdriver-wrench" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Service Info</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>AC Unit:</strong> <span id="maint-modal-item"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Service:</strong> <span id="maint-modal-service"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Scheduled:</strong> <span id="maint-modal-date"></span></p>
                            </div>
                        </div>

                        <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","border":"1px solid var(--border-color)","borderRadius":"8px","padding":"1rem","marginBottom":"1.5rem"}}>
                            <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-clipboard" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Notes</h4>
                            <p style={{"fontSize":"0.9rem","color":"var(--text-light)"}} id="maint-modal-notes"></p>
                        </div>

                        <div id="maint-deploy-section" style={{"background":"var(--bg-card, #0f1f38)","padding":"1.5rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                            {/*  Dynamically rendered by JS  */}
                        </div>
                    </div>
                </div>
            </div>

            {/*  Installment Details Modal  */}
            <div className="modal-overlay" id="details-modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <div>
                            <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="modal-title">Application Details</h2>
                            <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="modal-subtitle">APP-0000</p>
                        </div>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1.5rem","marginBottom":"2rem"}}>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}>Applicant Info</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>Name:</strong> <span id="modal-name"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Item:</strong> <span id="modal-item"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Term:</strong> <span id="modal-term"></span> Months</p>
                            </div>
                            <div>
                                <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}>Employment & Income</h4>
                                <p style={{"fontSize":"0.9rem"}}><strong>Employer:</strong> <span id="modal-employer"></span></p>
                                <p style={{"fontSize":"0.9rem"}}><strong>Monthly Income:</strong> ₱<span id="modal-income"></span></p>
                            </div>
                        </div>
                        
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"1rem"}}>Submitted Documents</h4>
                        <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"1rem"}}>
                            <div>
                                <p style={{"fontSize":"0.85rem","fontWeight":"600","marginBottom":"0.5rem"}}>Valid ID (<span id="modal-idtype"></span>)</p>
                                <div className="doc-preview">
                                    <i className="fa-regular fa-id-card" style={{"fontSize":"2rem","marginBottom":"0.5rem"}}></i><br />
                                    Preview
                                </div>
                            </div>
                            <div>
                                <p style={{"fontSize":"0.85rem","fontWeight":"600","marginBottom":"0.5rem"}}>Proof of Income</p>
                                <div className="doc-preview">
                                    <i className="fa-solid fa-file-invoice-dollar" style={{"fontSize":"2rem","marginBottom":"0.5rem"}}></i><br />
                                    Preview
                                </div>
                            </div>
                        </div>
                        
                        <h4 style={{"color":"var(--text-dark)","marginTop":"1.5rem","marginBottom":"0.5rem"}}>Installation Location Pinpoint</h4>
                        <div style={{height: "150px", marginBottom: "0.5rem", zIndex: 10}}>
                            <GoogleMap height="150px" />
                        </div>
                        <span id="details-coords-text" style={{"fontSize":"0.85rem","color":"var(--text-light)","fontWeight":"500"}}>Coordinates: Not Available</span>
                    </div>
                </div>
            </div>

            {/*  POS Installment Customer Info Modal  */}
            <div className="modal-overlay" id="pos-customer-modal">
                <div className="modal-content" style={{"maxWidth":"500px"}}>
                    <div className="modal-header">
                        <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}>Customer Information</h2>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"flex","flexDirection":"column","gap":"1rem"}}>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Full Name</label>
                                <input type="text" id="pos-cust-name" placeholder="e.g. John Doe" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Monthly Income (PHP)</label>
                                <input type="number" id="pos-cust-income" placeholder="e.g. 35000" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Employer / Source of Income</label>
                                <input type="text" id="pos-cust-employer" placeholder="e.g. Acme Corp" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Valid ID Type</label>
                                <select id="pos-cust-idtype" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}}>
                                    <option value="UMID">UMID</option>
                                    <option value="Driver License">Driver's License</option>
                                    <option value="Passport">Passport</option>
                                    <option value="SSS ID">SSS ID</option>
                                    <option value="PRC ID">PRC ID</option>
                                </select>
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Installment Term</label>
                                <select id="pos-cust-term" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}}>
                                    <option value="6">6 Months</option>
                                    <option value="12">12 Months</option>
                                </select>
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Installation Location Pinpoint</label>
                                <div style={{"display":"flex","gap":"8px","marginBottom":"0.5rem"}}>
                                    <input type="text" id="pos-map-search" placeholder="Search address or city..." style={{"flex":"1","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                                    <button className="btn" id="pos-map-search-btn" style={{"padding":"0.8rem 1.2rem","background":"var(--primary)"}}><i className="fa-solid fa-magnifying-glass"></i></button>
                                </div>
                                <div style={{height: "200px", marginBottom: "0.3rem", zIndex: 10}}>
                                    <GoogleMap height="200px" />
                                </div>
                                <span id="pos-selected-coords" style={{"fontSize":"0.8rem","color":"var(--text-light)","fontWeight":"500"}}>Click on the map to pinpoint. Selected: TBD</span>
                                <input type="hidden" id="pos-cust-coords" value="" />
                            </div>
                            <button className="btn" id="confirm-pos-installment-btn" style={{"width":"100%","marginTop":"1rem","background":"var(--primary)"}}>Confirm & Apply &rarr;</button>
                        </div>
                    </div>
                </div>
            </div>

            {/*  Add Product Modal  */}
            <div className="modal-overlay" id="add-product-modal">
                <div className="modal-content" style={{"maxWidth":"500px"}}>
                    <div className="modal-header">
                        <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}}>Add New Product</h2>
                        <button className="close-modal" onClick={() => {}}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div style={{"display":"flex","flexDirection":"column","gap":"1rem"}}>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Item Code</label>
                                <input type="text" id="new-prod-code" placeholder="e.g. AC-SPL-15" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Brand</label>
                                <input type="text" id="new-prod-brand" placeholder="e.g. Panasonic" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Model</label>
                                <input type="text" id="new-prod-model" placeholder="e.g. Premium Inverter (1.5 HP)" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Category</label>
                                <select id="new-prod-category" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}}>
                                    <option value="Split Type">Split Type AC</option>
                                    <option value="Window Type">Window Type AC</option>
                                    <option value="Floor Standing">Floor Standing AC</option>
                                    <option value="Pre-Owned">Pre-Owned AC</option>
                                    <option value="Parts & Accessories">Parts & Accessories</option>
                                    <option value="Tools">Tools</option>
                                </select>
                            </div>
                            <div>
                                <label style={{"fontSize":"0.85rem","fontWeight":"600","display":"block","marginBottom":"0.3rem"}}>Initial Stock</label>
                                <input type="number" id="new-prod-stock" placeholder="0" min="0" style={{"width":"100%","padding":"0.8rem","borderRadius":"6px","border":"1px solid var(--border-color)","fontFamily":"inherit"}} />
                            </div>
                            <button className="btn" id="save-product-btn" style={{"width":"100%","marginTop":"1rem","background":"var(--primary)"}}>Save Product &rarr;</button>
                        </div>
                    </div>
                </div>
            </div>

            {/*  Tech Requests  */}
            <div id="tab-tech-requests" className={`tab-panel ${activeTab === 'tab-tech-requests' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Tech Requests</h2>
                    <p>Manage and fulfill supplies or tools requested by technicians.</p>
                </div>
                
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Req ID</th>
                                <th>Technician</th>
                                <th>Item Needed</th>
                                <th>Qty</th>
                                <th>Reason</th>
                                <th>Date/Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tech-requests-table">
                            {/*  Populated via JS  */}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  Customer Directory  */}
            <div id="tab-customers" className={`tab-panel ${activeTab === 'tab-customers' ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Customer Directory</h2>
                    <p>View all customers, their purchased ACs, and installment applications.</p>
                </div>
                
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name / ID</th>
                                <th>Contact / Location</th>
                                <th>Total ACs</th>
                                <th>Active Installment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="customers-table">
                            {/*  Populated via JS  */}
                        </tbody>
                    </table>
                </div>
            </div>

        </main>
    </div>

    {/*  Customer Info Modal  */}
    <div className="modal-overlay" id="customer-info-modal">
        <div className="modal-content" style={{"maxWidth":"650px"}}>
            <div className="modal-header">
                <div>
                    <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="cust-modal-name">Customer Name</h2>
                    <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="cust-modal-id">CUS-0000</p>
                </div>
                <button className="close-modal" onClick={() => {}}>&times;</button>
            </div>
            <div className="modal-body">
                <div style={{"display":"grid","gridTemplateColumns":"1fr","gap":"1.5rem","marginBottom":"2rem"}}>
                    <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-address-card" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Profile</h4>
                        <p style={{"fontSize":"0.9rem"}}><strong>Location:</strong> <span id="cust-modal-location">-</span></p>
                        <p style={{"fontSize":"0.9rem"}}><strong>Employer:</strong> <span id="cust-modal-employer">-</span></p>
                        <p style={{"fontSize":"0.9rem"}}><strong>Income:</strong> <span id="cust-modal-income">-</span></p>
                    </div>
                    
                    <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-fan" style={{"color":"var(--primary)","marginRight":"6px"}}></i> AC Units & History</h4>
                        <ul id="cust-modal-acs" style={{"fontSize":"0.9rem","color":"var(--text-light)","paddingLeft":"1.2rem","marginTop":"10px"}}>
                            {/*  Populated via JS  */}
                        </ul>
                    </div>

                    <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)"}}>
                        <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-file-invoice-dollar" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Installment Applications</h4>
                        <div id="cust-modal-installments" style={{"fontSize":"0.9rem","color":"var(--text-light)","marginTop":"10px"}}>
                            {/*  Populated via JS  */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {/*  Order Details Modal  */}
    <div className="modal-overlay" id="order-details-modal">
        <div className="modal-content" style={{"maxWidth":"600px"}}>
            <div className="modal-header">
                <div>
                    <h2 style={{"fontSize":"1.5rem","color":"var(--primary)"}} id="order-modal-title">Order Details</h2>
                    <p style={{"fontSize":"0.85rem","color":"var(--text-light)"}} id="order-modal-id">ORD-0000</p>
                </div>
                <button className="close-modal" onClick={() => {}}>&times;</button>
            </div>
            <div className="modal-body">
                <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)","marginBottom":"1.5rem"}}>
                    <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-user" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Customer Info</h4>
                    <p style={{"fontSize":"0.9rem"}}><strong>Name:</strong> <span id="order-modal-name">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Customer ID:</strong> <span id="order-modal-cusid">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Location:</strong> <span id="order-modal-location">-</span></p>
                </div>
                
                <div style={{"background":"var(--bg-input, rgba(255,255,255,0.05))","padding":"1rem","borderRadius":"8px","border":"1px solid var(--border-color)","marginBottom":"1.5rem"}}>
                    <h4 style={{"color":"var(--text-dark)","marginBottom":"0.5rem"}}><i className="fa-solid fa-cart-shopping" style={{"color":"var(--primary)","marginRight":"6px"}}></i> Purchase Details</h4>
                    <p style={{"fontSize":"0.9rem"}}><strong>Date:</strong> <span id="order-modal-date">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Payment Method:</strong> <span id="order-modal-payment">-</span></p>
                    <p style={{"fontSize":"0.9rem"}}><strong>Items:</strong></p>
                    <div id="order-modal-items" style={{"fontSize":"0.9rem","color":"var(--text-dark)","padding":"10px","background":"rgba(0,0,0,0.02)","borderRadius":"4px","marginTop":"5px"}}>
                        -
                    </div>
                </div>
                
                <div style={{"textAlign":"right"}}>
                    <button className="btn" style={{"background":"var(--primary)"}} id="order-modal-accept-btn">Accept & Queue &rarr;</button>
                </div>
            </div>
        </div>
    </div>

    {/*  UI Navigation Script  */}
    

    {/*  State Management & Rendering  */}
    

</>
  );
}