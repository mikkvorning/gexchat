import React from 'react';

const Sidebar = () => {
  return (
    <aside className='flex flex-col h-full w-20 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm'>
      <div className='flex-1 flex flex-col items-center justify-between py-4'>
        {/* Top section for future nav/chat list */}
        <div className='flex-1 w-full flex flex-col items-center h100'></div>
        {/* Bottom section for settings */}
      </div>
    </aside>
  );
};

export default Sidebar;
