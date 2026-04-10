import axios from 'axios';

export const getAllEvents = async () => {   
    try {
        const response = await axios.get(import.meta.env.VITE_BASE_URL + '/api/event/get-all-events');
        return response.data;
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
}


