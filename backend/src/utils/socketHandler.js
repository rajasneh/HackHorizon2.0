export const socketHandler = (io, socket) => {
    // console.log('A user connected:', socket.id);

    // Handle joining event rooms
    socket.on('join', (eventId) => {
        socket.join(eventId);
        // console.log(`User ${socket.id} joined event room: ${eventId}`);
    });

    // Handle leaving event rooms
    socket.on('leave', (eventId) => {
        socket.leave(eventId);
        // console.log(`User ${socket.id} left event room: ${eventId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // console.log('User disconnected:', socket.id);
    });

    // Example event listener for booking updates
    socket.on('bookingUpdate', (data) => {
        console.log('Booking update received:', data);
        // Broadcast the booking update to all connected clients
        io.emit('bookingUpdate', data);
    }); 

    // Add more event listeners as needed 
}