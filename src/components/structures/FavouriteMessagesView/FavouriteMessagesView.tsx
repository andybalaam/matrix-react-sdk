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

import React, { useContext, useState } from "react";
import { MatrixClient, MatrixEvent, RelationType } from "matrix-js-sdk/src/matrix";
import { logger } from "matrix-js-sdk/src/logger";

import MatrixClientContext from "../../../contexts/MatrixClientContext";
import useFavouriteMessages, { FavouriteStorage } from "../../../hooks/useFavouriteMessages";
import ResizeNotifier from "../../../utils/ResizeNotifier";
import FavouriteMessagesPanel from "./FavouriteMessagesPanel";

interface IProps {
    resizeNotifier?: ResizeNotifier;
}

const FavouriteMessagesView = ({ resizeNotifier }: IProps) => {
    const cli = useContext<MatrixClient>(MatrixClientContext);

    function filterFavourites(searchQuery: string, favouriteMessages: FavouriteStorage[]): FavouriteStorage[] {
        return favouriteMessages.filter((f) => f.content.body.trim().toLowerCase().includes(searchQuery));
    }

    /** If the event was edited, update it with the replacement content */
    async function updateEventIfEdited(event: MatrixEvent) {
        const roomId = event.getRoomId();
        const eventId = event.getId();
        const { events } = await cli.relations(roomId, eventId, RelationType.Replace, null, { limit: 1 });
        const editEvent = events?.length > 0 ? events[0] : null;
        if (editEvent) {
            event.makeReplaced(editEvent);
        }
    }

    async function fetchEvent(favourite: FavouriteStorage): Promise<MatrixEvent | null> {
        try {
            const evJson = await cli.fetchRoomEvent(favourite.roomId, favourite.eventId);
            const event = new MatrixEvent(evJson);
            const roomId = event?.getRoomId();
            const room = roomId ? cli.getRoom(roomId) : null;
            if (!event || !room) {
                return null;
            }

            // Decrypt the event
            if (event.isEncrypted()) {
                // Modifies the event in-place (!)
                await cli.decryptEventIfNeeded(event);
            }

            // Inject sender information
            event.sender = room.getMember(event.getSender())!;

            await updateEventIfEdited(event);

            return event;
        } catch (err) {
            logger.error(err);
            return null;
        }
    }

    async function calcEvents(searchQuery: string, favouriteMessages: FavouriteStorage[]): Promise<MatrixEvent[]> {
        const displayedFavourites = filterFavourites(searchQuery, favouriteMessages);
        return Promise.all(displayedFavourites.map(fetchEvent).filter((e) => e != null));
    }

    const { getFavouriteMessages, onFavouritesChanged } = useFavouriteMessages();
    const [searchQuery, setSearchQuery] = useState("");
    const [events, setEvents] = useState(async () => {
        const events = await calcEvents(searchQuery, getFavouriteMessages());
        return events;
    });

    onFavouritesChanged(async () => {
        setEvents(async () => await calcEvents(searchQuery, getFavouriteMessages()));
    });

    const handleSearchQuery = (query: string) => {
        setSearchQuery(query);
    };

    const props = {
        events,
        resizeNotifier,
        searchQuery,
        handleSearchQuery,
        cli,
    };

    return <FavouriteMessagesPanel {...props} />;
};

export default FavouriteMessagesView;
