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
      }) => {
        console.log(data);
        return await api({
          url: `session/${data.sessionId}`,
          init: {
            method: "DELETE",
          },
        });
      },
    }),
    listSession: useQuery<any[]>({
      queryKey: ["sessions"],
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
