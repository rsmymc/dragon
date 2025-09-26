
import api from "./api";

export async function fetchTeams(params = {}) {
  // params is optional if you later add pagination/filtering
  const { data } = await api.get("/team/", { params });
  return data;
}
export async function createTeam(teamData) {
  const { data } = await api.post("/team/", teamData);
  return data;
}

export async function updateTeam(id, teamData) {
  const { data } = await api.put(`/team/${id}/`, teamData);
  return data;
}

export async function deleteTeam(id) {
  await api.delete(`/team/${id}/`);
}

export async function fetchTeam(id) {
  const { data } = await api.get(`/team/${id}/`);
  return data;
}
