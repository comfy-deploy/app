"use client";

import * as React from "react";
import { useOrganizationList } from "@clerk/clerk-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserIcon } from "./run/SharePageComponent";
import { cn } from "@/lib/utils";
import { Users, X } from "lucide-react";

interface UserFilterSelectProps {
  onFilterChange: (userIds: string) => void;
}

export function UserFilterSelect({ onFilterChange }: UserFilterSelectProps) {
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: true,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded || !userMemberships || userMemberships.count === 0) return null;

  const currentOrg = userMemberships.data[0]?.organization;
  const currentOrgMembers = currentOrg?.memberships?.data || [];
  
  const members = currentOrgMembers.map((membership: any) => ({
    id: membership.publicUserData?.userId || "",
    name: membership.publicUserData?.firstName
      ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName || ""}`
      : membership.publicUserData?.identifier || "Unknown",
  }));

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSelection = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      
      // Call the callback with the updated selection
      onFilterChange(newSelection.join(","));
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedUsers([]);
    onFilterChange("");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2",
            selectedUsers.length > 0 && "border-primary"
          )}
        >
          <Users className="h-4 w-4" />
          {selectedUsers.length > 0 ? (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selectedUsers.length}
            </Badge>
          ) : (
            "Filter by user"
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by user</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-60 overflow-auto">
          {members.map((member: any) => (
            <DropdownMenuItem
              key={member.id}
              className="flex items-center gap-2 px-2"
              onSelect={(e: React.MouseEvent) => {
                e.preventDefault();
                toggleUser(member.id);
              }}
            >
              <Checkbox
                id={`user-${member.id}`}
                checked={selectedUsers.includes(member.id)}
                onCheckedChange={() => toggleUser(member.id)}
              />
              <div className="flex items-center gap-2 truncate">
                <UserIcon user_id={member.id} className="h-4 w-4" />
                <span className="truncate">{member.name}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {selectedUsers.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center justify-center text-destructive"
              onSelect={(e: React.MouseEvent) => {
                e.preventDefault();
                clearSelection();
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Clear selection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
