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
import { useRef, useState } from "react";

interface IButtonProp {
    mxEvent?: MatrixEvent;
}

interface FavouriteStorage {
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

export default function useFavouriteMessages(props?: IButtonProp) {
    if (ioElementFavouriteMessages === null) {
        ioElementFavouriteMessages = loadFavourites();
    }

    const sortState = useRef(false);
    const isSearchClicked = useRef(false);

    const [, setX] = useState<string[]>();
    const eventId = props?.mxEvent.getId();
    const roomId = props?.mxEvent.getRoomId();
    const content = props?.mxEvent.getContent();

    const isFavourite = (): boolean => {
        return ioElementFavouriteMessages.some((f) => f.eventId === eventId);
    };

    const toggleFavourite = () => {
        const idx = ioElementFavouriteMessages.findIndex((f) => f.eventId === eventId);

        if (idx !== -1) {
            ioElementFavouriteMessages.splice(idx, 1);
        } else {
            ioElementFavouriteMessages.push({ eventId, roomId, content });
        }

        saveFavourites();

        // Force a re-render
        setX([]);
    };

    const reorderFavouriteMessages = () => {
        sortState.current = !sortState.current;
    };

    const setSearchState = (val: boolean) => {
        isSearchClicked.current = val;
    };

    const clearFavouriteMessages = () => {
        clearFavourites();
    };

    const getFavouriteMessagesIds = () => {
        const ret = JSON.parse(JSON.stringify(ioElementFavouriteMessages));
        if (sortState.current) {
            ret.reverse();
        }
        return ret;
    };

    return {
        isFavourite,
        toggleFavourite,
        getFavouriteMessagesIds,
        reorderFavouriteMessages,
        clearFavouriteMessages,
        setSearchState,
        isSearchClicked: isSearchClicked.current,
    };
}
