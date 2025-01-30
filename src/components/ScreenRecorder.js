import React, { useState, useRef } from 'react';
import { Camera, Monitor, Layout, Video, Square, Download } from 'lucide-react';

const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState('screen');
  const [enableCamera, setEnableCamera] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);
  const chrome = window.chrome

  const getStreamId = () => {
    return new Promise((resolve, reject) => {
      const sources = ['window', 'screen', 'tab'];
      chrome.desktopCapture.chooseDesktopMedia(sources, (streamId) => {
        if (streamId) {
          resolve(streamId);
        } else {
          reject(new Error('Failed to get stream ID'));
        }
      });
    });
  };

  const startRecording = async () => {
    try {
      // Get stream ID from Chrome's desktop capture API
      const streamId = await getStreamId();
      
      // Create constraints for getUserMedia
      const constraints = {
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const streams = [];

      // Get screen stream using the obtained streamId
      const screenStream = await navigator.mediaDevices.getUserMedia(constraints);
      streams.push(...screenStream.getTracks());

      // Add camera if enabled
      if (enableCamera) {
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 320,
              height: 240,
              facingMode: 'user'
            },
            audio: false
          });
          streams.push(...cameraStream.getTracks());
        } catch (err) {
          console.error('Camera access error:', err);
          // Continue without camera if it fails
        }
      }

      // Get audio stream separately
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          },
          video: false
        });
        streams.push(...audioStream.getTracks());
      } catch (err) {
        console.error('Audio access error:', err);
        // Continue without audio if it fails
      }

      const combinedStream = new MediaStream(streams);
      
      // Create and configure MediaRecorder
      mediaRecorder.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, {
          type: 'video/webm'
        });
        
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString();
        
        setRecordings(prev => [...prev, {
          url,
          timestamp,
          size: blob.size
        }]);
        
        recordedChunks.current = [];
        streams.forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = (url, timestamp) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `screen-recording-${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Rest of the component remains the same...
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-80">
      {/* Recording Options */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Camera Overlay:</span>
          <button
            onClick={() => setEnableCamera(!enableCamera)}
            className={`p-2 rounded ${
              enableCamera ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
            }`}
          >
            <Camera size={20} />
          </button>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <Video size={20} />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gray-800 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <Square size={20} />
            Stop Recording
          </button>
        )}
      </div>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium">Recordings</h3>
          <div className="space-y-2">
            {recordings.map((recording, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-xs">
                  {new Date(recording.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => downloadRecording(recording.url, recording.timestamp)}
                  className="text-blue-600 p-1 hover:bg-blue-50 rounded"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenRecorder;