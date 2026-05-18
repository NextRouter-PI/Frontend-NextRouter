import api from './api';

const uploadImage = (file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return api.post('/uploads/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

export default uploadImage;