import React, { useEffect, useState, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Camera, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import ControlledTextField from '../ui/ControlledTextField';
import { useUser } from '../../context/UserContext';
import api from '../../utils/api';

export default function ProfileSettings() {
  const { user, updateUserContext } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds the 5MB limit.");
      e.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data?.user) {
        updateUserContext(response.data.user);
      }
    } catch (error) {
      console.error("Failed to upload avatar", error);
      const backendError = error.response?.data?.message || error.message;
      alert(`Upload Error: ${backendError}`);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const response = await api.delete('/auth/me/avatar');
      if (response.data?.user) {
        updateUserContext(response.data.user);
      }
    } catch (error) {
      console.error("Failed to remove avatar", error);
      const backendError = error.response?.data?.message || error.message;
      alert(`Remove Error: ${backendError}`);
    }
  };

  const methods = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  });

  const { isDirty } = methods.formState;

  useEffect(() => {
    if (user) {
      methods.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user, methods]);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      
      const response = await api.put('/auth/me', {
        name: data.name,
        phone: data.phone
      });
      
      if (response.data?.data?.user) {
        updateUserContext(response.data.data.user);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      <h2 className="text-xl font-bold mb-8 text-white">Profile Information</h2>
      
      <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full border-2 border-white/10 overflow-hidden relative bg-background/50 ${isUploadingAvatar ? 'opacity-50' : ''}`}>
              <img 
                src={user?.avatar || "/download.jpg"} 
                alt="profile" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              
              {/* Hover Overlay */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
              >
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white/80 font-medium">Change</span>
              </div>
            </div>

            {isUploadingAvatar && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap">
                Uploading...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              className="hidden" 
            />
            {user?.avatar && (
              <button 
                onClick={handleAvatarRemove}
                disabled={isUploadingAvatar}
                className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors py-1 px-3 rounded-full hover:bg-red-400/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ControlledTextField
                  field={{ name: "name" }}
                  label="Full Name"
                  placeholder="Enter your full name"
                />
                <ControlledTextField
                  field={{ name: "email" }}
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  disabled={true} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ControlledTextField
                  field={{ name: "phone" }}
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
                <div className="text-sm font-medium h-5">
                  {saveSuccess && <span className="text-green-400 flex items-center gap-2">✓ Profile saved successfully!</span>}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSaving || !isDirty} 
                  className="w-full sm:w-auto px-8"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>

      </div>
    </div>
  );
}
