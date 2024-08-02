import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@mui/material';

export default function Logout() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return <Button onClick={handleLogout} variant="contained">Logout</Button>;
}
