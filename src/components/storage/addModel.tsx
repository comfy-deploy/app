import { api } from "@/lib/api";
import type { AddModelRequest } from "@/types/models";

// export async function addModel(props: {
//   folder_path: string;
//   filename: string;
//   url: string;
// }) {
//   return await api({
//     url: "file",
//     init: {
//       method: "POST",
//       body: JSON.stringify(props),
//     },
//   });
// }

export async function addModel(props: AddModelRequest) {
  return await api({
    url: "file",
    init: {
      method: "POST",
      body: JSON.stringify(props),
    },
  });
}
