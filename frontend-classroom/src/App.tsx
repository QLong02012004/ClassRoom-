import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastProvider } from './components/Styles/ToastContext';
import { AuthProvider } from './context/AuthContext';

import { HeroUIProvider } from "@heroui/system";

function App() {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}

export default App;