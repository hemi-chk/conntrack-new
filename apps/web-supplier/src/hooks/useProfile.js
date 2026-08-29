import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useProfile = () => useContext(AuthContext);
