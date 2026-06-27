import React from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { Plus, Calendar as CalendarIcon, Clock, Video } from 'lucide-react';
import ModalWrapper from './ui/ModalWrapper';
import ControlledTextField from './ui/ControlledTextField';
import ControlledTextArea from './ui/ControlledTextArea';
import ControlledToggle from './ui/ControlledToggle';
import Select from './ui/Select';
import Button from './ui/Button';

const ScheduleMeetingModal = ({
  open,
  onClose,
  onSubmit,
  displayDate,
  selectedDate,
  year,
  creating
}) => {
  const methods = useForm({
    defaultValues: {
      title: '',
      description: '',
      startTime: '11:00',
      endTime: '12:00',
      isMeeting: true,
      recurrence: 'None',
      recurrenceEndDate: ''
    }
  });

  const { handleSubmit, control, reset, watch } = methods;
  const currentRecurrence = watch('recurrence');

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <ModalWrapper
      open={open}
      onClose={handleModalClose}
      showAnimation={true}
      className="md:w-[500px]"
    >
      <div className="flex flex-col max-h-[85vh]">
        <div className="p-5 md:px-6 pt-6 pb-3 shrink-0 bg-card z-10 rounded-t-3xl border-b border-border/40">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-foreground">
              <div className="w-1.5 h-6 md:h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              New Meeting
            </h2>
            <Button variant="glass" size="icon" onClick={handleModalClose} className="hover:bg-muted border-border">
              <Plus className="w-5 h-5 rotate-45 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="p-5 md:px-6 pb-6 pt-3 overflow-y-auto hide-scrollbar">
          <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <ControlledTextField
            field={{ name: 'title', label: 'Meeting Title', validation: { required: 'Title is required' } }}
            placeholder="E.g., Team Sync"
          />
          
          <ControlledTextArea
            field={{ name: 'description', label: 'Description' }}
            placeholder="Optional context for the meeting..."
            inputClassName="h-24 resize-none"
          />

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-3.5 bg-card/50 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium mb-0.5">Date</span>
                  <span className="text-sm font-semibold text-foreground">
                    {displayDate.toLocaleString('default', { month: 'short' })} {selectedDate}, {year}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-3.5 bg-card/50 rounded-xl border border-border flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col w-full">
                <span className="text-xs text-muted-foreground font-medium mb-0.5">Time</span>
                <div className="flex items-center gap-2 flex-1 relative">
                  <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <input {...field} type="time" className="bg-transparent text-sm font-semibold outline-none text-foreground w-[75px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" />
                      </div>
                    )}
                  />
                  <span className="text-muted-foreground font-bold">-</span>
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <input {...field} type="time" className="bg-transparent text-sm font-semibold outline-none text-foreground w-[75px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <ControlledToggle
              field={{ name: 'isMeeting' }}
              label="Add Video Room"
              icon={(val) => <Video className="w-4 h-4" />}
              wrapperClassName="flex-1 p-3.5 bg-card/50 rounded-xl border border-border hover:border-primary/30 transition-colors"
            />
            
            <div className="flex-1 p-3.5 bg-card/50 rounded-xl border border-border flex items-center justify-between transition-colors hover:border-primary/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Repeat</span>
              </div>
              <Controller
                name="recurrence"
                control={control}
                render={({ field }) => (
                  <div className="w-[110px]">
                    <Select
                      options={[
                        { label: 'None', value: 'None' },
                        { label: 'Daily', value: 'Daily' },
                        { label: 'Weekly', value: 'Weekly' },
                        { label: 'Monthly', value: 'Monthly' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      className="border-none bg-transparent hover:bg-transparent shadow-none px-0 py-0 h-auto focus:ring-0 focus:border-transparent !bg-transparent min-h-0 outline-none w-full justify-end"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {currentRecurrence !== 'None' && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 hidden md:block" />
              <div className="flex-1 p-3.5 bg-card/50 rounded-xl border border-border flex items-center justify-between transition-colors hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Until</span>
                </div>
                <Controller
                  name="recurrenceEndDate"
                  control={control}
                  rules={{ required: 'End date is required for repeating events' }}
                  render={({ field }) => (
                    <div className="relative flex-1 flex justify-end">
                      <input 
                        {...field} 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-transparent text-sm font-semibold outline-none text-foreground cursor-pointer text-right w-[130px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button 
              type="submit"
              variant="none" 
              size="none"
              disabled={creating}
              className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary/90 shadow-[0_8px_30px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {creating ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </FormProvider>
      </div>
      </div>
    </ModalWrapper>
  );
};

export default ScheduleMeetingModal;
