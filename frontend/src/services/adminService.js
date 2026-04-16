import axios from "axios";

const API = "http://localhost:5000/admin";

export const getDoctors = () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const verifyDoctor = (id) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `${API}/verify-doctor/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};