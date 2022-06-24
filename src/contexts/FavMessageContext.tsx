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

import React, { createContext, useEffect, useReducer } from "react";

import { Action } from "../dispatcher/actions";

let cacheState: string[] = [];

const FavMessageReducer = (_, action: {type: Action, eventId: string}) => {
    switch (action.type) {
        case Action.OnAddToFavourite:
            cacheState.push(action.eventId);
            break;
        case Action.OnRemoveFromFavourite:
            cacheState.splice(cacheState.indexOf(action.eventId), 1);
            break;
        default:
            throw new Error("Ensure a valid Action is dispatched");
    }
    return [...cacheState];
};

type TContext = {
    favMsgIds: string[];
    dispatch: React.Dispatch<any>;
};
export const FavMessageContext = createContext<TContext | null>({
    favMsgIds: [],
    dispatch: null,
});

const FavMessageProvider = ({ children }) => {
    const [favMsgIds, dispatch] = useReducer(FavMessageReducer,
        JSON.parse(localStorage.getItem('mx_favMsgIds')) ?? []);

    useEffect(() => {
        //if on page refresh cacheState.length is 0, populate the array
        //with fetched items from localStorage
        if (cacheState.length === 0) cacheState = favMsgIds;
        localStorage.setItem('mx_favMsgIds', JSON.stringify(cacheState));
    }, [favMsgIds]);

    return (
        <FavMessageContext.Provider value={{ favMsgIds, dispatch }}>
            { children }
        </FavMessageContext.Provider>
    );
};
export default FavMessageProvider;

