'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';

const Home = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-24'>
        <span className='text-lg font-semibold animate-pulse'>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <div className='flex flex-1 flex-col items-center justify-center p-24'>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10 flex flex-col items-center'>
          <h1 className='text-3xl font-bold mb-2 text-gray-900 dark:text-white'>
            Welcome to GexChat
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            You are logged in. Enjoy chatting!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
