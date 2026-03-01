import axios from 'axios';

const API_BASE = '/api';

export const processTranscript = async (transcript, currentState) => {
    const response = await axios.post(`${API_BASE}/process`, {
        transcript,
        currentState
    });
    return response.data;
};

export const extractDocument = async (imageFile, currentState) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (currentState) {
        formData.append('currentState', JSON.stringify(currentState));
    }
    const response = await axios.post(`${API_BASE}/extract-doc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const generatePdf = async (formData, sessionId) => {
    const response = await axios.post(`${API_BASE}/generate-pdf`, {
        formData,
        sessionId
    }, {
        responseType: 'blob'
    });
    return response.data;
};
