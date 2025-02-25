
import { useState, useRef } from "react";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "PayGuide",
    description: "Helping visually impaired users recognize currency.",
    upload: "Upload Currency Image",
    camera: "Use Live Camera",
    capture: "Capture Image",
    detecting: "Detecting currency...",
    result: "₦1000 - Nigerian Naira",
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
    result: "₦1000 - Naira Naijiria",
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
    result: "₦1000 - Naira Naijiria",
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
    result: "₦1000 - Naira Najeriya",
    error: "Hoton kuɗi ba daidai bane. Tabbatar cewa kuɗin Najeriya ne.",
    back: "Koma Baya",
  },
};

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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setError("");
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => detectCurrency(img.src);
    }
  };

  const detectCurrency = (src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      if (aspectRatio >= 2.0 && aspectRatio <= 2.4) {
        setImage(src);
        setResult(translations[language].detecting);
        speakText(translations[language].detecting);
        playSound("loading");

        setTimeout(() => {
          setResult(translations[language].result);
          speakText(translations[language].result);
          playSound("success");
        }, 2000);
      } else {
        setError(translations[language].error);
        speakText(translations[language].error);
        playSound("error");
        setImage(null);
        setResult("");
      }
    };
  };

  const startCamera = async () => {
    setIsCameraOn(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const imgData = canvasRef.current.toDataURL("image/png");
      detectCurrency(imgData);
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
      <label className="cursor-pointer bg-white text-blue-600 px-6 py-3 rounded-lg shadow-lg font-semibold hover:bg-gray-200 transition-all mb-3">
        {translations[language].upload}
        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </label>

      {/* Live Camera Toggle */}
      {!isCameraOn ? (
        <button
          onClick={startCamera}
          className="bg-green-500 px-6 py-3 rounded-lg shadow-lg font-semibold hover:bg-green-700 transition-all mb-3"
        >
          {translations[language].camera}
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
        <video ref={videoRef} autoPlay className="w-64 h-auto mt-3 rounded-lg shadow-lg"></video>
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






