import axios from "axios";

let url = location.protocol + "//" + location.host + "/api";
// Check if AGDEBUGGER_FRONTEND_API_URL exists in the environment variables
if (import.meta.env.VITE_AGDEBUGGER_FRONTEND_API_URL) {
  url = import.meta.env.VITE_AGDEBUGGER_FRONTEND_API_URL;
}
export const api = axios.create({
  baseURL: url,
});

export const step = async (effectFn: () => void) => {
  api
    .post("/step")
    .then((response) => {
      console.log("Message processed:", response.data);
      effectFn();
    })
    .catch((error) => console.error("Error processing next:", error));
};
