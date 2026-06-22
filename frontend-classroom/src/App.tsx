import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastProvider } from './components/Styles/ToastContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;