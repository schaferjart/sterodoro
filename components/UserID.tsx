import React from 'react';

interface UserIDProps {
  userEmail: string;
}

const UserID: React.FC<UserIDProps> = ({ userEmail }) => {
  return (
    <div className="p-3 sm:p-4 rounded-lg text-sm transition-colors text-center bg-indigo-600 text-white cursor-default" title={userEmail}>
      <div className="text-xs font-medium text-indigo-200 mb-1">User ID</div>
      <div className="font-semibold truncate max-w-20 sm:max-w-28 text-xs sm:text-sm">
        {userEmail}
      </div>
    </div>
  );
};

export default UserID; 