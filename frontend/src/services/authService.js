import axios from "axios";

const API = "/auth";

export const registerUser = (data) => axios.post(`${API}/register`, data);

export const loginUser = (data) => axios.post(`${API}/login`, data);
