/*
Copyright 2022 Usman <usmany@element.io>

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

import React, { createContext, useState } from "react";

export type TFavMessageState = {
    favMsgIds: string[];
    starStatus: boolean;
    setfavMsgIds: (favMsgIds: string[]) => void;
    setStarStatus: (starStatus: boolean) => void;
    starMessage: (eventId: string) => void;
};

const initialState: TFavMessageState = {
    favMsgIds: [],
    starStatus: false,
    setfavMsgIds: null,
    setStarStatus: null,
    starMessage: null,
};

export const FavMessageContext = createContext<TFavMessageState | null>(initialState);

const FavMessageProvider = ({ children }) => {
    const [favMsgIds, setfavMsgIds] = useState<string[]>(initialState.favMsgIds);
    const [starStatus, setStarStatus] = useState<boolean>(initialState.starStatus);

    const starMessage = (eventId: string) => {
        if (favMsgIds.includes(eventId)) {
            favMsgIds.splice(favMsgIds.indexOf(eventId), 1);
            setStarStatus(false);
        } else {
            favMsgIds.push(eventId);
            setStarStatus(true);
        }
    };

    return (
        <FavMessageContext.Provider value={{ favMsgIds, starStatus, setfavMsgIds, setStarStatus, starMessage }}>
            { children }
        </FavMessageContext.Provider>
    );
};
export default FavMessageProvider;

