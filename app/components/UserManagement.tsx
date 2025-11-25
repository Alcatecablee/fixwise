import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tier: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive' | 'pending';
  lastSeen: string;
  permissions: string[];
}

interface UserManagementProps {
  teamId: string;
  currentUser: any;
}

export default function UserManagement({ teamId, currentUser }: UserManagementProps) {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members from data store
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual data store call
        // const members = await dataStore.getTeamMembers(teamId);
        // setTeamMembers(members);
        
        // Temporary fallback - remove in production
        setTeamMembers([]);
        setError('Team management not yet implemented');
             } catch (err) {
         setError('Failed to load team members');
         // TODO: Add proper logging when logMessage is available
       } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [teamId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>{error}</p>
            <p className="text-sm mt-2">Team management features coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          User Management
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage team members, roles, and permissions
        </p>
      </div>
      
      <div className="p-6">
        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800">Total Members</h3>
            <p className="text-2xl font-bold text-blue-900">{teamMembers.length}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">Active Members</h3>
            <p className="text-2xl font-bold text-green-900">
              {teamMembers.filter(m => m.status === 'active').length}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800">Admins</h3>
            <p className="text-2xl font-bold text-purple-900">
              {teamMembers.filter(m => m.role === 'admin' || m.role === 'owner').length}
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-800">Pending</h3>
            <p className="text-2xl font-bold text-orange-900">
              {teamMembers.filter(m => m.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Invite New Member */}
        <div className="mb-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Invite Team Member
          </button>
        </div>

        {/* Members Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Members
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {member.firstName?.[0] || member.email[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstName ? `${member.firstName} ${member.lastName || ''}` : member.email}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'owner' 
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : member.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {member.tier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.lastSeen).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permissions Management */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Role Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Owner</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Full system access</li>
                <li>Team management</li>
                <li>Billing management</li>
                <li>All analysis features</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Admin</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Team member management</li>
                <li>Project management</li>
                <li>All analysis features</li>
                <li>Report generation</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Member</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Code analysis</li>
                <li>Project creation</li>
                <li>Basic reporting</li>
                <li>Personal settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 