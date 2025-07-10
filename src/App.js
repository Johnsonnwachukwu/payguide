import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {GoogleGenAI} from '@google/genai';


const genAI = new GoogleGenAI({apiKey:"Your_API_Key"});



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
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // includes data:image/png;base64,...
    reader.onerror = reject;
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
     const prompt = `Identify the Nigerian currency denomination in the image. 
    Return ONLY in this format:
    "₦1000 - Nigerian Naira", "₦500 - Nigerian Naira", 
    "₦200 - Nigerian Naira", "₦100 - Nigerian Naira", 
    "₦50 - Nigerian Naira", "₦20 - Nigerian Naira", 
    "₦10 - Nigerian Naira", "₦5 - Nigerian Naira".
    Do NOT explain anything. Just give the exact match.`;
   const model = "gemini-2.5-flash";  
   const result = await genAI.models.generateContent({
    contents:{
          inlineData: {
         data: strippedBase64,
         mimeType: mimeType ?? 'image/png',
       },
       role: 'user',
      //  parts: [{ text: prompt }]
      prompt,
    },
      model,
    });

    const response = result.text;
    return extractCurrencyResult(response);
}
const detectWithGemini = async (file) => {
   const base64 = await convertFileToBase64(file); 
   const strippedBase64 = base64.split(',')[1]; 
   const geminiResponse = await fetchGeminiResponse(strippedBase64, file.mimeType);
   return geminiResponse;  

}

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const resetApp = () => {
    setImage(null);
    setResult("");
    setError("");
    setIsCameraOn(false);
  };

  // eslint-disable-next-line
  const playSound = (type) => {
    const audio = new Audio(`/${type}.mp3`);
    audio.play();
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageUpload = async(event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError("");
    setResult(translations[language].detecting);
    speakText(translations[language].detecting);
    const geminiResponse = await detectWithGemini(file);
    const localizedResult = findLocalizedResult(geminiResponse, language);
    setResult(localizedResult);
    speakText(localizedResult);
  };


const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }, 
      audio: false,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play(); 
    }

    setIsCameraOn(true);
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Camera access failed. Please allow permissions.");
  }
};


 const captureImage = async() => {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;

  // Avoid 0x0 canvas bug
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert("Video not ready yet. Please wait a second and try again.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imgData = canvas.toDataURL("image/png");
  setIsCameraOn(false);
  setImage(imgData); 
  const mimeType = imgData.substring(
    imgData.indexOf(":") + 1,
    imgData.indexOf(";")
  );

  const strippedBase64 = imgData.split(",")[1];
  const geminiResponse = await fetchGeminiResponse(strippedBase64, mimeType);
  const localizedResult = findLocalizedResult(geminiResponse, language);
  setResult(localizedResult);
  speakText(localizedResult);


 
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
      {!isCameraOn ? (
        <button
          onClick={requestCameraPermission}
          className="bg-green-500 px-6 py-3 rounded-lg shadow-lg font-semibold hover:bg-green-700 transition-all mb-3"
        >
          {/* {translations[language].camera} */}
          snap
        </button>
      ) : (
        <button
          onClick={captureImage}
          className="bg-red-500 px-6 py-3 rounded-lg shadow-lg font-semibold hover:bg-red-700 transition-all mb-3"
        >
          {translations[language].capture}
        </button>
      )}

      {/* Camera Preview */}
      {isCameraOn && (
        <video 
        ref={videoRef} 
         autoPlay
         playsInline
         muted 

        className="w-64 h-auto mt-3 rounded-lg shadow-lg"></video>
      )}

      {/* Capture Image Canvas (Hidden) */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      {/* Error Message */}
      {error && <p className="mt-4 text-red-400">{error}</p>}

      {/* Display Uploaded or Captured Image */}
      {image && <img src={image} alt="Detected Currency" className="mt-6 w-48 h-auto rounded-lg shadow-lg border-2 border-white" />}

      {/* Detection Result */}
      {result && <p className="mt-6 text-2xl font-semibold text-green-300">{result}</p>}
    </div>
  );
}

export default App;





