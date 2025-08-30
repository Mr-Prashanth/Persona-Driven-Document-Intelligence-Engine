import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/userContext";

export const OAuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUsername } = useUser();

  useEffect(() => {
    const name = searchParams.get("name");
    const chatId=searchParams.get("chatId");
    if (name) {
      setUsername(name); // ✅ username from backend redirect
      localStorage.setItem("chatId",chatId)
      console.log(localStorage.getItem("chatId"))
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [navigate, searchParams, setUsername]);

  return <div>Signing you in...</div>;
}