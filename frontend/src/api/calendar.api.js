import api from './config';

export const calendarApi = {
  getTasks: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/calendar/tasks?${queryParams}`);
  },
  getEvents: (date) => api.get(`/calendar/events?date=${date}`),
};