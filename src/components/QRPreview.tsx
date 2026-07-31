import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling, { 
  DotType, 
  CornerSquareType, 
  CornerDotType,
  DrawType
} from 'qr-code-styling';
import { Download, Printer, Eye, Sparkles } from 'lucide-react';

export interface QRStyleOptions {
  data: string;
  dotsColorType: 'single' | 'gradient';
  dotsColor: string;
  dotsGradientStart: string;
  dotsGradientEnd: string;
  dotsType: DotType;
  bgColor: string;
  eyeFrameColor: string;
  eyeBallColor: string;
  eyeFrameType: CornerSquareType;
  eyeBallType: CornerDotType;
  logo: string;
  logoMargin: number;
  logoSize: number;
}

interface QRPreviewProps {
  options: QRStyleOptions;
  campaignName: string;
  orgName: string;
}

export const QRPreview: React.FC<QRPreviewProps> = ({ options, campaignName, orgName }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const flyerQrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);
  const flyerQrCodeInstance = useRef<QRCodeStyling | null>(null);
  
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  // Helper to compile QR options into qr-code-styling configuration
  const compileQrConfig = (size: number): any => {
    const isGradient = options.dotsColorType === 'gradient';
    
    return {
      width: size,
      height: size,
      type: 'svg' as DrawType,
      data: options.data || 'https://dash.talktokrishna.com/qr/default',
      image: options.logo || undefined,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H' // High error correction to support logo overlay
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: options.logoSize / 100, // scaled 0.2 to 0.4
        margin: options.logoMargin,
        crossOrigin: 'anonymous',
      },
      dotsOptions: {
        type: options.dotsType,
        color: isGradient ? undefined : options.dotsColor,
        gradient: isGradient ? {
          type: 'linear',
          rotation: 45,
          colorStops: [
            { offset: 0, color: options.dotsGradientStart },
            { offset: 1, color: options.dotsGradientEnd }
          ]
        } : undefined
      },
      backgroundOptions: {
        color: options.bgColor,
      },
      cornersSquareOptions: {
        type: options.eyeFrameType,
        color: options.eyeFrameColor,
      },
      cornersDotOptions: {
        type: options.eyeBallType,
        color: options.eyeBallColor,
      }
    };
  };

  // Instantiate QR code on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const config = compileQrConfig(260);
    const qrCode = new QRCodeStyling(config);
    qrCodeInstance.current = qrCode;

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
    }
  }, []);

  // Update QR Code when options change
  useEffect(() => {
    if (qrCodeInstance.current) {
      const config = compileQrConfig(260);
      qrCodeInstance.current.update(config);
    }
  }, [options]);

  // Instantiate Flyer QR Code when Flyer Modal opens
  useEffect(() => {
    if (showFlyerModal && typeof window !== 'undefined') {
      // Larger size for flyer (300px)
      const config = compileQrConfig(300);
      const flyerQrCode = new QRCodeStyling(config);
      flyerQrCodeInstance.current = flyerQrCode;

      // Small delay to ensure div is rendered in modal
      setTimeout(() => {
        if (flyerQrRef.current) {
          flyerQrRef.current.innerHTML = '';
          flyerQrCode.append(flyerQrRef.current);
        }
      }, 100);
    }
  }, [showFlyerModal, options]);

  const handleDownload = (format: 'png' | 'svg') => {
    if (qrCodeInstance.current) {
      const fileName = `${orgName.replace(/\s+/g, '-').toLowerCase()}-${campaignName.replace(/\s+/g, '-').toLowerCase()}-qr`;
      qrCodeInstance.current.download({
        name: fileName,
        extension: format
      });
    }
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  return (
    <div style={styles.previewContainer}>
      <h3 style={styles.sectionTitle}>QR Code Live Preview</h3>
      
      {/* QR Canvas Wrap */}
      <div style={styles.qrCard} className="glass-card">
        <div style={styles.canvasContainer}>
          <div ref={qrRef} style={styles.qrCodeWrapper} />
          {/* Subtle glowing effect behind the QR */}
          <div style={{
            ...styles.glowOverlay,
            background: `radial-gradient(circle, ${options.dotsColorType === 'gradient' ? options.dotsGradientStart : options.dotsColor}33 0%, transparent 70%)`
          }} />
        </div>
        
        <div style={styles.infoWrapper}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Campaign:</span>
            <span style={styles.infoValue}>{campaignName || 'Untitled Campaign'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>URL:</span>
            <span style={styles.infoValue} title={options.data}>{options.data || 'Dynamic Link'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionGrid}>
          <button onClick={() => handleDownload('png')} className="btn-primary" style={styles.actionBtn}>
            <Download size={16} />
            <span>Download PNG</span>
          </button>
          <button onClick={() => handleDownload('svg')} className="btn-secondary" style={styles.actionBtn}>
            <Download size={16} />
            <span>Download SVG</span>
          </button>
          <button onClick={() => setShowFlyerModal(true)} className="btn-secondary" style={{ ...styles.actionBtn, gridColumn: 'span 2', borderColor: '#ffd700', color: '#ffd700' }}>
            <Eye size={16} />
            <span>Generate Promo Flyer</span>
          </button>
        </div>
      </div>

      {/* Printable Flyer Modal */}
      {showFlyerModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="print-area">
            {/* Modal Controls (hidden during print) */}
            <div style={styles.modalControls} className="no-print">
              <button onClick={() => setShowFlyerModal(false)} className="btn-secondary">
                Close Preview
              </button>
              <button onClick={handlePrintFlyer} className="btn-primary">
                <Printer size={16} />
                <span>Print Poster (A4)</span>
              </button>
            </div>

            {/* Premium Flyer Layout */}
            <div style={styles.flyerPoster}>
              {/* Divine border design */}
              <div style={styles.flyerBorder}>
                {/* Header Peacock feather decoration */}
                <div style={styles.flyerHeader}>
                  <div style={styles.flyerLogoWrapper}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#ffd700' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a18.666 18.666 0 01-5.185-10.089m13.185 10.089A18.666 18.666 0 0115 10.911M12 3c1.38 0 2.5 1.79 2.5 4v3.5c0 2.21-1.12 4-2.5 4S9.5 12.71 9.5 10.5V7c0-2.21 1.12-4 2.5-4z" />
                    </svg>
                  </div>
                  <h2 style={styles.flyerBrandName}>Talk To Krishna</h2>
                  <p style={styles.flyerTagline}>Your Personal Spiritual Guide, in Your Language.</p>
                </div>

                {/* QR Display Area */}
                <div style={styles.flyerQrContainer}>
                  <div ref={flyerQrRef} style={styles.flyerQrCodeWrapper} />
                  <div style={styles.scanInst}>
                    <Sparkles size={14} style={{ color: '#ffd700' }} />
                    <span>Scan to Start Your Conversation</span>
                  </div>
                </div>

                {/* Promotional copy */}
                <div style={styles.flyerDetails}>
                  <div style={styles.detailItem}>
                    <h3>🪶 Personalized Wisdom</h3>
                    <p>Receive direct answers from sacred scriptures tailored to your life situation.</p>
                  </div>
                  <div style={styles.detailItem}>
                    <h3>🗣️ Multiple Languages</h3>
                    <p>Talk or type in English, Hindi, Telugu, Tamil, or Bengali.</p>
                  </div>
                </div>

                {/* Footer Attribution */}
                <div style={styles.flyerFooter}>
                  <span>Presented by {orgName}</span>
                  <span style={styles.poweredBy}>Powered by Talk to Krishna Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#ffffff',
  },
  qrCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    background: 'var(--bg-dark-card)',
  },
  canvasContainer: {
    position: 'relative',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeWrapper: {
    zIndex: 2,
  },
  glowOverlay: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    width: '140%',
    height: '140%',
    filter: 'blur(30px)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  infoWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  infoLabel: {
    color: 'var(--text-secondary)',
  },
  infoValue: {
    color: '#ffffff',
    fontWeight: '600',
    maxWidth: '180px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actionGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  actionBtn: {
    justifyContent: 'center',
    fontSize: '0.85rem',
    padding: '10px 16px',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflowY: 'auto',
  },
  modalContent: {
    width: '100%',
    maxWidth: '650px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    margin: '40px auto',
  },
  modalControls: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#0c0d24',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },

  // Poster elements
  flyerPoster: {
    backgroundColor: '#070817',
    color: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
    fontFamily: 'var(--font-body)',
  },
  flyerBorder: {
    border: '3px double #ffd700',
    borderRadius: '12px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  flyerHeader: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  flyerLogoWrapper: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    border: '2px solid #ffd700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  flyerBrandName: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#ffd700',
    letterSpacing: '-0.02em',
  },
  flyerTagline: {
    fontSize: '1rem',
    color: '#00f2fe',
    fontWeight: '500',
  },
  flyerQrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
  },
  flyerQrCodeWrapper: {
    display: 'block',
  },
  scanInst: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#070817',
    fontWeight: '700',
    fontSize: '0.9rem',
  },
  flyerDetails: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    borderTop: '1px solid rgba(255,215,0,0.2)',
    paddingTop: '20px',
  },
  detailItem: {
    flex: 1,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    color: '#ffffff',
  },
  flyerFooter: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    marginTop: '10px',
  },
  poweredBy: {
    color: '#ffd700',
    fontWeight: '600',
  }
};

// Insert custom CSS for print mode directly
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      .print-area, .print-area * {
        visibility: visible;
      }
      .print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white !important;
        color: black !important;
      }
      .no-print {
        display: none !important;
      }
      .print-area > div {
        box-shadow: none !important;
        background: transparent !important;
        color: black !important;
      }
      .print-area * {
        color: black !important;
        border-color: black !important;
      }
      .flyerBorder {
        border-color: black !important;
      }
    }
  `;
  document.head.appendChild(style);
}
