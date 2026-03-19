import { useState } from 'react';
import DonationEmailDialog from './components/DonationEmailDialog';
import './App.css';

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="app">
      <h1>Cash Donation Manager</h1>
      <p>Send year-end donation summary emails to donors.</p>
      <button className="open-btn" onClick={() => setDialogOpen(true)}>
        Send Donation Email
      </button>

      {dialogOpen && <DonationEmailDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
