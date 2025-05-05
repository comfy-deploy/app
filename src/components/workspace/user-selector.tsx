import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganization } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

interface UserSelectorProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
}

interface OrgUser {
  id: string;
  name: string;
}

export function UserSelector({
  selectedUsers,
  onSelectionChange,
}: UserSelectorProps) {
  const { organization, isLoaded } = useOrganization();
  
  const [users, setUsers] = useState<OrgUser[]>([]);
  
  useEffect(() => {
    if (!isLoaded || !organization) return;
    
    organization.getMemberships().then((response) => {
      const memberships = response.data || [];
      
      const orgUsers: OrgUser[] = memberships.map((membership: any) => {
        const { userId, firstName, lastName, identifier } = membership.publicUserData;
        return {
          id: userId || "",
          name: firstName && lastName
            ? `${firstName} ${lastName}`
            : identifier || "",
        };
      }).filter((user: OrgUser) => user.id !== ""); // Filter out any users with empty IDs
      
      setUsers(orgUsers);
    }).catch((error) => {
      console.error("Error fetching organization members:", error);
    });
  }, [isLoaded, organization]);
  
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
      {users.length === 0 && (
        <div className="text-sm text-muted-foreground">No users found in this organization</div>
      )}
    </div>
  );
}
