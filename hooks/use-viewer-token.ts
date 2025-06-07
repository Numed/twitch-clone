import { toast } from "sonner";
import { useEffect, useState } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { createViewerToken } from "@/actions/token";

export const useViewerToken = (hostIdentity: string) => {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");

  useEffect(() => {
    const createToken = async () => {
      try {
        const viewrToken = await createViewerToken(hostIdentity);
        
        if (viewrToken) {
          setToken(viewrToken);

          const decodedToken = jwtDecode(viewrToken) as JwtPayload & {
            name?: string;
          };
          const name = decodedToken?.name;
          const identity = decodedToken.sub;

          if (identity) {
            setIdentity(identity);
          }
          if (name) {
            setName(name);
          }
        }
      } catch (e) {
        toast.error("Failed to create token");
      }
    };

    createToken();
  }, [hostIdentity]);

  return { token, name, identity };
};
