/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { IContent, MatrixEvent } from "matrix-js-sdk/src/models/event";
import { useRef } from "react";

export interface FavouriteStorage {
    eventId: string;
    roomId: string;
    content: IContent;
}

// Global variable tracking LocalStorage state
let ioElementFavouriteMessages: FavouriteStorage[] = null;

function loadFavourites(): FavouriteStorage[] {
    try {
        return JSON.parse(localStorage?.getItem("io_element_favouriteMessages") ?? "[]");
    } catch (e) {
        console.error(e);
        return [];
    }
}

function saveFavourites(): void {
    localStorage?.setItem("io_element_favouriteMessages", JSON.stringify(ioElementFavouriteMessages));
}

function clearFavourites(): void {
    ioElementFavouriteMessages.length = 0;
    localStorage.removeItem("io_element_favouriteMessages");
}

export default function useFavouriteMessages() {
    if (ioElementFavouriteMessages === null) {
        ioElementFavouriteMessages = loadFavourites();
    }

    const favChange = useRef(null);

    const isFavourite = (eventId: string): boolean => {
        return ioElementFavouriteMessages.some((f) => f.eventId === eventId);
    };

    const toggleFavourite = (mxEvent: MatrixEvent) => {
        const eventId = mxEvent.getId();
        const roomId = mxEvent.getRoomId();
        const content = mxEvent.getContent();

        const idx = ioElementFavouriteMessages.findIndex((f) => f.eventId === eventId);

        if (idx !== -1) {
            ioElementFavouriteMessages.splice(idx, 1);
        } else {
            ioElementFavouriteMessages.push({ eventId, roomId, content });
        }

        saveFavourites();
        favChange.current?.();
    };

    const clearFavouriteMessages = () => {
        clearFavourites();
        favChange.current?.();
    };

    const getFavouriteMessages = (): FavouriteStorage[] => {
        return JSON.parse(JSON.stringify(ioElementFavouriteMessages));
    };

    const onFavouritesChanged = (listener: () => void) => {
        favChange.current = listener;
    };

    return {
        getFavouriteMessages,
        isFavourite,
        toggleFavourite,
        clearFavouriteMessages,
        onFavouritesChanged,
    };
}
