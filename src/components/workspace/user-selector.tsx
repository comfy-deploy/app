import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganizationList } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

interface UserSelectorProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
}

export function UserSelector({
  selectedUsers,
  onSelectionChange,
}: UserSelectorProps) {
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: true,
  });
  
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  
  useEffect(() => {
    if (!isLoaded || !userMemberships.data) return;
    
    const orgUsers = userMemberships.data
      .map((membership) => ({
        id: membership.publicUserData.userId || "",
        name: membership.publicUserData.firstName && membership.publicUserData.lastName
          ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName}`
          : membership.publicUserData.identifier || "",
      }))
      .filter(user => user.id !== ""); // Filter out any users with empty IDs
    
    setUsers(orgUsers);
  }, [isLoaded, userMemberships.data]);
  
  if (!isLoaded) return <div>Loading users...</div>;
  
  return (
    <div className="space-y-3 max-h-40 overflow-y-auto">
      {users.map((user) => (
        <div key={user.id} className="flex items-center space-x-2">
          <Checkbox
            id={`user-${user.id}`}
            checked={selectedUsers.includes(user.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectionChange([...selectedUsers, user.id]);
              } else {
                onSelectionChange(selectedUsers.filter(id => id !== user.id));
              }
            }}
          />
          <label
            htmlFor={`user-${user.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {user.name}
          </label>
        </div>
      ))}
    </div>
  );
}
