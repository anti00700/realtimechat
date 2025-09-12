import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  contacts: [],
  messages: [],
  activeChat: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
  },
});

export const { setContacts, addMessage, setActiveChat, setMessages } = chatSlice.actions;
export default chatSlice.reducer;