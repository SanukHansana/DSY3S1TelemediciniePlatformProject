import axios from "axios";

const API = "http://localhost:5000/admin";

export const getUsers = () => {
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

export const deleteUser = (id) => {
  const token = localStorage.getItem("token");

  return axios.delete(`http://localhost:5000/admin/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const updateUser = (id, data) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `http://localhost:5000/admin/users/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};