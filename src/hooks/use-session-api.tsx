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
        return await api({
          url: `session/${data.sessionId}`,
          init: {
            method: "DELETE",
            body: JSON.stringify({
              wait_for_shutdown: data.waitForShutdown,
            }),
          },
        });
      },
    }),
    listSession: useQuery<any[]>({
      queryKey: ["sessions"],
      queryKeyHashFn: (queryKey) => {
        return [...queryKey, machineId].join(",");
      },
      refetchInterval: 2000,
      meta: {
        params: {
          machine_id: machineId,
        },
      },
      enabled: !!machineId,
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
