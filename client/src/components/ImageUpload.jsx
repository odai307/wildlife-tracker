import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RotateCcw, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from "axios";
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
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setResult(null);
      setError('');
    } else {
      setError('Please drop a valid image file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

 const handleSubmit = async () => {
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
      timeout: 30000,
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
      setError(`Server error (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    } else if (err.request) {
      setError('No response from server. Check if the server is running on port 3000.');
    } else {
      setError(`Request error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  const clearImage = () => {
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container">
      <div className="image-upload-container">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <Camera size={32} />
          </div>
          <h2>Wildlife Image Classifier</h2>
          <p className="subtitle">Upload or capture an image to identify wildlife species using AI</p>
        </div>

        {/* Upload Section */}
        {!cameraOn && (
          <div className="upload-section">
            <div 
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} />
              <h3>Drop your image here</h3>
              <p>or click to browse from your device</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <button 
              type="button"
              className="camera-btn"
              onClick={() => startCamera(videoDevices[currentDeviceIndex]?.deviceId)}
            >
              <Camera size={20} />
              Use Camera
            </button>
          </div>
        )}

        {/* Camera View */}
        {cameraOn && (
          <div className="camera-section">
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline muted className="video-preview" />
            </div>
            
            <div className="camera-buttons">
              <button type="button" className="capture-btn" onClick={captureImage}>
                <Camera size={16} />
                Capture
              </button>
              
              {videoDevices.length > 1 && (
                <button type="button" className="switch-btn" onClick={switchCamera}>
                  <RotateCcw size={16} />
                  Switch
                </button>
              )}
              
              <button type="button" className="cancel-btn" onClick={stopCamera}>
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {previewUrl && (
          <div className="preview-section">
            <div className="image-container">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              <button type="button" className="clear-btn" onClick={clearImage}>
                <X size={16} />
              </button>
            </div>
            
            <button 
              type="button"
              className="classify-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spinner-icon" />
                  Analyzing...
                </>
              ) : (
                'Classify Wildlife'
              )}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Classifying...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-container">
            <AlertCircle size={20} />
            <p className="error">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="result enhanced-result">
            <div className="result-header">
              <CheckCircle size={24} />
              <h3>Classification Result</h3>
            </div>
            
            <div className="result-content">
              <div className="result-row">
                <span className="label">Species:</span>
                <span className="value">{result.animalType}</span>
              </div>
              
              <div className="result-row">
                <span className="label">Confidence:</span>
                <div className="confidence-display">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="percentage">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ImageUpload;