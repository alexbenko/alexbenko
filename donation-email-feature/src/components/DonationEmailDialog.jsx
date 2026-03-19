import { useState, useEffect } from 'react';
import axios from 'axios';
import './DonationEmailDialog.css';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function DonationEmailDialog({ onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { success, previewUrl, error }

  // Load users on mount
  useEffect(() => {
    axios.get('/api/users').then(res => setUsers(res.data));
  }, []);

  // Fetch donation summary whenever user/year changes
  useEffect(() => {
    if (!selectedUserId) { setSummary(null); return; }

    setLoadingSummary(true);
    setSummary(null);
    setResult(null);

    axios
      .get('/api/donations/summary', { params: { userId: selectedUserId, year: selectedYear } })
      .then(res => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));
  }, [selectedUserId, selectedYear]);

  const handleSend = async () => {
    if (!selectedUserId) return;
    setSending(true);
    setResult(null);
    try {
      const res = await axios.post('/api/send-donation-email', {
        userId: parseInt(selectedUserId, 10),
        year: selectedYear,
      });
      setResult({ success: true, previewUrl: res.data.previewUrl });
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const selectedUser = users.find(u => u.id === parseInt(selectedUserId, 10));

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <header className="dialog-header">
          <h2>Send Donation Summary Email</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="dialog-body">
          {/* User selector */}
          <label className="field">
            <span>Recipient</span>
            <select
              value={selectedUserId}
              onChange={e => { setSelectedUserId(e.target.value); setResult(null); }}
            >
              <option value="">— Select a donor —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>

          {/* Year selector */}
          <label className="field">
            <span>Year</span>
            <select
              value={selectedYear}
              onChange={e => { setSelectedYear(parseInt(e.target.value, 10)); setResult(null); }}
            >
              {YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          {/* Donation summary preview */}
          {loadingSummary && <p className="hint">Loading donation data…</p>}

          {summary && (
            <div className="summary-box">
              <h3>Summary Preview</h3>
              {summary.donations.length === 0 ? (
                <p className="hint">No cash donations recorded for {selectedYear}.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.donations.map((d, i) => (
                      <tr key={i}>
                        <td>{d.date}</td>
                        <td className="amount">${d.amount.toFixed(2)}</td>
                        <td>{d.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td className="amount"><strong>${summary.total.toFixed(2)}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}
              <p className="recipient-note">
                Email will be sent to: <strong>{selectedUser?.email}</strong>
              </p>
            </div>
          )}

          {/* Result banner */}
          {result && (
            <div className={`result-banner ${result.success ? 'success' : 'error'}`}>
              {result.success ? (
                <>
                  <span>Email sent successfully!</span>
                  {result.previewUrl && (
                    <a href={result.previewUrl} target="_blank" rel="noopener noreferrer">
                      View preview →
                    </a>
                  )}
                </>
              ) : (
                <span>Error: {result.error}</span>
              )}
            </div>
          )}
        </div>

        <footer className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={!selectedUserId || !summary || sending}
          >
            {sending ? 'Sending…' : `Send Email for ${selectedYear}`}
          </button>
        </footer>
      </div>
    </div>
  );
}
