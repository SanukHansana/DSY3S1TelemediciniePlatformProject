import axios from "axios";

const API = "/admin";

export const getUsers = async () => {
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const response = await axios.get(`${API}/users`, { headers });

  await Promise.allSettled(
    (response.data || [])
      .filter((user) => user.role === "doctor" && user.isVerified)
      .map((user) =>
        axios.patch(
          `/api/doctors/${user._id}/verification`,
          { is_verified: true },
          { headers }
        )
      )
  );

  return response;
};

export const verifyDoctor = (id) => {
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  return axios
    .put(`${API}/verify-doctor/${id}`, {}, { headers })
    .then(async (response) => {
      await axios.patch(
        `/api/doctors/${id}/verification`,
        { is_verified: true },
        { headers }
      );

      return response;
    });
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
