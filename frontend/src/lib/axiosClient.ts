import axios, { type AxiosInstance } from "axios";

const axiosClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
});

export default axiosClient;
