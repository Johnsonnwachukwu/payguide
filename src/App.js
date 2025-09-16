
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {GoogleGenAI} from '@google/genai';




const genAI = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GEMINI_API_KEY
});





const translations = {
  en: {
    title: "PayGuide",
    description: "Helping visually impaired users recognize currency.",
    upload: "Upload Currency Image",
    camera: "Use Live Camera",
    capture: "Capture Image",
    detecting: "Detecting currency...",
    results:  [
      "₦1000 - Nigerian Naira",
      "₦500 - Nigerian Naira",
      "₦200 - Nigerian Naira",
      "₦100 - Nigerian Naira",
      "₦50 - Nigerian Naira",
      "₦20 - Nigerian Naira",
      "₦10 - Nigerian Naira",
      "₦5 - Nigerian Naira"
    ],
    error: "Invalid currency image.",
    back: "Back",
  },
  yo: {
    title: "Itọsọna Òwò",
    description: "Ṣe iranlọwọ fun awọn ẹni aláìríran lati mọ owo ní rọọrun.",
    upload: "Ṣe igbasilẹ aworan Owo",
    camera: "Lo Kamẹra Taayọ",
    capture: "Ya Aworan",
    detecting: "Ìdánwò owó...",
    results: [
      "₦1000 - Naira Naijiria",
      "₦500 - Naira Naijiria",
      "₦200 - Naira Naijiria",
      "₦100 - Naira Naijiria",
      "₦50 - Naira Naijiria",
      "₦20 - Naira Naijiria",
      "₦10 - Naira Naijiria",
      "₦5 - Naira Naijiria"
    ],
    error: "Aworan owó kò tọ. Jọwọ rii daju pé o jẹ owó Naijiria.",
    back: "Pada",
  },
  ig: {
    title: "Ntuzi Ego",
    description: "Inye aka nye ndi na-anaghị ahụ anya ka ha mata ego n’efu.",
    upload: "Bulite Onyinyo Ego",
    camera: "Jiri Kamera",
    capture: "Nweta Onyinyo",
    detecting: "Na achọpụta ego...",
    results: [
    "₦1000 - Naira Naịjirịa",
    "₦500 - Naira Naịjirịa",
    "₦200 - Naira Naịjirịa",
    "₦100 - Naira Naịjirịa",
    "₦50 - Naira Naịjirịa",
    "₦20 - Naira Naịjirịa",
    "₦10 - Naira Naịjirịa",
    "₦5 - Naira Naịjirịa"
   ],
    error: "Onyinyo ego ezighi ezi. Biko hụ na ọ bụ ego Naijiria.",
    back: "Laghachi",
  },
  ha: {
    title: "Jagoran Kuɗi",
    description: "Taimakawa masu rashin gani su gane kuɗi cikin sauƙi.",
    upload: "Loda Hoton Kuɗi",
    camera: "Yi Amfani da Kamara",
    capture: "Dauki Hoto",
    detecting: "Ana tantance kuɗi...",
    results: [
      "₦1000 - Naira Najeriya",
      "₦500 - Naira Najeriya",
      "₦200 - Naira Najeriya",
      "₦100 - Naira Najeriya",
      "₦50 - Naira Najeriya",
      "₦20 - Naira Najeriya",
      "₦10 - Naira Najeriya",
      "₦5 - Naira Najeriya"
    ],
    error: "Hoton kuɗi ba daidai bane. Tabbatar cewa kuɗin Najeriya ne.",
    back: "Koma Baya",
  },
};

