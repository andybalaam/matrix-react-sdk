/*
Copyright 2021 The Matrix.org Foundation C.I.C.
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

import React from "react";
import Waveform from "./Waveform";
import { replaceableComponent } from "../../../utils/replaceableComponent";
import { MarkedExecution } from "../../../utils/MarkedExecution";
import {
    IRecordingUpdate,
    VoiceRecording,
} from "../../../voice/VoiceRecording";

interface IProps {
    recorder?: VoiceRecording;
}

interface IState {
    waveform: number[]
}

/**
 * A waveform which shows the waveform of a live recording
 */
@replaceableComponent("views.voice_messages.LiveRecordingWaveform")
export default class LiveRecordingWaveform extends React.PureComponent<IProps, IState> {
    public static defaultProps = {
        progress: 1,
    };

    private waveform: number[] = [];
    private scheduledUpdate = new MarkedExecution(
        () => this.updateWaveform(),
        () => requestAnimationFrame(() => this.scheduledUpdate.trigger()),
    )

    constructor(props) {
        super(props);
        this.state = {
            waveform: [],
        }
    }

    componentDidMount() {
        this.props.recorder.liveData.onUpdate((update: IRecordingUpdate) => {
            this.waveform = update.waveform;
            this.scheduledUpdate.mark();
        });
    }

    private updateWaveform() {
        this.setState({
            waveform: this.waveform,
        })
    }

    public render() {
        return <Waveform relHeights={this.state.waveform} />;
    }
}
