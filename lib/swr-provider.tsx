"use client";

import { SWRConfig } from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher,
                revalidateOnFocus: false,      // Không re-fetch khi đổi tab
                revalidateOnReconnect: false,   // Không re-fetch khi reconnect
                dedupingInterval: 10000,        // Dedup requests trong 10s
                errorRetryCount: 2,             // Chỉ retry 2 lần
                keepPreviousData: true,         // Giữ data cũ khi loading
            }}
        >
            {children}
        </SWRConfig>
    );
}
