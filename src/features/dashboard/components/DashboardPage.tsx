// import React, { useState } from 'react';
// import './DashboardPage.css';
// // import {login} from '../../../services/authService';
// import { useNavigate } from 'react-router-dom';

// const DashboardPage: React.FC = () => {  
  
//   return (
//     <div className="login-container">
//       {/* Left Banner Section */}
      
//       Dashboard
      
//     </div>
//   );
// };

// export default DashboardPage;



import React, { useRef, useState } from 'react';

const DashboardPage: React.FC = () => {
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      videoRef.current = video;

      // First screenshot
      captureScreenshot();

      // Schedule every 5 seconds
      intervalRef.current = setInterval(captureScreenshot, 5000);
      setCapturing(true);
    } catch (err) {
      console.error('Screen capture error:', err);
    }
  };

  const captureScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `screenshot-${Date.now()}.png`;
      link.click();
    }
  };

  const stopCapture = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCapturing(false);
  };

  return (
    <div>
      <h2>Auto Screen Capture (5s interval)</h2>

      

      <p style={{ marginTop: '20px' }}>
        {capturing
          ? 'Capturing... screenshots will be downloaded every 5 seconds.'
          : 'Click "Start Screen Capture" and grant permission.'}
      </p>
    </div>
  );
};

export default DashboardPage;
