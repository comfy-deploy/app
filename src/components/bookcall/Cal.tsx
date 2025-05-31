"use client";

import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

export default function Calendar(props: {
  onBookingSuccessful: (e: any) => void;
}) {
  //   const initCal = useRef(false);
  const { user } = useUser();

  useEffect(() => {
    // if (initCal.current) return;
    const Cal = (window as any).Cal;

    // initCal.current = true;

    Cal("inline", {
      elementOrSelector: "#my-cal-inline",
      calLink: "team/comfy-deploy/demo",
      layout: "month_view",
      config: {
        name:
          user?.username ??
          `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
        email: user?.emailAddresses?.[0]?.emailAddress ?? "",
      },
    });

    Cal("ui", {
      styles: { branding: { brandColor: "#000000" } },
      hideEventTypeDetails: false,
      layout: "month_view",
    });

    const callback = (e: any) => {
      console.log("bookingSuccessful", e);
      props.onBookingSuccessful(e);
    };

    const event = {
      action: "bookingSuccessful",
      callback: callback,
    };

    Cal("on", event);

    return () => {
      Cal("off", event);
    };
  }, []);

  return (
    <div
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      id="my-cal-inline"
    />
  );
}
