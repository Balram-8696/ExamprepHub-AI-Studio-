import React, { useContext } from 'react';
import { AuthContext } from '../../../App';
import { Settings } from 'lucide-react';

const DashboardHome: React.FC = () => {
    const { userProfile } = useContext(AuthContext);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border-t-4 border-indigo-500 dark:border-indigo-400">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Settings size={32} /> Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back, <span className="font-bold">{userProfile?.email}</span>!</p>

            <div className="mt-8">
                <p className="text-lg text-gray-700 dark:text-gray-200">
                    You have access to the administrative features of ExamHub.
                </p>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Use the navigation menu on the left to manage different aspects of the application:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600 dark:text-gray-300">
                    <li><b>Manage Categories:</b> Add or organize test categories and subcategories.</li>
                    <li><b>Upload Test:</b> Create and publish new tests for your users.</li>
                    <li><b>Announcements:</b> Post important updates that will be visible to all users on the homepage.</li>
                    <li><b>UI Customization:</b> Modify parts of the user interface, such as footer links and other elements.</li>
                </ul>
            </div>
        </div>
    );
};

export default DashboardHome;