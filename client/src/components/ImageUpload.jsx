import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ImageUpload.css';

const ImageUpload = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Detect cameras on mount
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
      } catch (err) {
        console.error('Failed to enumerate devices', err);
        setError('Could not detect camera devices.');
      }
    };
    getCameras();
  }, []);

  // Start camera using selected device
  const startCamera = async (deviceId = null) => {
    setResult(null);
    setError('');
    setCameraOn(true);

    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access the camera.');
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraOn(false);
  };

  const switchCamera = async () => {
    if (videoDevices.length <= 1) return;

    stopCamera();

    const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
    setCurrentDeviceIndex(nextIndex);
    await startCamera(videoDevices[nextIndex].deviceId);
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const imageFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      setFile(imageFile);
      setPreviewUrl(URL.createObjectURL(imageFile));
      stopCamera();
    }, 'image/jpeg');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    } else {
      setError('Please upload a valid image file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload or capture an image first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      console.log('Uploading file:', file.name, file.type, file.size);
      
      const res = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log('Full Response:', res);
      console.log('Response data:', res.data);
      
      if (res.data && res.data.prediction) {
        setResult(res.data.prediction);
      } else {
        setError(`No prediction received. Server response: ${JSON.stringify(res.data)}`);
      }
      
    } catch (err) {
      console.error('Full upload error:', err);
      
      if (err.response) {
        // Server responded with error status
        console.error('Server error response:', err.response);
        console.error('Server error data:', err.response.data);
        console.error('Server error status:', err.response.status);
        setError(`Server error (${err.response.status}): ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        // Request was made but no response received
        console.error('No response received:', err.request);
        setError('No response from server. Check if the server is running on port 3000.');
      } else {
        // Something else happened
        console.error('Request setup error:', err.message);
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <h2>Wildlife Image Classifier</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <p>or</p>

        {!cameraOn ? (
          <button type="button" onClick={() => startCamera(videoDevices[currentDeviceIndex]?.deviceId)}>
            Use Camera
          </button>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="video-preview" />
            <div className="camera-buttons">
              <button type="button" onClick={captureImage}>Capture</button>
              {videoDevices.length > 1 && (
                <button type="button" onClick={switchCamera}>Switch Camera</button>
              )}
              <button type="button" onClick={stopCamera}>Cancel</button>
            </div>
          </>
        )}

        {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}

        <br />
        <button type="submit">Classify Image</button>
      </form>

      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Classifying...</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <h3>Prediction Result:</h3>
          <p><strong>Animal Type:</strong> {result.animalType}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageUpload;