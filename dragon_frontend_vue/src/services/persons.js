import api from "./api";

export async function fetchPersons(params = {}) {
  // params is optional if you later add pagination/filtering
  const { data } = await api.get("/person/", { params });
  return data;
}

export async function fetchPerson(id) {
  const { data } = await api.get(`/person/${id}/`);
  return data;
}

export async function createPerson(personData) {
  const { data } = await api.post("/person/", personData);
  return data;
}

export async function updatePerson(id, personData) {
  const { data } = await api.put(`/person/${id}/`, personData);
  return data;
}

export async function deletePerson(id) {
  await api.delete(`/person/${id}/`);
}


