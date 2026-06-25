import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import Button from '../ui/Button';
import ModalWrapper from '../ui/ModalWrapper';
import ControlledTextField from '../ui/ControlledTextField';
import ControlledTextArea from '../ui/ControlledTextArea';

export function CreateMeetingModal({ isOpen, onClose, onCreate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm({
    defaultValues: {
      title: '',
      description: ''
    }
  });

  useEffect(() => {
    if (!isOpen) {
      methods.reset();
    }
  }, [isOpen, methods]);

  const onSubmit = async (data) => {
    if (!data.title.trim()) return;
    setIsSubmitting(true);
    await onCreate({ title: data.title.trim(), description: data.description.trim() });
    setIsSubmitting(false);
    methods.reset();
  };

  return (
    <ModalWrapper
      open={isOpen}
      onClose={onClose}
      showAnimation={true}
      blurBackground={true}
      className="p-6 md:p-8"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create New Meeting</h2>
        <p className="text-gray-400 text-sm">Schedule a new session with your team or clients.</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
          <ControlledTextField
            field={{
              name: "title",
              label: "Meeting Title *",
              placeholder: "e.g. Weekly Sync",
              validation: { required: "Meeting title is required" }
            }}
            inputClassName="bg-input/50 border-border text-white placeholder:text-gray-500"
            autoFocus
          />

          <ControlledTextArea
            field={{
              name: "description",
              label: "Description (Optional)",
              placeholder: "What is this meeting about?",
            }}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10 mt-6">
            <Button type="button" variant="outline" className="px-5 py-2.5 rounded-xl border-white/10" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="px-6 py-2.5 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)]" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create & Join Room'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </ModalWrapper>
  );
}
