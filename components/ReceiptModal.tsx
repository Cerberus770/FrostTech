'use client';

import React, { useRef } from 'react';

export interface ReceiptItem {
  name: string;
  category?: string; // 'AC Unit' | 'Spare Part' | 'Repair / Service'
  quantity: number;
  price: number;
  horsepower?: string;
  serialNo?: string;
}

export interface ReceiptData {
  receiptNo: string;
  orderNo?: string;
  date: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  location?: string;
  paymentMethod: string;
  status: string;
  items: ReceiptItem[];
  subtotal: number;
  deliveryFee?: number;
  installationFee?: number;
  discount?: number;
  downpayment?: number;
  totalAmount: number;
  notes?: string;
  technicianName?: string;
  serviceType?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export default function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const vatAmount = receipt.totalAmount * (12 / 112); // Standard 12% PH VAT inclusive
  const netOfVat = receipt.totalAmount - vatAmount;

  return (
    <div
      className="receipt-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 37, 91, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #frostech-receipt-printable,
          #frostech-receipt-printable * {
            visibility: visible !important;
          }
          #frostech-receipt-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .receipt-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(6, 37, 91, 0.35)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Top Action Header Bar */}
        <div
          className="receipt-no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #052e80 0%, #0284c7 100%)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Official Sales & Service Receipt</h3>
              <span style={{ fontSize: '0.75rem', color: '#e0f2fe' }}>FrostTech Cooling Systems & Engineering</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                color: '#052e80',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <i className="fa-solid fa-print"></i> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Receipt Body */}
        <div
          id="frostech-receipt-printable"
          ref={printAreaRef}
          style={{
            padding: '2rem',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Header Brand Section */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #052e80',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    color: '#052e80',
                  }}
                >
                  FROST<span style={{ color: '#0284c7' }}>TECH</span>
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: '#e0f2fe',
                    color: '#0284c7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Official Receipt
                </span>
              </div>
              <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#475569' }}>
                Airconditioning Sales, Installation & Certified Maintenance Services
              </p>
              <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#64748b' }}>
                Ortigas Ave / Shaw Blvd, Pasig City & San Juan, Metro Manila
              </p>
              <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#64748b' }}>
                Hotline: (02) 8888-FROST • Mobile: 0917-888-FROST • support@frostech.ph
              </p>
              <p style={{ margin: '2px 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                TIN: 248-910-442-000 • DTI/SEC Reg. No: 2026-FROSTTECH-PH
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#f8fafc',
                  border: '1.5px dashed #0284c7',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Receipt Reference
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#052e80', letterSpacing: '0.5px' }}>
                  {receipt.receiptNo}
                </div>
                {receipt.orderNo && receipt.orderNo !== receipt.receiptNo && (
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                    Order Ref: {receipt.orderNo}
                  </div>
                )}
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                  Date: <strong>{receipt.date}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Transaction Meta Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Billed To (Customer)
              </span>
              <p style={{ margin: '3px 0 0', fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                {receipt.customerName || 'Valued Customer'}
              </p>
              {receipt.customerPhone && (
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#475569' }}>
                  <i className="fa-solid fa-phone" style={{ marginRight: '5px', fontSize: '0.72rem', color: '#0284c7' }}></i>
                  {receipt.customerPhone}
                </p>
              )}
              {receipt.customerEmail && (
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#475569' }}>
                  <i className="fa-solid fa-envelope" style={{ marginRight: '5px', fontSize: '0.72rem', color: '#0284c7' }}></i>
                  {receipt.customerEmail}
                </p>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Delivery / Installation Location
              </span>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.35 }}>
                {receipt.location?.split('| COORDS:')[0].trim() || 'Store Pick-up / Standard Metro Manila Delivery'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Method & Status
              </span>
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    background: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  <i className="fa-solid fa-credit-card" style={{ marginRight: '4px' }}></i>
                  {receipt.paymentMethod}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    background:
                      receipt.status === 'Completed' || receipt.status === 'Paid'
                        ? '#dcfce7'
                        : '#fef3c7',
                    color:
                      receipt.status === 'Completed' || receipt.status === 'Paid'
                        ? '#15803d'
                        : '#b45309',
                  }}
                >
                  <i
                    className={`fa-solid ${
                      receipt.status === 'Completed' || receipt.status === 'Paid'
                        ? 'fa-circle-check'
                        : 'fa-clock'
                    }`}
                    style={{ marginRight: '4px' }}
                  ></i>
                  {receipt.status === 'Paid' ? 'Paid in Full' : receipt.status}
                </span>
              </div>
              {receipt.technicianName && (
                <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#052e80', fontWeight: 600 }}>
                  <i className="fa-solid fa-user-shield" style={{ marginRight: '4px' }}></i>
                  Tech: {receipt.technicianName}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '0.75rem 0.9rem', color: '#0f172a', fontWeight: 800 }}>Item Description</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: '#0f172a', fontWeight: 800 }}>Category</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: '#0f172a', fontWeight: 800, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: '#0f172a', fontWeight: 800, textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: '#0f172a', fontWeight: 800, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.8rem 0.9rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                      {item.horsepower && (
                        <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                          Specs: {item.horsepower}
                        </span>
                      )}
                      {item.serialNo && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>
                          (SN: {item.serialNo})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 0.9rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          background:
                            item.category === 'AC Unit'
                              ? '#e0f2fe'
                              : item.category === 'Spare Part'
                              ? '#fef3c7'
                              : '#f0fdf4',
                          color:
                            item.category === 'AC Unit'
                              ? '#0369a1'
                              : item.category === 'Spare Part'
                              ? '#b45309'
                              : '#15803d',
                        }}
                      >
                        {item.category || 'Product / Unit'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.9rem', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ padding: '0.8rem 0.9rem', textAlign: 'right', color: '#475569' }}>
                      ₱{Number(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.8rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals & Summary Breakdown */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.5rem',
              borderTop: '2px solid #e2e8f0',
              paddingTop: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Left: Notes, Warranty & Authorized Signature */}
            <div style={{ flex: '1 1 300px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.78rem',
                  color: '#475569',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontWeight: 700, color: '#052e80', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="fa-solid fa-shield-halved"></i> FrostCare Warranty & Terms
                </div>
                <p style={{ margin: 0, lineHeight: 1.4 }}>
                  • 1 Year Free Preventive Service & Standard Labor Warranty on installations.<br />
                  • 5 Years Manufacturer Compressor Warranty on select inverter air conditioning units.<br />
                  • Official electronic receipt acknowledged in accordance with BIR Revenue Regulations.
                </p>
              </div>

              {/* Barcode & Signature Graphic */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div>
                  <div
                    style={{
                      height: '32px',
                      width: '140px',
                      background: 'repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px)',
                      borderRadius: '2px',
                    }}
                  ></div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '1px' }}>
                    *{receipt.receiptNo}*
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      borderBottom: '1px solid #94a3b8',
                      width: '130px',
                      paddingBottom: '2px',
                      fontFamily: "'Brush Script MT', cursive, sans-serif",
                      fontSize: '1.1rem',
                      color: '#052e80',
                    }}
                  >
                    FrostTech PH
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Authorized Signature</span>
                </div>
              </div>
            </div>

            {/* Right: Calculations Breakdown */}
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.84rem', color: '#475569' }}>
                <span>Subtotal (Net of VAT)</span>
                <span>₱{netOfVat.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.84rem', color: '#475569' }}>
                <span>Value Added Tax (12% VAT)</span>
                <span>₱{vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.84rem', color: '#16a34a', fontWeight: 600 }}>
                <span>Delivery & Standard Installation</span>
                <span>FREE (₱0.00)</span>
              </div>
              {receipt.discount ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.84rem', color: '#dc2626' }}>
                  <span>Voucher / Promo Discount</span>
                  <span>-₱{receipt.discount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '2px solid #052e80',
                  marginTop: '0.6rem',
                  paddingTop: '0.6rem',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#052e80' }}>Total Amount</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#052e80' }}>
                  ₱{receipt.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {receipt.downpayment ? (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    marginTop: '0.6rem',
                    fontSize: '0.78rem',
                    color: '#15803d',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Downpayment Paid</span>
                    <span>₱{receipt.downpayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: '#475569' }}>
                    <span>Remaining Balance</span>
                    <span>₱{(receipt.totalAmount - receipt.downpayment).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Official Seal Footer */}
          <div
            style={{
              textAlign: 'center',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '1rem',
              fontSize: '0.74rem',
              color: '#94a3b8',
            }}
          >
            Thank you for choosing <strong>FrostTech Airconditioning Services</strong>. This document serves as your official electronic sales & service receipt.
          </div>
        </div>

        {/* Modal Bottom Close Bar (Screen only) */}
        <div
          className="receipt-no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.9rem 1.5rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: '5px', color: '#0284c7' }}></i>
            Click <strong>Print / Save PDF</strong> to generate a hard copy or save as digital PDF.
          </span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-print"></i> Print Receipt
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
