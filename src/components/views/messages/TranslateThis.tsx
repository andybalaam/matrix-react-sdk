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

import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react';
import { franc } from 'franc-min';

import { _t } from "../../../languageHandler";
import AccessibleButton, { ButtonEvent } from '../elements/AccessibleButton';
import {iso6393To1} from 'iso-639-3';

enum Status {
    Ready,
    Translating,
    Translated,
    Failed,
}

interface IProps {
    text: string;
}

export function TranslateThis(props: IProps) {
    const [status, setStatus] = useState(Status.Ready);
    const [translation, setTranslation] = useState();

    switch (status) {
        case Status.Translated: return renderTranslated(translation);
        default: return renderButton(props.text, status, setStatus, setTranslation);
    }
}

/**
 * Decide whether we should offer a "translate this" button for a given
 * message.
 */
export function shouldOfferTranslation(_messageSender: string, _currentUser: string, messageText: string) {
    // Can check here for whether the messageSender === currentUser and return
    // false, but for ease of demoing, we allow translating your own messages.

    const targetLanguage = window.navigator.language.substring(0, 2);
    const sourceLanguage = francDetectLanguage(messageText);

    return targetLanguage !== sourceLanguage;
}

function renderButton(text: string, status: Status, setStatus: any, setTranslation: any): ReactElement {
    return <div className="mx_TranslateThis">
        <AccessibleButton
            onClick={onTranslateThisClick(text, setStatus, setTranslation)}
            className="mx_TranslateThis_button"
            disabled={status === Status.Translating}
        >
            { message(status) }
        </AccessibleButton>
    </div>;
}

function renderTranslated(translation: string): ReactElement {
    return <div className="mx_TranslateThis mx_TranslateThis_translated">
        <div className="mx_TranslateThis_translation">{ _t("Translation:") }</div>
        <div>{ translation }</div>
    </div>;
}

function onTranslateThisClick(
    text: string,
    setStatus: Dispatch<SetStateAction<Status>>,
    setTranslation: Dispatch<SetStateAction<string>>,
) {
    return async (_ev: ButtonEvent) => {
        setStatus(Status.Translating);

        setStatus(Status.Translating);
        const translation = await bergamotTranslate(text);

        if (translation !== null) {
            setTranslation(translation);
            setStatus(Status.Translated);
        } else {
            setTranslation(null);
            setStatus(Status.Failed);
        }
    };
}

function message(status: Status): string {
    switch (status) {
        case Status.Ready: return _t("Translate this");
        case Status.Translating: return _t("Translating ...");
        default: return _t("Translation failed. Try again?");
    }
}

// Translation technology-specific code

/**
 * Return the ISO-6391 language code for this text e.g. "fr" or "und"
 */
function francDetectLanguage(messageText: string): string {
    const lang3 = franc(messageText);
    const lang2 = iso6393To1[lang3];
    return lang2 ?? "und";
}

async function bergamotTranslate(_messageText: string): Promise<string | null> {
    return "translated";
}
