import { RouterProvider } from "react-router-dom";
import router from "./routers";
import { Toaster } from "@/components/ui/sonner";

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
};

export default App;
