import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white mt-5">
      <div className="text-center">
        <h1 className="text-[10rem] font-extrabold text-red-600 mb-8 drop-shadow-xl">403</h1>
        <p className="text-4xl text-gray-700 mb-12">Oops! You don’t have permission to access this page.</p>
        <Link
          to="/"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