const findLocalizedResult = (geminiResult, language) => {
  const baseResult = geminiResult.trim();

  const index = translations["en"].results.findIndex(
    (r) => r.toLowerCase() === baseResult.toLowerCase()
  );

  if (index === -1) return translations[language].error;

  return translations[language].results[index];
};

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    console.log("📄 Converting file to base64:", file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('File too large. Maximum size is 10MB'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      console.log("✅ File converted to base64 successfully");
      resolve(reader.result); // includes data:image/png;base64,...
    };
    reader.onerror = (error) => {
      console.error("❌ FileReader error:", error);
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

const extractCurrencyResult = (response) => {
  const lower = response.toLowerCase();

  // Direct numeric detection: "1000 naira"
  const numberMatch = lower.match(/(?:₦)?\s*(1000|500|200|100|50|20|10|5)\s*(naira|nigerian naira)?/i);
  if (numberMatch) {
    return `₦${numberMatch[1]} - Nigerian Naira`;
  }

  // Word-based detection
  const wordMap = {
    "one thousand": "₦1000",
    "five hundred": "₦500",
    "two hundred": "₦200",
    "one hundred": "₦100",
    "fifty": "₦50",
    "twenty": "₦20",
    "ten": "₦10",
    "five": "₦5",
  };

  for (const [word, value] of Object.entries(wordMap)) {
    if (lower.includes(`${word} naira`)) {
      return `${value} - Nigerian Naira`;
    }
  }

  return "Unrecognized currency";
};

const fetchGeminiResponse = async (strippedBase64, mimeType) => {
  try {
    console.log("🤖 Calling Gemini API with mimeType:", mimeType);
    
    const prompt = `Identify the Nigerian currency denomination in the image. 
    Return ONLY in this format:
    "₦1000 - Nigerian Naira", "₦500 - Nigerian Naira", 
    "₦200 - Nigerian Naira", "₦100 - Nigerian Naira", 
    "₦50 - Nigerian Naira", "₦20 - Nigerian Naira", 
    "₦10 - Nigerian Naira", "₦5 - Nigerian Naira".
    Do NOT explain anything. Just give the exact match.`;
    
    const model = "gemini-2.5-flash";  
    
    const result = await genAI.models.generateContent({
      contents: {
        inlineData: {
          data: strippedBase64,
          mimeType: mimeType ?? 'image/png',
        },
        role: 'user',
        prompt,
      },
      model,
    });

    console.log("✅ Gemini API response:", result);
    const response = result.text;
    console.log("✅ Extracted text:", response);
    
    return extractCurrencyResult(response);
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}
const detectWithGemini = async (file) => {
  try {
    console.log("📁 Processing uploaded file:", file.name, file.type, file.size);
    
    const base64 = await convertFileToBase64(file); 
    console.log("✅ File converted to base64, length:", base64.length);
    
    const strippedBase64 = base64.split(',')[1]; 
    console.log("✅ Base64 stripped, length:", strippedBase64.length);
    
    const geminiResponse = await fetchGeminiResponse(strippedBase64, file.type);
    console.log("✅ Gemini response received:", geminiResponse);
    
    return geminiResponse;  
  } catch (error) {
    console.error("❌ Error in detectWithGemini:", error);
    throw error;
  }
}

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const resetApp = () => {
    console.log("🔄 Resetting app...");
    setImage(null);
    setResult("");
    setError("");
    setIsCameraOn(false);
    setIsLoadingCamera(false);
    setIsDetecting(false);
    
    // Stop camera stream if active
    if (videoRef.current && videoRef.current.srcObject) {
      console.log("📹 Stopping camera stream...");
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    // Clear any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // eslint-disable-next-line
  const playSound = (type) => {
    const audio = new Audio(`/${type}.mp3`);
    audio.play();
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      console.log("🔊 Speaking text:", text);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for better understanding
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Use a specific voice if available (for consistency)
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Samantha'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log("🎤 Using voice:", preferredVoice.name);
      }
      
      utterance.onstart = () => console.log("🔊 Speech started:", text);
      utterance.onend = () => console.log("🔇 Speech completed");
      utterance.onerror = (event) => console.error("❌ Speech error:", event.error);
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageUpload = async(event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Speak immediately when image is selected
    speakText(translations[language].detecting);

    setError("");
    setIsDetecting(true);
    setResult(translations[language].detecting);
    
    try {
      console.log("📤 Starting image upload processing...");
      
      // Pass the file object directly and use file.type for mimeType
      const geminiResponse = await detectWithGemini(file);
      const localizedResult = findLocalizedResult(geminiResponse, language);
      
      console.log("✅ Upload processing completed successfully");
      console.log("📝 Upload result text:", localizedResult);
      setResult(localizedResult);
      setIsDetecting(false);
      speakText(localizedResult);
    } catch (error) {
      console.error("❌ Upload processing error:", error);
      
      let errorMessage = "Failed to process image. ";
      if (error.message.includes('File must be an image')) {
        errorMessage = "Please select a valid image file.";
      } else if (error.message.includes('File too large')) {
        errorMessage = "Image file is too large. Please select a smaller image.";
      } else if (error.message.includes('Gemini API failed')) {
        errorMessage = "Currency detection service is temporarily unavailable. Please try again.";
      } else if (error.message.includes('Failed to read file')) {
        errorMessage = "Could not read the image file. Please try a different image.";
      } else {
        errorMessage += "Please try again.";
      }
      
      setError(errorMessage);
      setIsDetecting(false);
      speakText("Failed to process image. Please try again.");
    }
  };


const startCamera = async () => {
  console.log("🎥 Starting camera initialization...");
  setIsLoadingCamera(true);
  setError("");
  
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera not supported in this browser");
    }

    console.log("📱 Requesting rear camera access...");
    let stream;
    
    try {
      // Try to get rear camera first
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }, // Force rear camera only
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (rearCameraError) {
      console.log("⚠️ Rear camera not available, trying fallback...");
      // Fallback to any camera if rear camera fails
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer rear camera but allow others
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    }
    
    console.log("✅ Camera stream obtained:", stream);
    console.log("📊 Stream tracks:", stream.getTracks());

    // Set the stream to video element immediately
    if (videoRef.current) {
      console.log("🎬 Setting video source...");
      videoRef.current.srcObject = stream;
      
      // Show camera immediately
      console.log("📹 Showing camera...");
      setIsLoadingCamera(false);
      setIsCameraOn(true);
      
      // Try to play the video
      videoRef.current.play().then(() => {
        console.log("▶️ Video playing successfully");
      }).catch(err => {
        console.log("❌ Video play failed, but camera is shown:", err);
      });
    } else {
      console.error("❌ Video ref not available");
      setError("Video element not found");
      setIsLoadingCamera(false);
    }
  } catch (error) {
    console.error("❌ Camera access error:", error);
    setIsLoadingCamera(false);
    
    let errorMessage = "Camera access failed: ";
    if (error.name === 'NotAllowedError') {
      errorMessage += "Permission denied. Please allow camera access.";
    } else if (error.name === 'NotFoundError') {
      errorMessage += "No rear camera found on this device. Please use a device with a rear camera.";
    } else if (error.name === 'NotSupportedError') {
      errorMessage += "Camera not supported in this browser.";
    } else if (error.name === 'OverconstrainedError') {
      errorMessage += "Rear camera not available. Please use a device with a rear camera.";
    } else {
      errorMessage += error.message;
    }
    
    setError(errorMessage);
    alert(errorMessage);
  }
};


const captureImage = async() => {
  if (!videoRef.current || !canvasRef.current) {
    console.error("❌ Video or canvas ref not available");
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current;
  console.log("📸 Capturing image...");

  // Wait for video to be ready
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.log("⏳ Waiting for video to be ready...");
    await new Promise((resolve) => {
      const handler = () => {
        video.removeEventListener('loadedmetadata', handler);
        resolve();
      };
      video.addEventListener('loadedmetadata', handler);
    });
  }

  // Avoid 0x0 canvas bug
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.error("❌ Video not ready - dimensions are 0x0");
    setError("Video not ready yet. Please wait a second and try again.");
    return;
  }

  console.log("🎨 Drawing image to canvas...");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imgData = canvas.toDataURL("image/png");
  console.log("✅ Image captured successfully");
  
  // Speak immediately when image is captured
  speakText(translations[language].detecting);
  
  // Clean up camera immediately
  setIsCameraOn(false);
  setImage(imgData);
  setIsDetecting(true);
  setResult(translations[language].detecting);
  
  // Stop camera stream
  if (video.srcObject) {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }

  // Process with Gemini API
  try {
    console.log("🤖 Sending to Gemini API...");
    const mimeType = imgData.substring(
      imgData.indexOf(":") + 1,
      imgData.indexOf(";")
    );

    const strippedBase64 = imgData.split(",")[1];
    const geminiResponse = await fetchGeminiResponse(strippedBase64, mimeType);
    const localizedResult = findLocalizedResult(geminiResponse, language);
    
    console.log("✅ Gemini response received:", localizedResult);
    console.log("📝 Capture result text:", localizedResult);
    setResult(localizedResult);
    setIsDetecting(false);
    speakText(localizedResult);
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    setError("Failed to process image. Please try again.");
    setIsDetecting(false);
    speakText("Failed to process image. Please try again.");
  }
};

const requestCameraPermission = async () => {
  try {
    const permissionStatus = await navigator.permissions.query({ name: "camera" });
    console.log("Camera permission status:", permissionStatus.state);

    if (permissionStatus.state === "granted") {
      console.log("Camera permission already granted");
      startCamera();
    } else if (permissionStatus.state === "prompt") {
      console.log("Requesting camera access...");
      startCamera(); 
    } else {
      alert("Camera access is denied. Please enable it in your browser settings.");
    }
  } catch (error) {
    console.warn("Permission API failed or not supported. Falling back to getUserMedia.");
    startCamera();
  }
};



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-cyan-500 text-white p-6 relative">
      {/* Back Button at Top-Left */}
      <button
        onClick={resetApp}
        className="absolute top-5 left-5 bg-gray-800 px-4 py-2 rounded-lg shadow-md font-semibold hover:bg-gray-700 transition-all"
      >
        ← {translations[language].back}
      </button>

      {/* Language Selector */}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="absolute top-5 right-5 bg-white text-blue-900 px-3 py-2 rounded-lg shadow-md font-semibold"
      >
        <option value="en">English</option>
        <option value="yo">Yorùbá</option>
        <option value="ig">Igbo</option>
        <option value="ha">Hausa</option>
      </select>

      <motion.h1
        className="text-5xl font-bold mb-4"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {translations[language].title}
      </motion.h1>

      <p className="text-lg text-center max-w-md mb-6">
        {translations[language].description}
      </p>

      {/* Upload Image Button */}
      <label className="cursor-pointer bg-white text-blue-600 px-6 py-3 rounded-lg shadow-lg
       font-semibold hover:bg-gray-200 transition-all mb-3">
        {translations[language].upload}
        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </label>

      {/* Live Camera Toggle */}
      {!isCameraOn && !isLoadingCamera ? (
        <button
          onClick={requestCameraPermission}
          className="bg-green-500 px-6 py-3 rounded-lg shadow-lg font-semibold hover:bg-green-700 transition-all mb-3"
        >
          {translations[language].camera}
        </button>
      ) : isLoadingCamera ? (
        <button
          disabled
          className="bg-yellow-500 px-6 py-3 rounded-lg shadow-lg font-semibold opacity-75 mb-3"
        >
          Loading Camera...
        </button>
      ) : (
        <button
          onClick={captureImage}
          className="bg-red-500 px-6 py-3 rounded-lg shadow-lg font-semibold hover:bg-red-700 transition-all mb-3"
        >
          {translations[language].capture}
        </button>
      )}

      {/* Camera Preview - Always render video element */}
      <div className="relative mt-4 flex justify-center">
        <div className="relative">
          <video 
            ref={videoRef} 
            autoPlay
            playsInline
            muted
            className={`w-96 h-72 object-cover rounded-xl shadow-2xl border-4 border-white ${!isCameraOn ? 'hidden' : ''}`}
            style={{ 
              backgroundColor: '#000',
              // Remove mirror effect for more natural feel
            }}
          />
          {isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-4">
              {/* Top overlay */}
              <div className="text-white text-sm bg-black bg-opacity-70 px-4 py-2 rounded-lg font-medium">
                📷 Position Nigerian currency in view
              </div>
              
              {/* Bottom overlay with instructions */}
              <div className="text-white text-xs bg-black bg-opacity-70 px-3 py-2 rounded-lg text-center">
                Tap "Capture Image" when ready
              </div>
              
              {/* Corner guides */}
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-yellow-400 rounded-lg"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-2 border-yellow-400 rounded-lg"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-yellow-400 rounded-lg"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-yellow-400 rounded-lg"></div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Camera State */}
      {isLoadingCamera && (
        <div className="mt-4 flex justify-center">
          <div className="w-96 h-72 bg-gray-800 rounded-xl shadow-2xl border-4 border-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
              <div className="text-white text-lg mb-3 font-medium">Initializing Camera...</div>
              <div className="text-white text-sm mb-4">Please allow camera permissions</div>
              <button
                onClick={() => {
                  console.log("Force camera on - user clicked");
                  setIsLoadingCamera(false);
                  setIsCameraOn(true);
                }}
                className="text-sm bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Force Camera On
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture Image Canvas (Hidden) */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>


      {/* Currency Detection Loading */}
      {isDetecting && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mx-auto mb-4"></div>
            <div className="text-white text-lg font-medium mb-2">Detecting Currency...</div>
            <div className="text-white text-sm opacity-80">Please wait while we analyze your image</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

      {/* Display Uploaded or Captured Image */}
      {image && (
        <div className="mt-6 flex justify-center">
          <img 
            src={image} 
            alt="Detected Currency" 
            className="w-64 h-auto rounded-xl shadow-2xl border-4 border-white object-cover"
          />
        </div>
      )}

      {/* Detection Result */}
      {result && !isDetecting && (
        <div className="mt-6 text-center">
          <p className="text-2xl font-semibold text-green-300 mb-2">{result}</p>
          <div className="text-white text-sm opacity-80">
            Currency detected successfully!
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


