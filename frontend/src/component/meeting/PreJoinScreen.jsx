import React, { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Button from "../ui/Button";
import ControlledTextField from "../ui/ControlledTextField";
import ControlledToggle from "../ui/ControlledToggle";
import ControlledSelect from "../ui/ControlledSelect";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export function PreJoinScreen({ name, onJoin }) {
  const methods = useForm({
    defaultValues: {
      username: name || "",
      videoEnabled: true,
      audioEnabled: true,
      videoDeviceId: "",
      audioDeviceId: "",
      speakerDeviceId: ""
    }
  });

  const videoRef = useRef(null);
  
  const videoEnabled = methods.watch("videoEnabled");
  const audioEnabled = methods.watch("audioEnabled");
  
  const [devices, setDevices] = useState({ video: [], audio: [], speaker: [] });
  const selectedVideo = methods.watch("videoDeviceId");

  // Enumerate devices
  useEffect(() => {
    async function getDevices() {
      try {
        // Request permissions first to get real device labels
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(t => t.stop());
        
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const video = allDevices.filter(d => d.kind === "videoinput").map(d => ({ label: d.label || "Camera", value: d.deviceId }));
        const audio = allDevices.filter(d => d.kind === "audioinput").map(d => ({ label: d.label || "Microphone", value: d.deviceId }));
        const speaker = allDevices.filter(d => d.kind === "audiooutput").map(d => ({ label: d.label || "Speaker", value: d.deviceId }));
        
        setDevices({ video, audio, speaker });
        if (video.length > 0 && !methods.getValues("videoDeviceId")) methods.setValue("videoDeviceId", video[0].value);
        if (audio.length > 0 && !methods.getValues("audioDeviceId")) methods.setValue("audioDeviceId", audio[0].value);
        if (speaker.length > 0 && !methods.getValues("speakerDeviceId")) methods.setValue("speakerDeviceId", speaker[0].value);
      } catch (err) {
        console.error("Device access denied or error enumerating:", err);
      }
    }
    getDevices();
  }, []);

  // Handle Video Preview
  useEffect(() => {
    let activeStream = null;
    
    async function startPreview() {
      if (!videoEnabled) {
        if (videoRef.current) videoRef.current.srcObject = null;
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error starting video preview:", err);
      }
    }
    
    startPreview();
    
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoEnabled, selectedVideo]);

  const onSubmit = (data) => {
    if (data.username.trim()) {
      onJoin({
        name: data.username.trim(),
        videoEnabled: data.videoEnabled,
        audioEnabled: data.audioEnabled,
        videoDeviceId: data.videoDeviceId,
        audioDeviceId: data.audioDeviceId
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0C10] text-white p-4 py-8 md:p-8">
      <div className="bg-card w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Preview */}
        <div className="lg:w-3/5 bg-black/40 relative aspect-video lg:aspect-auto flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 min-h-[300px]">
          {videoEnabled ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/40">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                <VideoOff className="w-10 h-10" />
              </div>
              <p className="font-medium">Camera is off</p>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 flex gap-3">
             <button 
                type="button"
                onClick={() => methods.setValue('audioEnabled', !audioEnabled)}
                className={`p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg transition-all ${audioEnabled ? 'bg-black/50 hover:bg-black/70 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
             >
               {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
             </button>
             <button 
                type="button"
                onClick={() => methods.setValue('videoEnabled', !videoEnabled)}
                className={`p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg transition-all ${videoEnabled ? 'bg-black/50 hover:bg-black/70 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
             >
               {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
             </button>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="lg:w-2/5 p-6 md:p-8 flex flex-col justify-center bg-card max-h-[85vh] lg:max-h-[90vh] overflow-y-auto hide-scrollbar">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to join?</h2>
          <p className="text-white/60 mb-6 text-sm">Configure your settings before entering.</p>
          
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
              
              <ControlledTextField
                field={{
                  name: "username",
                  label: "Your Name",
                  placeholder: "John Doe",
                  validation: { required: "Name is required" }
                }}
                autoFocus
              />

              <ControlledToggle
                field={{ name: "audioEnabled" }}
                label="Microphone"
                icon={(val) => val ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              />

              <ControlledToggle
                field={{ name: "videoEnabled" }}
                label="Camera"
                icon={(val) => val ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              />

              <div className="flex flex-col gap-3 mt-2">
                <ControlledSelect 
                  field={{ name: "audioDeviceId" }}
                  label="Microphone" 
                  options={devices.audio} 
                  disabled={devices.audio.length === 0}
                />
                <ControlledSelect 
                  field={{ name: "videoDeviceId" }}
                  label="Camera" 
                  options={devices.video} 
                  disabled={devices.video.length === 0}
                />
                <ControlledSelect 
                  field={{ name: "speakerDeviceId" }}
                  label="Speaker" 
                  options={devices.speaker} 
                  disabled={devices.speaker.length === 0}
                />
              </div>
              
              <div className="pt-4 mt-2 border-t border-white/10">
                <Button
                  type="submit"
                  disabled={!methods.watch("username")?.trim()}
                  className="w-full h-12 text-base shadow-primary/25"
                  size="lg"
                >
                  Join Room
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>

      </div>
    </div>
  );
}
