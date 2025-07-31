import axios from 'axios';

// Use the correct server's LAN IP address
const BASE_URL = 'http://192.168.50.253:3005';

export const washItem = async (item: any) => {
  try {
    // Add new item to washedLinenItems array
    await axios.post(`${BASE_URL}/washedLinenItems`, {
      ...item,
      washedAt: new Date().toISOString() // Add timestamp when item was washed
    });
    return true;
  } catch (error) {
    console.error('Error washing item:', error);
    throw error;
  }
};

export const getWashedItems = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/washedLinenItems`);
    return response.data || [];
  } catch (error) {

    console.error('Error getting washed items:', error);
    
    throw error;
  }
};

export const disposeItem = async (item: any) => {
  try {
    await axios.post(`${BASE_URL}/DisposeItems`, {
      ...item,
      disposedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error disposing item:', error);
    throw error;
  }
};

export const deleteLinenItem = async (id: number) => {
  try {
    await axios.delete(`${BASE_URL}/Wash-Item-Data/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting linen item:', error);
    throw error;
  }
}; 