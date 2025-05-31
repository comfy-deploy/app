"use client";

import * as React from "react";
import { useOrganization } from "@clerk/clerk-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useLocalStorage } from "@/hooks/use-local-storage";

interface UserFilterSelectProps {
  onFilterChange: (userIds: string) => void;
  singleSelect?: boolean;
}

interface Member {
  id: string;
  name: string;
}

export function UserFilterSelect({
  onFilterChange,
  singleSelect = false,
}: UserFilterSelectProps) {
  const { organization, isLoaded } = useOrganization({
    memberships: true,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const storageKey = organization
    ? `workflow-user-filter-${organization.id}${singleSelect ? "-single" : ""}`
    : "";
  const [selectedUsers, setSelectedUsers] = useLocalStorage<string[]>(
    storageKey,
    [],
  );

  const selectedMembers = useMemo(() => {
    return members.filter((member) => selectedUsers.includes(member.id));
  }, [members, selectedUsers]);

  const maxVisibleBadges = 2;
  const visibleBadges = selectedMembers.slice(0, maxVisibleBadges);
  const hiddenCount = selectedMembers.length - maxVisibleBadges;

  useEffect(() => {
    if (selectedUsers.length > 0) {
      onFilterChange(selectedUsers.join(","));
    } else {
      onFilterChange("");
    }
  }, [selectedUsers, onFilterChange]);

  if (!isLoaded || !organization) return null;

  React.useEffect(() => {
    if (!organization) return;

    const fetchAllMembers = async () => {
      try {
        // Initial request with larger page size to minimize API calls
        const response = await organization.getMemberships({
          pageSize: 100, // Use a large page size to reduce requests
        });

        // Get total count if available
        const totalMembers = response.total_count || 0;
        const membersList = response.data || [];

        let formattedMembers = membersList.map((membership: any) => ({
          id: membership.publicUserData?.userId || "",
          name: membership.publicUserData?.firstName
            ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName || ""}`
            : membership.publicUserData?.identifier || "Unknown",
        }));

        // If we didn't get all members in first request, fetch remaining pages
        if (totalMembers > membersList.length) {
          const remainingPages = Math.ceil(
            (totalMembers - membersList.length) / 100,
          );

          // Use Promise.all to fetch remaining pages in parallel
          const remainingRequests = Array.from(
            { length: remainingPages },
            (_, i) =>
              organization.getMemberships({
                initialPage: i + 2, // Start from page 2
                pageSize: 100,
              }),
          );

          const results = await Promise.all(remainingRequests);

          // Process and append all remaining members
          for (const result of results) {
            const pageMembers = result.data || [];
            formattedMembers = [
              ...formattedMembers,
              ...pageMembers.map((membership: any) => ({
                id: membership.publicUserData?.userId || "",
                name: membership.publicUserData?.firstName
                  ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName || ""}`
                  : membership.publicUserData?.identifier || "Unknown",
              })),
            ];
          }
        }

        setMembers(formattedMembers);
      } catch (error) {
        console.error("Error fetching organization members:", error);
        setMembers([]);
      }
    };

    fetchAllMembers();
  }, [organization]);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      if (singleSelect) {
        // In single select mode, replace selection or clear if same user clicked
        return prev.includes(userId) ? [] : [userId];
      } else {
        // Multi-select mode (original behavior)
        return prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Display badges for selected users - only in multi-select mode */}
      {!singleSelect && selectedUsers.length > 0 && (
        <div className="mr-2 flex flex-wrap gap-1">
          {visibleBadges.map((member) => (
            <Badge
              key={member.id}
              variant="outline"
              className="flex items-center gap-1 px-2 py-1"
            >
              <UserIcon user_id={member.id} className="h-3 w-3" />
              <span className="max-w-[100px] truncate">{member.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
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
              selectedUsers.length > 0 && "border-primary",
            )}
          >
            <Users className="h-4 w-4" />
            {selectedUsers.length > 0 ? (
              singleSelect ? (
                <span className="truncate max-w-[100px]">
                  {selectedMembers[0]?.name || "User"}
                </span>
              ) : (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedUsers.length}
                </Badge>
              )
            ) : singleSelect ? (
              "Select User"
            ) : (
              "Filter"
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {singleSelect ? "Select user" : "Filter by user"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-60">
            <DropdownMenuGroup>
              {singleSelect ? (
                <RadioGroup
                  value={selectedUsers[0] || ""}
                  onValueChange={(value) => toggleUser(value)}
                >
                  {members.map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      className="flex items-center gap-2 px-2"
                      onSelect={(event: Event) => {
                        event.preventDefault();
                        toggleUser(member.id);
                      }}
                    >
                      <RadioGroupItem
                        value={member.id}
                        id={`user-${member.id}`}
                      />
                      <div className="flex items-center gap-2 truncate">
                        <UserIcon user_id={member.id} className="h-4 w-4" />
                        <span className="truncate">{member.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </RadioGroup>
              ) : (
                <>
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
                </>
              )}
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
