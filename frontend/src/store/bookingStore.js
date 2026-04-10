import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookingStore = create(
  persist(
    (set) => ({
      bookingInfo: {
        eventDetails: null,
        selectedSeats: [],
        price: 0,
        numberOfTickets: 0,
        categories: [],
      },
      setBookingInfo: (info) => set((state) => ({
        bookingInfo: { ...state.bookingInfo, ...info },
      })),
      clearBookingInfo: () => set({
        bookingInfo: {
          eventDetails: null,
          selectedSeats: [],
          price: 0,
          numberOfTickets: 0,
          categories: [],
        },
      }),
    }),
    {
      name: 'booking-storage', // key in storage
      getStorage: () => sessionStorage, // use sessionStorage instead of localStorage
    }
  )
);