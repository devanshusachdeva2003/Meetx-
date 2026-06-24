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
    <div className="bg-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-green-500/10 transition-colors" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <Shield className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h4 className="font-bold text-lg text-foreground">Security</h4>
          <p className="text-sm text-muted-foreground">Manage your account protection</p>
        </div>
      </div>

      <div className="relative z-10">
        <FormProvider {...methods}>
          <form className="space-y-4">
            <ControlledToggle
              field={{ name: "requiresTwoFactorAuth" }}
              label="Require OTP Verification on Login"
              wrapperClassName="bg-background border-border hover:bg-muted transition-colors"
            />
          </form>
        </FormProvider>
      </div>
      
      {isSaving && (
        <div className="mt-4 text-xs font-medium text-green-400 text-center animate-pulse relative z-10">
          Updating security preferences...
        </div>
      )}
    </div>
  );
}
