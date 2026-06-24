import React, { useEffect, useState, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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

  // Update form when user context loads
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
      
      // Update global context with new user data
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
    <>
      {/* left column: profile card */}
      <aside className="lg:col-span-4">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 text-center sm:text-left text-foreground">Profile Information</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gradient-primary overflow-hidden shrink-0 relative group">
              <img src={user?.avatar || "/download.jpg"} alt="profile" className={`w-full h-full object-cover ${isUploadingAvatar ? 'opacity-50' : ''}`} />
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs">Uploading...</span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-xl text-foreground">{user?.name || 'Guest'}</p>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not logged in'}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center sm:justify-start items-center sm:items-start">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                  Change Photo
                </Button>
                {user?.avatar && (
                  <Button size="sm" variant="outline-danger" onClick={handleAvatarRemove} disabled={isUploadingAvatar}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* right column: form */}
      <section className="lg:col-span-8">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-card rounded-2xl p-6 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                disabled={true} // Email is usually disabled in settings unless there's a specific flow
              />
              <ControlledTextField
                field={{ name: "phone" }}
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-sm font-medium">
                {saveSuccess && <span className="text-green-400">Profile saved successfully!</span>}
              </div>
              <Button 
                type="submit" 
                disabled={isSaving || !isDirty} 
                className="w-full sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </section>
    </>
  );
}
