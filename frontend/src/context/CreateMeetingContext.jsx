import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { CreateMeetingModal } from '../component/meeting/CreateMeetingModal';

const CreateMeetingContext = createContext();

export function CreateMeetingProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateMeeting = async ({ title, description }) => {
    try {
      const response = await api.post('/meetings', { title, description });
      const newId = response.data.meeting.roomId;
      setIsModalOpen(false);
      navigate(`/meeting/${newId}`);
    } catch (err) {
      console.error("Failed to create meeting", err);
      alert("Failed to create meeting.");
    }
  };

  const openCreateMeeting = () => setIsModalOpen(true);
  const closeCreateMeeting = () => setIsModalOpen(false);

  return (
    <CreateMeetingContext.Provider value={{ openCreateMeeting, closeCreateMeeting }}>
      {children}
      <CreateMeetingModal 
        isOpen={isModalOpen} 
        onClose={closeCreateMeeting} 
        onCreate={handleCreateMeeting} 
      />
    </CreateMeetingContext.Provider>
  );
}

export const useCreateMeeting = () => useContext(CreateMeetingContext);
