"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useSessionAPI(machineId?: string | null) {
  return {
    createDynamicSession: useMutation({
      mutationKey: ["session", "dynamic"],
      mutationFn: async (data: any) => {
        try {
          const response = await api({
            url: "session/dynamic",
            init: {
              method: "POST",
              body: JSON.stringify({
                ...data,
              }),
            },
          });

          return response;
        } catch (e) {
          throw e;
        }
      },
    }),
    createSession: useMutation({
      mutationKey: ["session", machineId],
      mutationFn: async (data: any) => {
        console.log(data);

        try {
          const response = await api({
            url: "session",
            init: {
              method: "POST",
              body: JSON.stringify({
                machine_id: data?.machineId || machineId,
                ...data,
              }),
            },
          });

          return response;
        } catch (e) {
          throw e;
        }
      },
    }),
    deleteSession: useMutation({
      mutationKey: ["session", "delete"],
      mutationFn: async (data: {
        sessionId: string;
        waitForShutdown?: boolean;
      }) => {
        console.log(data);
        const response = await api({
          url: `session/${data.sessionId}`,
          init: {
            method: "DELETE",
          },
          params: {
            wait_for_shutdown: data.waitForShutdown,
          },
        });

        if (response.success === true) {
          const lastSessionId = sessionStorage.getItem("lastSessionId");
          if (lastSessionId === data.sessionId) {
            sessionStorage.removeItem("lastSessionId");
          }
        }

        return response;
      },
    }),
    listSession: useQuery<any[]>({
      queryKey: ["sessions"],
      queryKeyHashFn: (queryKey) => {
        return [...queryKey, machineId].join(",");
      },
      refetchInterval: 2000,
      meta: {
        params: machineId
          ? {
              machine_id: machineId,
            }
          : {},
      },
      enabled: true,
      // queryFn: async () => {
      //   return await api({
      //     url: "session",
      //     init:

      //       body: JSON.stringify({
      //         machine_id: machineId,
      //       }),
      //     ,
      //   });
      // },
    }),
  };
}
