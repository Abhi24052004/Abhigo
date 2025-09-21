import React, { useState, useRef } from "react";
import 'remixicon/fonts/remixicon.css'
// import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import LocationSearchPanel from '../components/LocationSearchPanel';
import Vehicle from '../components/Vehicle';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import Driver from '../components/Driver';


function Home() {

  //
  
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
      
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        chunksRef.current = [];
      
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setTranscript("");
      setError("");
    } catch (err) {
      setError("Microphone access denied or unavailable");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setRecording(false);
    }
    
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      setError("No audio to transcribe");
      return;
    }
    setError("");
    setTranscript("");

    const formData = new FormData();
   
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const res = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setTranscript(data.text || "");
      } else {
        setError(data.error || "Failed to transcribe");
      }
      
    } catch (_err) {
      setError("Server not reachable");
    }
  };


  //
  

  
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [confirmRide, setConfirmRide] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [driverPanel, setDriverPanel] = useState(false)
  const panel = useRef();
  const panelOption = useRef();
  const vehicles = useRef();
  const confirmRideRef = useRef();
  const vehicleFoundRef = useRef();
  const driverPanelRef = useRef();

  const submitHandler = (e) => {
    e.preventDefault();

  }

  useGSAP(() => {
    if (driverPanel) {
      gsap.to(driverPanelRef.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(driverPanelRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [driverPanel]);

  useGSAP(() => {
    if (vehicleFound) {
      gsap.to(vehicleFoundRef.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(vehicleFoundRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [vehicleFound]);


  useGSAP(() => {
    if (confirmRide) {
      gsap.to(confirmRideRef.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(confirmRideRef.current, {
        transform: "translateY(100%)"
      })
    }
  }, [confirmRide]);

  useGSAP(() => {
    if (showVehicles) {
      gsap.to(vehicles.current, {
        transform: "translateY(0%)"
      })
    } else {
      gsap.to(vehicles.current, {
        transform: "translateY(100%)"
      })
    }
  }, [showVehicles]);

  useGSAP(() => {
    if (panelOpen) {
      gsap.to(panel.current, { height: "75%" });
      gsap.to(panelOption.current, { opacity: 1 });
    } else {
      gsap.to(panel.current, { height: "0%" });
      gsap.to(panelOption.current, { opacity: 0 });
    }
  }, [panelOpen]);

  return (
    /*
    
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1>🎤 Voice → Text (Groq Whisper)</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {!recording ? (
          <button onClick={startRecording}>🎙️</button>
        ) : (
          <button onClick={stopRecording}>⏹</button>
        )}
        <button onClick={uploadAudio} disabled={!audioBlob}>
          ⬆️ Transcribe
        </button>
      </div>

      {audioBlob && (
        <div style={{ marginBottom: 12 }}>
          <div>Preview:</div>
          <audio controls src={URL.createObjectURL(audioBlob)} />
        </div>
      )}

      {transcript && (
        <div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
          <strong>Transcript:</strong> {transcript}
        </div>
      )}
      {error && (
        <div style={{ color: "red", marginTop: 8 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
    
    */
    <div className='h-screen relative overflow-hidden'>
      <div className="h-screen w-screen"><img className="h-full w-full object-cover" src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif" alt="not found" /></div>
      <div className=" flex flex-col justify-end h-screen absolute top-0 w-full " >
        <div className="h-[30%] w-full bg-white  relative ">
          <h4 className="absolute right-0 top-3 opacity-0" ref={panelOption}><i className="ri-arrow-down-wide-line" onClick={() => setPanelOpen(false)}></i></h4>
          <h4 className='font-semibold text-2xl my-3 mx-2'>Find a trip</h4>
          <form className="relative" onSubmit={(e) => { submitHandler(e) }}>
            <div className="line absolute top-[15%] left-6 h-16 w-1 bg-gray-700"></div>
            <div className="flex gap-2">
            <input type="text" onClick={() => setPanelOpen(true)} className="text-base px-12 py-2 my-2 bg-[#eee]  w-[93%] mx-4 rounded-lg" placeholder="Enter your source loc.." />
             
            </div>
            <input type="text" onClick={() => setPanelOpen(true)} className="text-base px-12 py-2 mx-4 bg-[#eee]  w-[93%] rounded-lg" placeholder="Enter your destination loc.."  value={transcript}
      />
            <button type="submit" onClick={() => { setShowVehicles(true); setPanelOpen(false) }} className="flex items-center justify-center bg-black p-2 text-amber-50 text-base rounded-lg mx-4 my-2 w-[93%]">See Prices</button>
          </form>
        </div>
        <div className="bg-white h-0" ref={panel}>
          <LocationSearchPanel />
        </div>
      </div>

      <div className="translate-y-full py-3 flex flex-col gap-3 fixed bottom-0 bg-white w-screen" ref={vehicles} >
        <Vehicle setShowVehicles={setShowVehicles} setConfirmRide={setConfirmRide} />
      </div>

      <div className="translate-y-full py-3 flex flex-col gap-3 fixed bottom-0 bg-white w-screen" ref={confirmRideRef} >
        <ConfirmRide setConfirmRide={setConfirmRide} setVehicleFound={setVehicleFound} />
      </div>

      <div className="translate-y-full py-3 flex flex-col gap-3 fixed bottom-0 bg-white w-screen" ref={vehicleFoundRef} >
        <LookingForDriver setVehicleFound={setVehicleFound} />
      </div>

      <div className=" translate-y-full py-3 flex flex-col gap-3 fixed bottom-0 bg-white w-screen" ref={driverPanelRef} >
        <Driver setDriverPanel={setDriverPanel} />
      </div>
    </div>
  )
}

export default Home