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

import React, { createContext, useEffect, useReducer } from "react";

import { Action } from "../dispatcher/actions";

let cachedFavouriteMessageIds: string[] = [];

const ActionHandler = (_, action: {type: Action, eventId: string}) => {
    switch (action.type) {
        case Action.OnAddToFavourite:
            cachedFavouriteMessageIds.push(action.eventId);
            break;
        case Action.OnRemoveFromFavourite:
            cachedFavouriteMessageIds.splice(cachedFavouriteMessageIds.indexOf(action.eventId), 1);
            break;
        default:
            throw new Error("Ensure a valid Action is dispatched");
    }
    return [...cachedFavouriteMessageIds];
};

type TContext = {
    favouriteMessageIds: string[];
    dispatch: React.Dispatch<any>;
};
export const FavouriteMessageContext = createContext<TContext | null>({
    favouriteMessageIds: [],
    dispatch: null,
});

const FavouriteMessageProvider = ({ children }) => {
    const [favouriteMessageIds, dispatch] = useReducer(ActionHandler,
        JSON.parse(localStorage.getItem('io_element_favouriteMessages')) ?? []);

    useEffect(() => {
        //if on page refresh cachedFavouriteMessageIds.length is 0, populate the array
        //with fetched items from localStorage
        if (cachedFavouriteMessageIds.length === 0) cachedFavouriteMessageIds = favouriteMessageIds;
        localStorage.setItem('io_element_favouriteMessages', JSON.stringify(cachedFavouriteMessageIds));
    }, [favouriteMessageIds]);

    return (
        <FavouriteMessageContext.Provider value={{ favouriteMessageIds, dispatch }}>
            { children }
        </FavouriteMessageContext.Provider>
    );
};
export default FavouriteMessageProvider;

