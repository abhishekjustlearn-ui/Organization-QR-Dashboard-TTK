import React from 'react';
import { QRStyleOptions } from './QRPreview';
import { logoPresets } from '../assets/logoPresets';
import { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';

interface QRStylingPanelProps {
  options: QRStyleOptions;
  setOptions: React.Dispatch<React.SetStateAction<QRStyleOptions>>;
}

export const QRStylingPanel: React.FC<QRStylingPanelProps> = ({ options, setOptions }) => {
  const updateOption = <K extends keyof QRStyleOptions>(key: K, value: QRStyleOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const dotPatterns: { value: DotType; label: string }[] = [
    { value: 'rounded', label: 'Rounded Dots' },
    { value: 'dots', label: 'Fine Dots' },
    { value: 'classy', label: 'Classy Lines' },
    { value: 'classy-rounded', label: 'Classy Curved' },
    { value: 'square', label: 'Classic Square' },
    { value: 'extra-rounded', label: 'Liquid Bubbles' },
  ];

  const eyeFrames: { value: CornerSquareType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Circle' },
    { value: 'extra-rounded', label: 'Rounded Corner' },
  ];

  const eyeBalls: { value: CornerDotType; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Circle' },
  ];

  const logos = [
    { value: 'none', label: 'None' },
    { value: 'peacock', label: 'Peacock Feather' },
    { value: 'flute', label: 'Divine Flute' },
    { value: 'om', label: 'Sacred OM' },
    { value: 'krishna', label: 'Krishna Silhouette' }
  ];

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>QR Code Customizer</h3>

      {/* Grid of panels */}
      <div style={styles.panelGrid}>
        
        {/* Step 1: Base Link */}
        <div className="glass-card" style={styles.subCard}>
          <h4 style={styles.cardSubtitle}>1. Destination Link</h4>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Redirect Target URL</label>
            <input
              type="text"
              className="form-input"
              value={options.data}
              onChange={(e) => updateOption('data', e.target.value)}
              placeholder="e.g. https://dash.talktokrishna.com/qr/camp-del-01"
            />
          </div>
        </div>

        {/* Step 2: Dot Patterns & Color */}
        <div className="glass-card" style={styles.subCard}>
          <h4 style={styles.cardSubtitle}>2. Dots & Body Pattern</h4>
          
          <div className="form-group">
            <label className="form-label">Body Pattern Style</label>
            <select
              className="form-select"
              value={options.dotsType}
              onChange={(e) => updateOption('dotsType', e.target.value as DotType)}
            >
              {dotPatterns.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Color Mode</label>
            <div style={styles.toggleRow}>
              <button
                onClick={() => updateOption('dotsColorType', 'single')}
                style={{
                  ...styles.toggleBtn,
                  ...(options.dotsColorType === 'single' ? styles.toggleBtnActive : {})
                }}
              >
                Solid Color
              </button>
              <button
                onClick={() => updateOption('dotsColorType', 'gradient')}
                style={{
                  ...styles.toggleBtn,
                  ...(options.dotsColorType === 'gradient' ? styles.toggleBtnActive : {})
                }}
              >
                Divine Gradient
              </button>
            </div>
          </div>

          {options.dotsColorType === 'single' ? (
            <div className="form-group">
              <label className="form-label">Solid Color Picker</label>
              <div style={styles.colorInputWrapper}>
                <input
                  type="color"
                  style={styles.colorInput}
                  value={options.dotsColor}
                  onChange={(e) => updateOption('dotsColor', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ flexGrow: 1 }}
                  value={options.dotsColor}
                  onChange={(e) => updateOption('dotsColor', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div style={styles.gradientInputs}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Gradient Start</label>
                <div style={styles.colorInputWrapper}>
                  <input
                    type="color"
                    style={styles.colorInput}
                    value={options.dotsGradientStart}
                    onChange={(e) => updateOption('dotsGradientStart', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={options.dotsGradientStart}
                    onChange={(e) => updateOption('dotsGradientStart', e.target.value)}
                    style={{ width: '80px' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Gradient End</label>
                <div style={styles.colorInputWrapper}>
                  <input
                    type="color"
                    style={styles.colorInput}
                    value={options.dotsGradientEnd}
                    onChange={(e) => updateOption('dotsGradientEnd', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={options.dotsGradientEnd}
                    onChange={(e) => updateOption('dotsGradientEnd', e.target.value)}
                    style={{ width: '80px' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Corner Eyes */}
        <div className="glass-card" style={styles.subCard}>
          <h4 style={styles.cardSubtitle}>3. Corner Anchors (Eyes)</h4>

          <div style={styles.gridRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Frame Shape</label>
              <select
                className="form-select"
                value={options.eyeFrameType}
                onChange={(e) => updateOption('eyeFrameType', e.target.value as CornerSquareType)}
              >
                {eyeFrames.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Center Ball Shape</label>
              <select
                className="form-select"
                value={options.eyeBallType}
                onChange={(e) => updateOption('eyeBallType', e.target.value as CornerDotType)}
              >
                {eyeBalls.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.gridRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Frame Color</label>
              <div style={styles.colorInputWrapper}>
                <input
                  type="color"
                  style={styles.colorInput}
                  value={options.eyeFrameColor}
                  onChange={(e) => updateOption('eyeFrameColor', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  value={options.eyeFrameColor}
                  onChange={(e) => updateOption('eyeFrameColor', e.target.value)}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Center Ball Color</label>
              <div style={styles.colorInputWrapper}>
                <input
                  type="color"
                  style={styles.colorInput}
                  value={options.eyeBallColor}
                  onChange={(e) => updateOption('eyeBallColor', e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  value={options.eyeBallColor}
                  onChange={(e) => updateOption('eyeBallColor', e.target.value)}
                  style={{ width: '80px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Logo Overlay */}
        <div className="glass-card" style={styles.subCard}>
          <h4 style={styles.cardSubtitle}>4. Brand Emblem (Center Logo)</h4>

          <div className="form-group">
            <label className="form-label">Emblem Preset</label>
            <div style={styles.logoGrid}>
              {logos.map((l) => (
                <button
                  key={l.value}
                  onClick={() => updateOption('logo', logoPresets[l.value as keyof typeof logoPresets])}
                  style={{
                    ...styles.logoBtn,
                    ...(options.logo === logoPresets[l.value as keyof typeof logoPresets] ? styles.logoBtnActive : {})
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {options.logo && (
            <div style={styles.gridRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Logo Size Ratio ({options.logoSize}%)</label>
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={options.logoSize}
                  onChange={(e) => updateOption('logoSize', Number(e.target.value))}
                  style={styles.slider}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Inner Margin ({options.logoMargin}px)</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={options.logoMargin}
                  onChange={(e) => updateOption('logoMargin', Number(e.target.value))}
                  style={styles.slider}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#ffffff',
  },
  panelGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  subCard: {
    background: 'rgba(255, 255, 255, 0.015)',
    padding: '20px',
  },
  cardSubtitle: {
    fontSize: '0.95rem',
    color: '#ffd700',
    fontFamily: 'var(--font-heading)',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255,215,0,0.1)',
    paddingBottom: '8px',
  },
  toggleRow: {
    display: 'flex',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '4px',
  },
  toggleBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    color: '#080916',
    background: '#ffd700',
  },
  colorInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  colorInput: {
    width: '42px',
    height: '42px',
    padding: '0',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  gradientInputs: {
    display: 'flex',
    gap: '16px',
  },
  gridRow: {
    display: 'flex',
    gap: '16px',
  },
  logoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '10px',
  },
  logoBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    padding: '8px 12px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  logoBtnActive: {
    borderColor: '#ffd700',
    color: '#ffd700',
    background: 'rgba(255, 215, 0, 0.05)',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    outline: 'none',
    cursor: 'pointer',
    margin: '12px 0',
  }
};
