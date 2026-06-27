import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Shield } from 'lucide-react';
import ControlledToggle from '../ui/ControlledToggle';
import { useUser } from '../../context/UserContext';
import api from '../../utils/api';

export default function SecuritySettings() {
  const { user, updateUserContext } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm({
    defaultValues: {
      requiresTwoFactorAuth: false
    }
  });

  const { isDirty } = methods.formState;

  useEffect(() => {
    if (user) {
      methods.reset({
        requiresTwoFactorAuth: user.requiresTwoFactorAuth || false
      });
    }
  }, [user, methods]);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      
      const response = await api.put('/auth/me', {
        requiresTwoFactorAuth: data.requiresTwoFactorAuth
      });
      
      if (response.data?.data?.user) {
        updateUserContext(response.data.data.user);
      }
      
      // We manually reset form state to match the new saved data so isDirty becomes false
      methods.reset({ requiresTwoFactorAuth: data.requiresTwoFactorAuth });
    } catch (error) {
      console.error("Failed to update security settings", error);
      // Revert the toggle on error
      methods.reset({ requiresTwoFactorAuth: user?.requiresTwoFactorAuth || false });
    } finally {
      setIsSaving(false);
    }
  };

  // Automatically save when toggle changes
  useEffect(() => {
    if (isDirty) {
      methods.handleSubmit(onSubmit)();
    }
  }, [isDirty]);

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-green-500/10 transition-colors duration-500" />
      
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-shadow">
          <Shield className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="font-bold text-xl text-white">Security Settings</h2>
          <p className="text-sm text-gray-400">Manage your account protection</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <FormProvider {...methods}>
          <form className="space-y-4">
            <ControlledToggle
              field={{ name: "requiresTwoFactorAuth" }}
              label="Require OTP on Login"
              wrapperClassName="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-2xl p-4"
            />
          </form>
        </FormProvider>
        
        <div className="h-6 mt-4 flex items-center justify-center">
          {isSaving && (
            <div className="text-sm font-medium text-green-400 animate-pulse flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" />
              Updating preferences...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
