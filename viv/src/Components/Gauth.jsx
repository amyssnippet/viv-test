import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import toast from 'react-hot-toast';
import Cookies from "js-cookie";
import BACKENDURL from "./urls";

export const GoogleAuth = () => {
    const handleSuccess = async (cred) => {
        const decoded = jwtDecode(cred.credential);
        const { sub: providerId, email, name, picture: profile } = decoded;

        const res = await axios.post(`${BACKENDURL}/social-auth`, {
            provider: 'google',
            providerId,
            email,
            name,
            profile
        });

        console.log("Token:", res.data.token);
        Cookies.set("authToken", res.data.token, { expires: 7 });
        toast.success("Login successful");
        window.location.href = "/";
    };

    return <GoogleLogin onSuccess={handleSuccess} onError={() => console.log("Login Failed")} />;
};
