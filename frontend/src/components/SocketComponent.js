// src/components/SocketComponent.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connect to your Socket.IO server
const socket = io('http://localhost:5000'); // Adjust this URL if needed

const SocketComponent = () => {
  const [result, setResult] = useState('');

  useEffect(() => {
    // Handle the connection event
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    // Listen for events from the server
    socket.on('code_result', (data) => {
      setResult(data.result); // Update state with the received result
    });

    // Clean up on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = () => {
    // Emit an event to the server
    socket.emit('code_submission', { code: 'console.log("Hello, world!")' });
  };

  return (
    <div>
      <button onClick={handleSubmit}>Submit Code</button>
      <div>
        <h2>Result:</h2>
        <pre>{result}</pre>
      </div>
    </div>
  );
};

export default SocketComponent;
