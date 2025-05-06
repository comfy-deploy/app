"use client";

import * as React from "react";
import { useOrganization } from "@clerk/clerk-react";
import { useState, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserFilterSelectProps {
  onFilterChange: (userIds: string) => void;
}

interface Member {
  id: string;
  name: string;
}

export function UserFilterSelect({ onFilterChange }: UserFilterSelectProps) {
  const { organization, isLoaded } = useOrganization({
    memberships: true,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  
  const selectedMembers = useMemo(() => {
    return members.filter(member => selectedUsers.includes(member.id));
  }, [members, selectedUsers]);
  
  const maxVisibleBadges = 2;
  const visibleBadges = selectedMembers.slice(0, maxVisibleBadges);
  const hiddenCount = selectedMembers.length - maxVisibleBadges;

  if (!isLoaded || !organization) return null;

  React.useEffect(() => {
    if (!organization) return;
    
    const fetchMembers = async () => {
      try {
        const response = await organization.getMemberships();
        const membersList = response.data || [];
        
        const formattedMembers = membersList.map((membership: any) => ({
          id: membership.publicUserData?.userId || "",
          name: membership.publicUserData?.firstName
            ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName || ""}`
            : membership.publicUserData?.identifier || "Unknown",
        }));
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error("Error fetching organization members:", error);
        setMembers([]);
      }
    };
    
    fetchMembers();
  }, [organization]);

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
    <div className="flex items-center gap-2">
      {/* Display badges for selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1 mr-2">
          {visibleBadges.map((member) => (
            <Badge 
              key={member.id} 
              variant="outline" 
              className="flex items-center gap-1 px-2 py-1"
            >
              <UserIcon user_id={member.id} className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{member.name}</span>
              <button 
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleUser(member.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="outline" className="px-2 py-1">
              +{hiddenCount} more
            </Badge>
          )}
        </div>
      )}
      
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
          <ScrollArea className="h-60">
            <DropdownMenuGroup>
              {members.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  className="flex items-center gap-2 px-2"
                  onSelect={(event: Event) => {
                    event.preventDefault();
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
          </ScrollArea>
          {selectedUsers.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-center text-destructive"
                onSelect={(event: Event) => {
                  event.preventDefault();
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
    </div>
  );
}
